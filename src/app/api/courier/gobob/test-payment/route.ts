/**
 * TEMPORARY TEST ROUTE — remove before going to production.
 *
 * POST /api/courier/gobob/test-payment
 *
 * Simulates the full payment → Bob Go booking flow without a real payment gateway:
 *  1. Looks up a real user from the DB (or accepts userId in body)
 *  2. Creates a test order with gobob_service_type pre-filled
 *  3. Marks the order as paid
 *  4. Calls the Bob Go book endpoint
 *  5. Returns the shipment result + tracking reference
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  // Protect with the same internal secret
  const authHeader = req.headers.get('x-internal-secret')
  if (authHeader !== process.env.INTERNAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized — pass x-internal-secret header' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // --- 1. Get a real user to attach the order to ---
  const body = await req.json().catch(() => ({}))
  let userId: string = body.userId

  if (!userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single()
    if (!profile) {
      return NextResponse.json({ error: 'No users found in DB. Pass userId in body.' }, { status: 400 })
    }
    userId = profile.id
  }

  // --- 2. Create a test order with Bob Go service type ---
  const orderNumber = `TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      order_number: orderNumber,
      status: 'paid',
      payment_status: 'paid',
      payment_method: 'test_simulation',
      payment_reference: `sim_${Date.now()}`,
      paid_at: new Date().toISOString(),
      subtotal: 200,
      tax: 30,
      shipping_cost: 114.10,
      total: 344.10,
      shipping_address: {
        full_name: 'Test User',
        address_line1: '1 Adderley Street',
        address_line2: 'Cape Town City Centre',
        city: 'Cape Town',
        province: 'Western Cape',
        postal_code: '8001',
        country: 'ZA',
        phone: '0821234567',
      },
      billing_address: {
        full_name: 'Test User',
        address_line1: '1 Adderley Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postal_code: '8001',
        country: 'ZA',
        phone: '0821234567',
      },
      // Bob Go service: provider_slug|service_level_code (from /api/courier/gobob/test)
      gobob_service_type: 'demo|ECO',
      gobob_quoted_rate: 114.10,
    })
    .select()
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Failed to create test order', detail: orderError?.message }, { status: 500 })
  }

  await supabase.from('order_status_history').insert({
    order_id: order.id,
    status: 'paid',
    notes: 'Simulated payment for Bob Go integration test',
  })

  // --- 3. Call the Bob Go book endpoint ---
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000'
  let bookResult: any
  let bookStatus: number

  try {
    const bookRes = await fetch(`${siteUrl}/api/courier/gobob/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_WEBHOOK_SECRET ?? '',
      },
      body: JSON.stringify({ orderId: order.id }),
    })
    bookStatus = bookRes.status
    bookResult = await bookRes.json()
  } catch (err: any) {
    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      bookingError: err.message,
    }, { status: 500 })
  }

  // --- 4. Fetch the updated order to show final state ---
  const { data: updatedOrder } = await supabase
    .from('orders')
    .select('id, order_number, status, gobob_shipment_id, gobob_waybill_number, gobob_tracking_url, gobob_service_type')
    .eq('id', order.id)
    .single()

  return NextResponse.json({
    success: bookStatus === 200,
    orderId: order.id,
    orderNumber,
    userId,
    bookingHttpStatus: bookStatus,
    bookingResponse: bookResult,
    finalOrder: updatedOrder,
  })
}
