import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

/**
 * GET /api/admin/orders/export
 *
 * Returns all orders (up to 2 000) matching the same filters as the
 * pipeline list endpoint, serialised as a CSV file download.
 *
 * Accepted query params:
 *   status, search, date_from, date_to, division, product_type
 */
export async function GET(request: NextRequest) {
  const { error, status } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)

  const statusFilter = searchParams.get('status')
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const search = searchParams.get('search')?.trim()
  const division = searchParams.get('division')
  const productType = searchParams.get('product_type')?.trim()

  // ── Optional pre-filter by division / product_type ──────────────────────────
  let divisionOrderIds: string[] | null = null
  if (division || productType) {
    const { data: matchingItems } = await supabase
      .from('order_items')
      .select('order_id, product_group:product_groups(division, name)')

    const filtered = (matchingItems ?? []).filter((item) => {
      const pg = item.product_group as any
      if (division && pg?.division !== division) return false
      if (productType && !pg?.name?.toLowerCase().includes(productType.toLowerCase())) return false
      return true
    })
    divisionOrderIds = [...new Set(filtered.map((i: any) => i.order_id).filter(Boolean))]
    if (divisionOrderIds.length === 0) {
      return new NextResponse(csvRow(['order_number', 'date', 'customer', 'email', 'status', 'total', 'divisions', 'items']), {
        headers: csvHeaders('orders-export.csv'),
      })
    }
  }

  // ── Main query — no pagination, capped at 2 000 rows ───────────────────────
  let query = supabase
    .from('orders')
    .select(
      `id, order_number, created_at, status, total_amount,
       profile:profiles!orders_user_id_fkey(full_name, email),
       items:order_items(
         quantity,
         product_group:product_groups(name, division)
       )`,
    )
    .order('created_at', { ascending: false })
    .limit(2000)

  if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) {
    const end = new Date(dateTo)
    end.setHours(23, 59, 59, 999)
    query = query.lte('created_at', end.toISOString())
  }
  if (divisionOrderIds) query = query.in('id', divisionOrderIds)

  if (search) {
    const { data: profileMatches } = await supabase
      .from('profiles')
      .select('id')
      .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)

    const matchedUserIds = (profileMatches ?? []).map((p) => p.id)
    if (matchedUserIds.length > 0) {
      query = query.or(`order_number.ilike.%${search}%,user_id.in.(${matchedUserIds.join(',')})`)
    } else {
      query = query.ilike('order_number', `%${search}%`)
    }
  }

  const { data: orders, error: qErr } = await query
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  // ── Build CSV ────────────────────────────────────────────────────────────────
  const headers = ['Order Number', 'Date', 'Customer', 'Email', 'Status', 'Total (R)', 'Divisions', 'Line Items']
  const lines: string[] = [csvRow(headers)]

  for (const order of orders ?? []) {
    const profile = order.profile as any
    const items = (order.items ?? []) as any[]

    const divisions = [...new Set(items.map((i) => i.product_group?.division).filter(Boolean))].join('; ')
    const lineItems = items
      .map((i) => `${i.product_group?.name ?? 'Unknown'} ×${i.quantity}`)
      .join('; ')

    lines.push(
      csvRow([
        order.order_number ?? '',
        order.created_at ? new Date(order.created_at).toISOString().slice(0, 10) : '',
        profile?.full_name ?? '',
        profile?.email ?? '',
        order.status ?? '',
        order.total_amount != null ? String(order.total_amount) : '',
        divisions,
        lineItems,
      ]),
    )
  }

  const filename = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse(lines.join('\n'), { headers: csvHeaders(filename) })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function csvRow(fields: string[]): string {
  return fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(',')
}

function csvHeaders(filename: string): Record<string, string> {
  return {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  }
}
