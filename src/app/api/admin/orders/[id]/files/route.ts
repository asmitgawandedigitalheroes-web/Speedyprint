import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { buildOrderZip } from '@/lib/production/zipper'

type RouteParams = { params: Promise<{ id: string }> }

// ── GET /api/admin/orders/:id/files ───────────────────────────────────────────
// Returns lists of production files and uploaded files for an order.
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
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'production_staff'].includes(profile.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: orderItems, error: itemsError } = await admin
      .from('order_items')
      .select('id')
      .eq('order_id', id)

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
    if (!orderItems || orderItems.length === 0)
      return NextResponse.json({ productionFiles: [], uploadedFiles: [] })

    const itemIds = orderItems.map((item) => item.id)

    const [{ data: productionFiles }, { data: uploadedFiles }] = await Promise.all([
      admin
        .from('production_files')
        .select('*')
        .in('order_item_id', itemIds)
        .order('generated_at', { ascending: false }),
      admin
        .from('uploaded_files')
        .select('*')
        .in('order_item_id', itemIds)
        .order('created_at', { ascending: false }),
    ])

    return NextResponse.json({
      productionFiles: productionFiles ?? [],
      uploadedFiles: uploadedFiles ?? [],
    })
  } catch (err) {
    console.error('[OrderFiles] GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch order files' }, { status: 500 })
  }
}

// ── POST /api/admin/orders/:id/files ──────────────────────────────────────────
// Builds and streams a ZIP archive of all production files for the order.
//
// File structure inside ZIP:
//   order_manifest.json
//   {item_id}_ProductName/
//     ORD-0042_ProductName_001_JohnSmith.pdf
//     ...
//   csv_data/
//     original_upload.csv
//
// If no production files exist yet, returns 404 with a hint to call
// POST /api/admin/orders/:id/production first.
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
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'production_staff'].includes(profile.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { zipBytes, fileName, fileCount } = await buildOrderZip(id)

    if (fileCount === 0) {
      return NextResponse.json(
        {
          error: 'No production files found for this order. Generate them first via POST /api/admin/orders/:id/production',
        },
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
    console.error('[OrderFiles] ZIP error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
