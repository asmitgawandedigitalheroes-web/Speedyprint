import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildBatchZip } from '@/lib/production/zipper'

// ── GET /api/admin/production ─────────────────────────────────────────────────
// Lists orders that have production files, with summary counts.
// Query params: status, dateFrom, dateTo, product_type, page, limit
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'production_staff'].includes(profile.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? undefined
    const dateFrom = searchParams.get('dateFrom') ?? undefined
    const dateTo = searchParams.get('dateTo') ?? undefined
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
    const offset = (page - 1) * limit

    // Build query for orders that have at least one production_file
    let ordersQuery = admin
      .from('orders')
      .select(
        `id, order_number, status, created_at, total,
         profile:profiles!orders_user_id_fkey(full_name, email),
         items:order_items(
           id, status, quantity,
           product_group:product_groups(name),
           production_files(id, file_type, generated_at)
         )`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) ordersQuery = ordersQuery.eq('status', status)
    if (dateFrom) ordersQuery = ordersQuery.gte('created_at', dateFrom)
    if (dateTo) ordersQuery = ordersQuery.lte('created_at', dateTo + 'T23:59:59Z')

    const { data: orders, count, error } = await ordersQuery

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Summarise per order
    const summary = (orders ?? []).map((order) => {
      const allItems = (order.items as any[]) ?? []
      const pdfCount = allItems
        .flatMap((i: any) => i.production_files ?? [])
        .filter((f: any) => f.file_type === 'pdf').length
      const readyItems = allItems.filter((i: any) => i.status === 'in_production' || i.status === 'completed').length

      return {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at,
        total: order.total,
        customer: {
          name: (order.profile as any)?.full_name ?? null,
          email: (order.profile as any)?.email ?? null,
        },
        item_count: allItems.length,
        ready_item_count: readyItems,
        production_file_count: pdfCount,
        has_production_files: pdfCount > 0,
        latest_generated_at: allItems
          .flatMap((i: any) => i.production_files ?? [])
          .sort((a: any, b: any) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())[0]
          ?.generated_at ?? null,
      }
    })

    return NextResponse.json({
      orders: summary,
      total: count ?? 0,
      page,
      limit,
      pages: Math.ceil((count ?? 0) / limit) || 1,
    })
  } catch (err) {
    console.error('[AdminProduction] GET error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── POST /api/admin/production ────────────────────────────────────────────────
// Batch download: builds a ZIP containing production files for multiple orders.
// Body: { dateFrom?, dateTo?, status?, product_type?, limit? }
// Returns a streaming ZIP file.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'production_staff'].includes(profile.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const { dateFrom, dateTo, status, product_type, limit } = body

    const { zipBytes, fileName, orderCount, fileCount } = await buildBatchZip({
      dateFrom,
      dateTo,
      status,
      product_type,
      limit,
    })

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
          'X-Order-Count': String(orderCount),
          'X-File-Count': String(fileCount),
        },
      }
    )
  } catch (err) {
    console.error('[AdminProduction] Batch ZIP error:', err)
    const message = String(err)
    const status = message.includes('No orders') || message.includes('No production files') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
