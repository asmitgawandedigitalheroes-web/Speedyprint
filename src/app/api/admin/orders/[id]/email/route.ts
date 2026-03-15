import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendOrderConfirmation,
  sendPaymentReceived,
  sendProofReady,
  sendOrderShipped,
} from '@/lib/email/resend'
import type { Order } from '@/types'

type RouteParams = { params: Promise<{ id: string }> }

// POST /api/admin/orders/[id]/email — trigger an email for this order
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await req.json()
    const { type, proofUrl, trackingNumber } = body as {
      type: 'confirmation' | 'payment' | 'proof' | 'shipped'
      proofUrl?: string
      trackingNumber?: string
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Email type is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch order with profile
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, profile:profiles!orders_user_id_fkey(*)')
      .eq('id', id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const customerEmail = order.profile?.email
    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      )
    }

    const typedOrder = order as unknown as Order

    switch (type) {
      case 'confirmation':
        await sendOrderConfirmation(typedOrder, customerEmail)
        break
      case 'payment':
        await sendPaymentReceived(typedOrder, customerEmail)
        break
      case 'proof':
        if (!proofUrl) {
          return NextResponse.json(
            { error: 'Proof URL is required' },
            { status: 400 }
          )
        }
        await sendProofReady(typedOrder, proofUrl, customerEmail)
        break
      case 'shipped':
        await sendOrderShipped(
          typedOrder,
          trackingNumber || order.tracking_number || 'N/A',
          customerEmail
        )
        break
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, type, to: customerEmail })
  } catch (err) {
    console.error('Email send error:', err)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
