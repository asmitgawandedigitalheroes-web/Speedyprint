import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  bookBobGoShipment,
  buildBobGoDeliveryAddress,
  getWarehouseAddress,
  decodeServiceType,
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
    .select('*, profile:profiles!orders_user_id_fkey(email, full_name, phone)')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Idempotency: skip if already booked
  if (order.gobob_shipment_id) {
    return NextResponse.json({ alreadyBooked: true, shipmentId: order.gobob_shipment_id })
  }

  // Require a service type to have been selected at checkout
  if (!order.gobob_service_type) {
    return NextResponse.json(
      { error: 'No shipping service selected for this order' },
      { status: 400 }
    )
  }

  const { provider_slug, service_level_code } = decodeServiceType(order.gobob_service_type)

  if (!provider_slug || !service_level_code) {
    return NextResponse.json(
      { error: `Invalid gobob_service_type value: "${order.gobob_service_type}"` },
      { status: 400 }
    )
  }

  try {
    const warehouseAddress = getWarehouseAddress()
    const profile = (order as any).profile ?? {}
    const customerEmail = profile.email ?? ''
    const customerName = profile.full_name ?? order.shipping_address?.full_name ?? 'Customer'
    const customerPhone = profile.phone ?? order.shipping_address?.phone ?? ''

    const deliveryAddress = buildBobGoDeliveryAddress(order.shipping_address ?? {})

    const shipment = await bookBobGoShipment({
      collection_address: warehouseAddress,
      collection_contact_name: 'SpeedyPrint',
      collection_contact_mobile_number: process.env.BOBGO_WAREHOUSE_PHONE ?? '0110271811',
      collection_contact_email: process.env.BOBGO_WAREHOUSE_EMAIL ?? 'info@speedylabels.co.za',

      delivery_address: deliveryAddress,
      delivery_contact_name: order.shipping_address?.full_name ?? customerName,
      delivery_contact_mobile_number: order.shipping_address?.phone ?? customerPhone,
      delivery_contact_email: customerEmail,

      parcels: [
        {
          // ⚠️ PLACEHOLDER: Derive weight/dimensions from order items in a future phase
          description: `SpeedyPrint Order #${order.order_number}`,
          submitted_length_cm: 20,
          submitted_width_cm: 15,
          submitted_height_cm: 5,
          submitted_weight_kg: 1,
          custom_parcel_reference: order.order_number,
        },
      ],

      declared_value: order.total ?? 0,
      service_level_code,
      provider_slug,
      custom_order_number: order.order_number,
    })

    // Build tracking URL — use sandbox domain when using sandbox API
    const isSandbox = (process.env.BOBGO_API_URL || '').includes('sandbox')
    const trackingDomain = isSandbox
      ? 'https://app.sandbox.bobgo.co.za'
      : 'https://app.bobgo.co.za'
    const trackingUrl = `${trackingDomain}/shipment-tracking/${shipment.tracking_reference}`

    // Persist Bob Go shipment data
    await supabase
      .from('orders')
      .update({
        gobob_shipment_id: String(shipment.id),
        gobob_tracking_url: trackingUrl,
        gobob_waybill_number: shipment.tracking_reference,
        tracking_number: shipment.tracking_reference, // populate legacy field for compatibility
      })
      .eq('id', orderId)

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: 'ready_to_ship',
      notes: `Bob Go shipment booked. Tracking: ${shipment.tracking_reference}`,
    })

    return NextResponse.json({ shipment })
  } catch (err: any) {
    console.error('Bob Go booking error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
