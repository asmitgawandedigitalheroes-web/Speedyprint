import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generatePDF, mergeVariables, type CanvasJSON } from '@/lib/pdf/generator'
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

  const fieldMap = Object.fromEntries(
    Object.entries(columnMapping).filter(([k]) => !k.startsWith('_'))
  ) as Record<string, string>
  const designId = columnMapping._design_id as string | undefined

  // Resolve base canvas: prefer design's canvas_json, fallback to template's template_json
  let baseCanvas = template.template_json as CanvasJSON
  if (designId) {
    const { data: design } = await admin.from('designs').select('canvas_json').eq('id', designId).single()
    if (design?.canvas_json) {
      baseCanvas = design.canvas_json as CanvasJSON
    }
  }

  const rows = (job.parsed_data ?? []) as Record<string, string>[]
  const sampleRows = rows.slice(0, SAMPLE_ROWS)
  const mergedCanvases: any[] = []
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

      const merged = mergeVariables(baseCanvas, variables)
      mergedCanvases.push(merged)
    } catch (rowErr) {
      errors.push({ row: i + 1, error: String(rowErr) })
    }
  }

  if (mergedCanvases.length === 0) {
    return NextResponse.json({ error: 'Failed to generate any sample canvases', details: errors }, { status: 500 })
  }

  let combinedProofUrl = ''
  try {
    const pdfBytes = await generatePDF(mergedCanvases, printSpecs, { isProof: true, includeBleed: false })
    const fileName = `combined_proof_${id}.pdf`
    const storagePath = `csv-proofs/${id}/${fileName}`

    const { error: uploadErr } = await admin.storage
      .from('proofs')
      .upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) throw uploadErr

    const { data: { publicUrl } } = admin.storage.from('proofs').getPublicUrl(storagePath)
    combinedProofUrl = publicUrl
  } catch (err: any) {
    return NextResponse.json({ error: `PDF Generation/Upload failed: ${err.message}` }, { status: 500 })
  }

  // Mark job as having sample proof
  await admin
    .from('csv_jobs')
    .update({
      status: 'validated',
      column_mapping: {
        ...columnMapping,
        _combined_proof_url: combinedProofUrl,
        _sample_proof_generated_at: new Date().toISOString(),
      },
    })
    .eq('id', id)

  return NextResponse.json({
    sample_count: mergedCanvases.length,
    total_rows: rows.length,
    proof_url: combinedProofUrl,
    errors,
  })
}
