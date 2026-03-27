import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, items:order_items(*, product_group:product_groups(*))')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Prepare line items for Stripe
    const lineItems = order.items.map((item: any) => ({
      price_data: {
        currency: 'zar', // South African Rand
        product_data: {
          name: item.product_group?.name || 'Speedyprint Product',
          description: `Quantity: ${item.quantity}`,
        },
        unit_amount: Math.round(item.unit_price * 100), // Stripe expects amounts in cents
      },
      quantity: item.quantity,
    }))

    // Add VAT if applicable (assuming tax is already calculated in the order)
    // However, Stripe prefers tax rates. For simplicity, we can add tax as a line item if it's not handled by Stripe Tax
    if (order.tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'zar',
          product_data: {
            name: 'VAT (15%)',
          },
          unit_amount: Math.round(order.tax * 100),
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
      customer_email: order.profile?.email, // Optional: if you have the user's email
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
