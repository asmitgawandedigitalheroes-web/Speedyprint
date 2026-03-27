import { NextRequest, NextResponse, after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generatePDF, mergeVariables, type CanvasJSON } from '@/lib/pdf/generator'
import type { ProductTemplate } from '@/types'

// ─── Background processing ────────────────────────────────────────────────────

async function processCSVJob(jobId: string): Promise<void> {
  const admin = createAdminClient()

  // Load full job
  const { data: job } = await admin.from('csv_jobs').select('*').eq('id', jobId).single()
  if (!job) return

  const columnMapping = (job.column_mapping ?? {}) as Record<string, string>
  const templateId = columnMapping._template_id as string | undefined

  // ── Resolve template ──────────────────────────────────────────────────────
  let template: ProductTemplate | null = null

  if (templateId) {
    const { data } = await admin.from('product_templates').select('*').eq('id', templateId).single()
    template = data as ProductTemplate | null
  }

  if (!template && job.order_item_id) {
    const { data: item } = await admin
      .from('order_items')
      .select('product_template:product_templates(*)')
      .eq('id', job.order_item_id)
      .single()
    template = (item?.product_template as unknown as ProductTemplate) ?? null
  }

  if (!template) {
    await admin
      .from('csv_jobs')
      .update({ status: 'error', error_log: [{ error: 'Template not found' }] })
      .eq('id', jobId)
    return
  }

  const designId = columnMapping._design_id as string | undefined

  // Resolve base canvas: prefer design's canvas_json, fallback to template's template_json
  let baseCanvas = (template.template_json as any) as CanvasJSON
  if (designId) {
    const { data: design } = await admin.from('designs').select('canvas_json').eq('id', designId).single()
    if (design?.canvas_json) {
      baseCanvas = design.canvas_json as any
    }
  }

  const printSpecs = {
    print_width_mm: template.print_width_mm ?? 100,
    print_height_mm: template.print_height_mm ?? 70,
    bleed_mm: template.bleed_mm ?? 3,
  }

  // Field map — strip internal _keys
  const fieldMap = Object.fromEntries(
    Object.entries(columnMapping).filter(([k]) => !k.startsWith('_'))
  ) as Record<string, string>

  // ── Order reference for file naming ──────────────────────────────────────
  let orderRef = `JOB-${jobId.slice(0, 8).toUpperCase()}`
  let orderId: string | null = null
  const productType = template.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')

  if (job.order_item_id) {
    const { data: item } = await admin
      .from('order_items')
      .select('order_id, orders!inner(order_number)')
      .eq('id', job.order_item_id)
      .single()
    if (item?.order_id) {
      orderId = item.order_id
      const orderNum = (item as unknown as { orders: { order_number: string } }).orders?.order_number
      orderRef = orderNum ?? `ORD-${(orderId as string).slice(0, 8).toUpperCase()}`
    }
  }

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const rows = (job.parsed_data ?? []) as Record<string, string>[]
  const totalRows = rows.length
  const errors: { row: number; error: string }[] = []
  const generatedPaths: string[] = []

  // ── Process rows ──────────────────────────────────────────────────────────
  for (let i = 0; i < totalRows; i++) {
    const row = rows[i]
    try {
      // Build variables — mapped fields first, then raw columns for {{Header}} patterns
      const variables: Record<string, string> = {}
      for (const [fieldKey, csvCol] of Object.entries(fieldMap)) {
        variables[fieldKey] = row[csvCol] ?? ''
      }
      for (const [col, val] of Object.entries(row)) {
        if (!(col in variables)) variables[col] = val
      }

      const mergedCanvas = mergeVariables(baseCanvas, variables)
      const pdfBytes = await generatePDF(mergedCanvas, printSpecs, { isProof: false, includeBleed: true })

      // Filename: {OrderID}_{ProductType}_{RowNum}_{Name}_{Date}.pdf
      const rowNum = String(i + 1).padStart(3, '0')
      const firstVal = (Object.values(variables)[0] ?? 'item')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 20) || 'item'
      const fileName = `${orderRef}_${productType}_${rowNum}_${firstVal}_${dateStr}.pdf`

      // Storage path: /production/{order_id}/{product_type}/ or /csv/{job_id}/
      const storagePath = orderId
        ? `production/${orderId}/${productType}/${fileName}`
        : `csv/${jobId}/${fileName}`

      const { error: uploadErr } = await admin.storage
        .from('production')
        .upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: true })

      if (uploadErr) {
        errors.push({ row: i + 1, error: uploadErr.message })
      } else {
        const { data: { publicUrl } } = admin.storage.from('production').getPublicUrl(storagePath)
        generatedPaths.push(publicUrl)

        if (job.order_item_id) {
          await admin.from('production_files').insert({
            order_item_id: job.order_item_id,
            proof_id: null,
            file_url: publicUrl,
            file_type: 'pdf',
            file_name: fileName,
            resolution_dpi: 300,
            has_bleed: true,
            metadata: { csv_job_id: jobId, row_index: i, variables },
          })
        }
      }
    } catch (rowErr) {
      errors.push({ row: i + 1, error: String(rowErr) })
    }

    // Progress update every 10 rows or on last row
    if (i % 10 === 0 || i === totalRows - 1) {
      await admin
        .from('csv_jobs')
        .update({
          progress: Math.round(((i + 1) / totalRows) * 100),
        })
        .eq('id', jobId)
    }
  }

  // ── Finalize ──────────────────────────────────────────────────────────────
  await admin
    .from('csv_jobs')
    .update({
      status: errors.length === totalRows ? 'error' : 'completed',
      progress: 100,
      error_log: errors,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
}

// ─── Route handler — responds 202, runs job in background via after() ─────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: job } = await admin
    .from('csv_jobs')
    .select('id, user_id, status, row_count')
    .eq('id', id)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (job.status === 'processing') {
    return NextResponse.json({ error: 'Job is already processing' }, { status: 409 })
  }

  // Immediately mark processing so the progress indicator starts
  await admin
    .from('csv_jobs')
    .update({ status: 'processing', progress: 0, error_log: [] })
    .eq('id', id)

  // Run processing AFTER this response is sent — non-blocking
  after(async () => {
    await processCSVJob(id)
  })

  return NextResponse.json({ started: true, job_id: id, row_count: job.row_count }, { status: 202 })
}
