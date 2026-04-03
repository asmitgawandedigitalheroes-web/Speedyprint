import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // BUG-005 FIX: Require authentication before creating a Stripe session.
    // Previously, any unauthenticated user could POST any orderId and get a payment URL.
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Fetch order details
    // BUG-018 FIX: Include profile join so customer_email is available for Stripe receipt
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, items:order_items(*, product_group:product_groups(*)), profile:profiles(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // BUG-005 FIX: Verify the authenticated user owns this order.
    // Without this check, a logged-in user could pay for another user's order.
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare line items for Stripe
    const lineItems = order.items.map((item: any) => ({
      price_data: {
        currency: 'zar',
        product_data: {
          name: item.product_group?.name || 'Speedyprint Product',
          description: `Quantity: ${item.quantity}`,
        },
        unit_amount: Math.round(item.unit_price * 100), // Stripe expects amounts in cents
      },
      quantity: item.quantity,
    }))

    // BUG-007 FIX: Do NOT add VAT as a separate Stripe line item.
    // order.total already includes VAT (subtotal + tax + shipping_cost).
    // Adding tax again here was causing customers to be overcharged by 15% on every order.

    // BUG-008 FIX: Add shipping as a Stripe line item if applicable.
    // Previously shipping_cost was stored in the DB but never charged via Stripe.
    // Customers saw 'Shipping: R85' in the UI but paid R0 for shipping on their card.
    if (order.shipping_cost > 0) {
      lineItems.push({
        price_data: {
          currency: 'zar',
          product_data: { name: 'Shipping' },
          unit_amount: Math.round(order.shipping_cost * 100),
        },
        quantity: 1,
      })
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/cancel?order_id=${orderId}`,
      metadata: {
        orderId: order.id,
        userId: order.user_id,
      },
      customer_email: order.profile?.email ?? undefined, // BUG-018 FIX: profile now included in query
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
