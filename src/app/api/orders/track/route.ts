import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBobGoTracking } from '@/lib/gobob/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderNumber = searchParams.get('order')?.trim()
  const email = searchParams.get('email')?.trim().toLowerCase()

  if (!orderNumber || !email) {
    return NextResponse.json({ error: 'Order number and email are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Look up order by order_number, verify it belongs to the given email via profiles join
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      created_at,
      total,
      tracking_number,
      gobob_tracking_url,
      gobob_waybill_number,
      profile:profiles!orders_user_id_fkey(email),
      order_items(
        quantity,
        unit_price,
        product_group:product_groups!order_items_product_group_id_fkey(name)
      )
    `)
    .eq('order_number', orderNumber)
    .maybeSingle()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Verify email matches the order owner
  const ownerEmail = (order.profile as any)?.email?.toLowerCase() ?? ''
  if (ownerEmail !== email) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Fetch live tracking events from Bob Go if we have a waybill number
  let trackingEvents: any[] = []
  let trackingStatus: string | null = null

  const waybill = order.gobob_waybill_number || order.tracking_number
  if (waybill) {
    try {
      const tracking = await getBobGoTracking(waybill)
      trackingEvents = tracking.tracking_events ?? []
      trackingStatus = tracking.status ?? null
    } catch {
      // Non-fatal — tracking events are optional
    }
  }

  return NextResponse.json({
    order: {
      id: order.order_number,
      status: order.status,
      created_at: order.created_at,
      total: order.total,
      tracking_number: waybill ?? null,
      tracking_url: order.gobob_tracking_url ?? null,
      courier_status: trackingStatus,
      tracking_events: trackingEvents,
      items: ((order.order_items as any[]) ?? []).map((item: any) => ({
        product_name: item.product_group?.name ?? 'Print product',
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    },
  })
}
