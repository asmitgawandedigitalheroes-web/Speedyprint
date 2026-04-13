import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/audit'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Orders] Fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { items, shipping_address, billing_address, notes } = body

  // Input validation
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Order must contain at least one item.' }, { status: 400 })
  }
  if (items.length > 500) {
    return NextResponse.json({ error: 'Too many items in a single order.' }, { status: 400 })
  }
  if (typeof notes === 'string' && notes.length > 2000) {
    return NextResponse.json({ error: 'Notes must be under 2000 characters.' }, { status: 400 })
  }
  for (const item of items) {
    if (!item.product_group_id || typeof item.quantity !== 'number' || item.quantity < 1 || typeof item.unit_price !== 'number' || item.unit_price < 0) {
      return NextResponse.json({ error: 'Invalid item data.' }, { status: 400 })
    }
  }

  // Calculate totals
  let subtotal = 0
  for (const item of items) {
    subtotal += item.quantity * item.unit_price
  }
  const tax = subtotal * 0.15
  const shipping_cost = 0
  const total = subtotal + tax + shipping_cost

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      order_number: '',
      status: 'pending_payment',
      subtotal,
      tax,
      shipping_cost,
      total,
      shipping_address: shipping_address || {},
      billing_address: billing_address || shipping_address || {},
      notes,
    })
    .select()
    .single()

  if (orderError) {
    console.error('[Orders] Insert error:', orderError)
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 })
  }

  // Create order items
  const orderItems = items.map((item: any) => ({
    order_id: order.id,
    product_group_id: item.product_group_id,
    product_template_id: item.product_template_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.quantity * item.unit_price,
    selected_params: item.selected_params || {},
    design_id: item.design_id || null,
    status: 'pending_design',
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) {
    console.error('[Orders] Items insert error:', itemsError)
    return NextResponse.json({ error: 'Failed to save order items.' }, { status: 500 })
  }

  // Log activity
  await logActivity({
    user_id: user.id,
    action: 'order_placed',
    entity_type: 'order',
    entity_id: order.id,
    metadata: {
      order_number: order.order_number,
      total: order.total,
      item_count: items.length,
    },
    is_admin_action: false
  })

  return NextResponse.json(order, { status: 201 })
}
