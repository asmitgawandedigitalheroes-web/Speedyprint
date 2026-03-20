import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateSignature, PAYFAST_CONFIG, PAYFAST_IPS } from '@/lib/payfast/config'
import { sendPaymentReceived } from '@/lib/email/resend'
import type { Order } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const params = new URLSearchParams(body)
    const data: Record<string, string> = {}
    params.forEach((value, key) => {
      data[key] = value
    })

    // 1. Validate source IP (skip in sandbox mode)
    if (!PAYFAST_CONFIG.sandbox) {
      const forwardedFor = req.headers.get('x-forwarded-for')
      const clientIp = forwardedFor?.split(',')[0]?.trim() || ''
      if (!PAYFAST_IPS.includes(clientIp)) {
        console.error('PayFast ITN: Invalid source IP:', clientIp)
        return NextResponse.json({ error: 'Invalid source' }, { status: 403 })
      }
    }

    // 2. Validate signature
    const receivedSignature = data.signature
    const expectedSignature = generateSignature(data, PAYFAST_CONFIG.passphrase)
    if (receivedSignature !== expectedSignature) {
      console.error('PayFast ITN: Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // 3. Get payment details
    const paymentId = data.m_payment_id // Our order ID
    const paymentStatus = data.payment_status
    const pfPaymentId = data.pf_payment_id

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 })
    }

    // 4. Update order based on payment status
    const supabase = createAdminClient()

    if (paymentStatus === 'COMPLETE') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'paid',
          payment_reference: pfPaymentId,
          payfast_payment_id: pfPaymentId,
          paid_at: new Date().toISOString(),
        })
        .eq('id', paymentId)

      if (updateError) {
        console.error('PayFast ITN: Failed to update order:', updateError)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
      }

      // Add to order status history
      await supabase.from('order_status_history').insert({
        order_id: paymentId,
        status: 'paid',
        notes: `Payment received via PayFast (${pfPaymentId})`,
      })

      // Send payment received email to customer
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
        console.error('PayFast: payment email error:', emailErr)
      }

      console.log(`PayFast ITN: Order ${paymentId} marked as paid`)
    } else if (paymentStatus === 'CANCELLED') {
      await supabase
        .from('orders')
        .update({
          payment_status: 'cancelled',
        })
        .eq('id', paymentId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PayFast ITN error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
