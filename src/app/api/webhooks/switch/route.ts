import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateSwitchSignature, SWITCH_CONFIG, SWITCH_IPS } from '@/lib/switch/config'
import { sendPaymentReceived } from '@/lib/email/resend'
import type { Order } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const params = new URLSearchParams(body)
  const data: Record<string, string> = {}
  params.forEach((value, key) => {
    data[key] = value
  })

  // 1. IP validation (skip in sandbox mode)
  if (!SWITCH_CONFIG.sandbox) {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const clientIp = forwardedFor?.split(',')[0]?.trim() || ''
    if (SWITCH_IPS.length > 0 && !SWITCH_IPS.includes(clientIp)) {
      return NextResponse.json({ error: 'Invalid source IP' }, { status: 403 })
    }
  }

  // 2. Signature validation
  const receivedSignature = data.signature
  const expectedSignature = generateSwitchSignature(data, SWITCH_CONFIG.passphrase)
  if (receivedSignature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ⚠️ PLACEHOLDER: Confirm exact field names with Switch API docs
  const paymentId = data.m_payment_id           // Our internal order ID
  const paymentStatus = data.payment_status     // e.g. 'COMPLETE', 'CANCELLED'
  const switchPaymentId = data.pf_payment_id    // Switch transaction ID

  if (!paymentId) {
    return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 3. Idempotency — reuse webhook_events table, prefix with 'switch_' to avoid collisions
  const eventKey = `switch_${switchPaymentId || paymentId}`
  const { error: lockError } = await supabase
    .from('webhook_events')
    .insert({ id: eventKey, type: paymentStatus, source: 'switch' })

  if (lockError?.code === '23505') {
    // Already processed
    return NextResponse.json({ received: true, deduplicated: true })
  }

  // 4. Update order based on payment status
  // ⚠️ PLACEHOLDER: Confirm exact status value strings with Switch API docs
  if (paymentStatus === 'COMPLETE') {
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'paid',
        payment_method: 'switch',
        payment_reference: switchPaymentId,
        switch_payment_id: switchPaymentId,
        paid_at: new Date().toISOString(),
      })
      .eq('id', paymentId)

    await supabase.from('order_status_history').insert({
      order_id: paymentId,
      status: 'paid',
      notes: `Payment received via Switch (${switchPaymentId})`,
    })

    // Auto-book GoBob shipment
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/courier/gobob/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_WEBHOOK_SECRET ?? '',
        },
        body: JSON.stringify({ orderId: paymentId }),
      })
    } catch (gobobErr) {
      console.error('Switch webhook: GoBob auto-book failed:', gobobErr)
    }

    // Send payment confirmation email
    try {
      const { data: orderWithProfile } = await supabase
        .from('orders')
        .select('*, profile:profiles!orders_user_id_fkey(email)')
        .eq('id', paymentId)
        .single()

      const customerEmail = (orderWithProfile as any)?.profile?.email
      if (orderWithProfile && customerEmail) {
        await sendPaymentReceived(orderWithProfile as unknown as Order, customerEmail)
      }
    } catch (emailErr) {
      console.error('Switch webhook: payment email failed:', emailErr)
    }
  } else if (paymentStatus === 'CANCELLED') {
    await supabase
      .from('orders')
      .update({ payment_status: 'cancelled' })
      .eq('id', paymentId)
  }

  return NextResponse.json({ success: true })
}
