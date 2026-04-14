import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('order')?.trim()
  const email = searchParams.get('email')?.trim().toLowerCase()

  if (!orderId || !email) {
    return NextResponse.json({ error: 'Order number and email are required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Look up order by ID (or short reference) + customer email
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      created_at,
      total_amount,
      tracking_number,
      courier,
      order_items (
        quantity,
        product_name
      )
    `)
    .or(`id.eq.${orderId},short_id.eq.${orderId}`)
    .eq('customer_email', email)
    .maybeSingle()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      created_at: order.created_at,
      total_amount: order.total_amount,
      tracking_number: order.tracking_number ?? null,
      courier: order.courier ?? null,
      items: (order.order_items ?? []).map((item: { product_name: string; quantity: number }) => ({
        product_name: item.product_name,
        quantity: item.quantity,
      })),
    },
  })
}
