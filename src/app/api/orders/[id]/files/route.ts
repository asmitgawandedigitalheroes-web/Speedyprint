import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { buildOrderZip } from '@/lib/production/zipper'

type RouteParams = { params: Promise<{ id: string }> }

// ── GET /api/orders/:id/files ─────────────────────────────────────────────────
// Returns the list of production files for the authenticated customer's order.
// Only files whose order belongs to the requesting user are returned.
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Verify ownership — fetch order only if it belongs to this user
    const { data: order } = await admin
      .from('orders')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const { data: orderItems } = await admin
      .from('order_items')
      .select('id')
      .eq('order_id', id)

    if (!orderItems || orderItems.length === 0)
      return NextResponse.json({ files: [] })

    const itemIds = orderItems.map((item) => item.id)

    const { data: files } = await admin
      .from('production_files')
      .select('id, file_name, file_url, file_type, resolution_dpi, has_bleed, generated_at, order_item_id')
      .in('order_item_id', itemIds)
      .eq('file_type', 'pdf')
      .order('generated_at', { ascending: false })

    return NextResponse.json({ files: files ?? [] })
  } catch (err) {
    console.error('[CustomerFiles] GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}

// ── POST /api/orders/:id/files ────────────────────────────────────────────────
// Streams a ZIP of all production PDF files for the customer's order.
// Returns 404 if no production files have been generated yet.
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Verify ownership
    const { data: order } = await admin
      .from('orders')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const { zipBytes, fileName, fileCount } = await buildOrderZip(id)

    if (fileCount === 0) {
      return NextResponse.json(
        { error: 'Production files are not ready yet. Please check back shortly.' },
        { status: 404 }
      )
    }

    return new NextResponse(
      new ReadableStream({
        start(controller) {
          controller.enqueue(zipBytes)
          controller.close()
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': String(zipBytes.length),
        },
      }
    )
  } catch (err) {
    console.error('[CustomerFiles] ZIP error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
