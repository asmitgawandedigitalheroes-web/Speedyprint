import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Load job (verify ownership)
  const { data: job } = await admin
    .from('csv_jobs')
    .select('id, user_id, status, original_filename, order_item_id, column_mapping')
    .eq('id', id)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (job.status !== 'completed') {
    return NextResponse.json({ error: 'Job not yet completed' }, { status: 400 })
  }

  // ── Resolve storage path prefix ───────────────────────────────────────────
  const columnMapping = (job.column_mapping ?? {}) as Record<string, string>
  let pathPrefix = `csv/${id}/`
  let productType = 'files'

  if (job.order_item_id) {
    const { data: item } = await admin
      .from('order_items')
      .select('order_id, product_template:product_templates(name)')
      .eq('id', job.order_item_id)
      .single()

    if (item?.order_id) {
      const tmplName = (item.product_template as unknown as { name: string } | null)?.name ?? 'files'
      productType = tmplName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
      pathPrefix = `production/${item.order_id}/${productType}/`
    }
  }

  // ── List files in Supabase Storage ────────────────────────────────────────
  const { data: fileList, error: listErr } = await admin.storage
    .from('production')
    .list(pathPrefix, { limit: 5100 })

  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })
  if (!fileList || fileList.length === 0) {
    return NextResponse.json({ error: 'No generated files found for this job' }, { status: 404 })
  }

  // Filter to PDF files only (exclude any folder placeholder items)
  const pdfFiles = fileList.filter((f) => f.name.endsWith('.pdf') && f.id)

  if (pdfFiles.length === 0) {
    return NextResponse.json({ error: 'No PDF files found' }, { status: 404 })
  }

  // ── Build ZIP ─────────────────────────────────────────────────────────────
  const zip = new JSZip()
  const folderName = (job.original_filename ?? `batch-${id.slice(0, 8)}`)
    .replace(/\.csv$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')

  const folder = zip.folder(folderName) ?? zip

  // Download all PDFs in parallel (cap concurrency at 20 to avoid memory spikes)
  const CONCURRENCY = 20
  for (let i = 0; i < pdfFiles.length; i += CONCURRENCY) {
    const chunk = pdfFiles.slice(i, i + CONCURRENCY)
    await Promise.all(
      chunk.map(async (f) => {
        const filePath = pathPrefix + f.name
        const { data: blob, error: dlErr } = await admin.storage
          .from('production')
          .download(filePath)
        if (blob && !dlErr) {
          const buf = await blob.arrayBuffer()
          folder.file(f.name, buf)
        }
      })
    )
  }

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  const downloadName = `${folderName}-production-files.zip`

  // Convert Node Buffer → Uint8Array so NextResponse accepts it
  const zipBytes = new Uint8Array(zipBuffer)

  return new NextResponse(zipBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${downloadName}"`,
      'Content-Length': String(zipBytes.byteLength),
    },
  })
}
