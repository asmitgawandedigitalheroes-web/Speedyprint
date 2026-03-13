import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const search = searchParams.get('search')

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('orders')
      .select(
        '*, profile:profiles!orders_user_id_fkey(id, full_name, email, company_name), order_items(id)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      const dateToEnd = new Date(dateTo)
      dateToEnd.setHours(23, 59, 59, 999)
      query = query.lte('created_at', dateToEnd.toISOString())
    }

    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,profiles.full_name.ilike.%${search}%,profiles.email.ilike.%${search}%`
      )
    }

    const { data: orders, count, error } = await query

    if (error) {
      console.error('Orders query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const ordersWithItemCount = (orders ?? []).map((order) => ({
      ...order,
      item_count: order.order_items?.length ?? 0,
      order_items: undefined,
    }))

    return NextResponse.json({
      orders: ordersWithItemCount,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (error) {
    console.error('Orders list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
