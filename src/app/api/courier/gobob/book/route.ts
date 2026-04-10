import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  bookGoBobShipment,
  buildGoBobDeliveryAddress,
  getCollectionAddress,
} from '@/lib/gobob/client'

export async function POST(req: NextRequest) {
  // This route is called internally by payment webhooks — validate shared secret
  const authHeader = req.headers.get('x-internal-secret')
  if (authHeader !== process.env.INTERNAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId } = await req.json()

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, profile:profiles!orders_user_id_fkey(email)')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Idempotency: skip if already booked
  if (order.gobob_shipment_id) {
    return NextResponse.json({ alreadyBooked: true, shipmentId: order.gobob_shipment_id })
  }

  try {
    const collectionAddress = getCollectionAddress()
    const customerEmail = (order as any).profile?.email
    const deliveryAddress = buildGoBobDeliveryAddress(order.shipping_address ?? {}, customerEmail)

    const shipment = await bookGoBobShipment({
      collection_address: collectionAddress,
      delivery_address: deliveryAddress,
      parcels: [
        {
          // ⚠️ PLACEHOLDER: Derive weight/dimensions from order items in a future phase
          weight_kg: 1,
          length_cm: 20,
          width_cm: 15,
          height_cm: 5,
          description: `SpeedyPrint Order #${order.order_number}`,
          value: order.total,
        },
      ],
      service_code: order.gobob_service_type ?? 'standard',
      reference: order.order_number,
    })

    // Persist GoBob shipment data
    await supabase
      .from('orders')
      .update({
        gobob_shipment_id: shipment.shipment_id,
        gobob_tracking_url: shipment.tracking_url,
        gobob_waybill_number: shipment.waybill_number,
        tracking_number: shipment.waybill_number, // populate legacy field for compatibility
      })
      .eq('id', orderId)

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: 'ready_to_ship',
      notes: `GoBob shipment booked. Waybill: ${shipment.waybill_number}`,
    })

    return NextResponse.json({ shipment })
  } catch (err: any) {
    console.error('GoBob booking error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
