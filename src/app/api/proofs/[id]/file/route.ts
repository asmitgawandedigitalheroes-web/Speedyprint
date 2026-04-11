import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/proofs/:id/file
 *
 * Proxies the proof PDF through Next.js so the browser never has to reach
 * Supabase storage directly.  This solves all three failure modes in one go:
 *   1. Private bucket  → admin service-role key bypasses RLS
 *   2. Supabase iframe headers (X-Frame-Options / CSP) → our response has none
 *   3. CORS / mixed-content → same origin as the app
 *
 * The response is cached privately for 1 hour so repeat views are instant.
 */

function extractStoragePath(url: string, bucket: string): string | null {
  const markers = [
    `/storage/v1/object/public/${bucket}/`,
    `/storage/v1/object/sign/${bucket}/`,
    `/storage/v1/object/authenticated/${bucket}/`,
  ]
  for (const marker of markers) {
    const idx = url.indexOf(marker)
    if (idx !== -1) return url.slice(idx + marker.length).split('?')[0]
  }
  return null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proofId } = await params

  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const admin = createAdminClient()

  // ── Fetch proof record ────────────────────────────────────────────────────
  const { data: proof, error: proofErr } = await admin
    .from('proofs')
    .select('id, proof_file_url, order_item_id')
    .eq('id', proofId)
    .single()

  if (proofErr || !proof) return new NextResponse('Proof not found', { status: 404 })
  if (!proof.proof_file_url) return new NextResponse('No file available for this proof', { status: 404 })

  // ── Ownership check ───────────────────────────────────────────────────────
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'production_staff'

  if (!isAdmin) {
    const { data: item } = await admin
      .from('order_items')
      .select('order:orders(user_id)')
      .eq('id', proof.order_item_id)
      .single()

    const ownerUserId = (item?.order as any)?.user_id
    if (ownerUserId !== user.id) return new NextResponse('Forbidden', { status: 403 })
  }

  // ── Resolve storage path ──────────────────────────────────────────────────
  const storagePath = extractStoragePath(proof.proof_file_url, 'proofs')
  if (!storagePath) {
    // URL is not a recognised Supabase storage path — try fetching it directly
    try {
      const upstream = await fetch(proof.proof_file_url)
      if (!upstream.ok) return new NextResponse('File not accessible', { status: 502 })
      const buffer = await upstream.arrayBuffer()
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream', // Stealth type to bypass interceptors like IDM
          'Content-Disposition': 'inline',
          'Cache-Control': 'private, max-age=3600',
          'X-Frame-Options': 'SAMEORIGIN',
          'Content-Security-Policy': "frame-ancestors 'self'",
        },
      })
    } catch {
      return new NextResponse('File not accessible', { status: 502 })
    }
  }

  // ── Download via service-role key (bypasses all RLS / bucket policies) ────
  const { data: fileBlob, error: downloadErr } = await admin.storage
    .from('proofs')
    .download(storagePath)

  if (downloadErr || !fileBlob) {
    return new NextResponse('File not found in storage', { status: 404 })
  }

  const buffer = await fileBlob.arrayBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream', // Stealth type to bypass interceptors like IDM
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=3600',
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "frame-ancestors 'self'",
    },
  })
}
