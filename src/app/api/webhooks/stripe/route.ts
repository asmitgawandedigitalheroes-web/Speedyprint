import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: any

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // BUG-016 FIX: Idempotency check.
  // We record the event ID to ensure we don't process the same webhook twice.
  // We insert it at the start to "lock" it; if processing fails, we remove it to allow retries.
  const supabase = createAdminClient()

  try {
    const { error: lockError } = await supabase
      .from('webhook_events')
      .insert({ id: event.id, type: event.type })

    if (lockError) {
      if (lockError.code === '23505') {
        console.log(`[Webhook] Event ${event.id} already processed or in progress. Skipping.`)
        return NextResponse.json({ received: true, deduplicated: true })
      }
      throw lockError
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        const orderId = session.metadata.orderId

        if (orderId) {
          // Update order status to 'paid'
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              payment_reference: session.id,
              payment_method: 'stripe',
            })
            .eq('id', orderId)

          if (updateError) {
            console.error('Error updating order:', updateError)
            throw updateError // Re-throw to trigger catch block (lock removal)
          } else {
            console.log(`Order ${orderId} updated to paid`)
          }
        }
        break

      // Handle other event types if needed
      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (err: any) {
    console.error(`[Webhook] Processing failed for ${event.id}:`, err)
    // Remove the record so Stripe can retry successfully
    await supabase.from('webhook_events').delete().eq('id', event.id)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
