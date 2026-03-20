import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generatePDF, mergeVariables } from '@/lib/pdf/generator'
import type { ProductTemplate } from '@/types'

const SAMPLE_ROWS = 5

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Load the CSV job
  const { data: job } = await admin
    .from('csv_jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (!job) return NextResponse.json({ error: 'CSV job not found' }, { status: 404 })

  // Allow admins/production_staff to access any job; customers can only access their own
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'production_staff'
  if (!isAdmin && job.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!['validated', 'uploaded'].includes(job.status)) {
    return NextResponse.json({ error: 'Job must be validated before generating sample proof' }, { status: 400 })
  }

  const columnMapping = (job.column_mapping ?? {}) as Record<string, string>
  // Resolve template: prefer mapping override, fall back to job's product_template_id
  const templateId = (columnMapping._template_id as string | undefined) ?? job.product_template_id

  // Resolve template
  let template: ProductTemplate | null = null
  if (templateId) {
    const { data } = await admin.from('product_templates').select('*').eq('id', templateId).single()
    template = data as ProductTemplate | null
  }

  if (!template) {
    return NextResponse.json({ error: 'Template not found for this CSV job' }, { status: 400 })
  }

  const printSpecs = {
    print_width_mm: template.print_width_mm ?? 100,
    print_height_mm: template.print_height_mm ?? 70,
    bleed_mm: template.bleed_mm ?? 3,
  }
  const baseCanvas = template.template_json as Parameters<typeof generatePDF>[0]

  const fieldMap = Object.fromEntries(
    Object.entries(columnMapping).filter(([k]) => !k.startsWith('_'))
  ) as Record<string, string>

  const rows = (job.parsed_data ?? []) as Record<string, string>[]
  const sampleRows = rows.slice(0, SAMPLE_ROWS)
  const proofUrls: string[] = []
  const errors: { row: number; error: string }[] = []

  for (let i = 0; i < sampleRows.length; i++) {
    const row = sampleRows[i]
    try {
      const variables: Record<string, string> = {}
      for (const [fieldKey, csvCol] of Object.entries(fieldMap)) {
        variables[fieldKey] = row[csvCol] ?? ''
      }
      for (const [col, val] of Object.entries(row)) {
        if (!(col in variables)) variables[col] = val
      }

      const mergedCanvas = mergeVariables(baseCanvas, variables)
      const pdfBytes = await generatePDF(mergedCanvas, printSpecs, { isProof: true, includeBleed: false })

      const fileName = `sample_${id}_row${i + 1}.pdf`
      const storagePath = `csv-proofs/${id}/${fileName}`

      const { error: uploadErr } = await admin.storage
        .from('proofs')
        .upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: true })

      if (!uploadErr) {
        const { data: { publicUrl } } = admin.storage.from('proofs').getPublicUrl(storagePath)
        proofUrls.push(publicUrl)
      } else {
        errors.push({ row: i + 1, error: uploadErr.message })
      }
    } catch (rowErr) {
      errors.push({ row: i + 1, error: String(rowErr) })
    }
  }

  // Mark job as having sample proof
  await admin
    .from('csv_jobs')
    .update({
      status: 'validated', // keep validated — customer hasn't approved yet
      column_mapping: {
        ...columnMapping,
        _sample_proof_urls: JSON.stringify(proofUrls),
        _sample_proof_generated_at: new Date().toISOString(),
      },
    })
    .eq('id', id)

  return NextResponse.json({
    sample_count: sampleRows.length,
    total_rows: rows.length,
    proof_urls: proofUrls,
    errors,
  })
}
