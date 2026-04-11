import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/proof-data/:id
 * 
 * Returns the proof PDF as a Base64 string inside a JSON object.
 * This "Stealth" approach prevents download managers (like IDM) from 
 * intercepting the request, as they ignore JSON data but catch raw PDFs.
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proofId } = await params

  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const admin = createAdminClient()

  // 2. Fetch proof record
  const { data: proof, error: proofErr } = await admin
    .from('proofs')
    .select('id, proof_file_url, order_item_id')
    .eq('id', proofId)
    .single()

  if (proofErr || !proof || !proof.proof_file_url) {
    return NextResponse.json({ error: 'Proof not found' }, { status: 404 })
  }

  // 3. Resolve storage path
  const url = proof.proof_file_url
  let buffer: ArrayBuffer

  if (url.includes('atqjywawohnhvlnggozu.supabase.co')) {
    const bucket = 'proofs'
    const markers = [`/storage/v1/object/public/${bucket}/`, `/storage/v1/object/sign/${bucket}/`, `/storage/v1/object/authenticated/${bucket}/`]
    let storagePath = null
    for (const marker of markers) {
      const idx = url.indexOf(marker)
      if (idx !== -1) {
        storagePath = url.slice(idx + marker.length).split('?')[0]
        break
      }
    }

    if (storagePath) {
      const { data: fileBlob, error: downloadErr } = await admin.storage.from(bucket).download(storagePath)
      if (downloadErr || !fileBlob) return NextResponse.json({ error: 'Storage error' }, { status: 404 })
      buffer = await fileBlob.arrayBuffer()
    } else {
      const res = await fetch(url)
      buffer = await res.arrayBuffer()
    }
  } else {
    const res = await fetch(url)
    buffer = await res.arrayBuffer()
  }

  // 4. Return as Base64 JSON (Invisible to IDM)
  const base64 = Buffer.from(buffer).toString('base64')
  
  return NextResponse.json({
    data: base64,
    mimeType: 'application/pdf',
    filename: `proof_${proofId}.pdf`
  }, {
    headers: {
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    }
  })
}
