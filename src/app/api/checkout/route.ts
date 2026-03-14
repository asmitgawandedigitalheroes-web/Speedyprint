import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PAYFAST_CONFIG, generatePaymentData } from '@/lib/payfast/config'
import type { Order } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Fetch order
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, profile:profiles(*)')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const typedOrder = order as Order & { profile?: { email: string } }
    const email = typedOrder.profile?.email || ''

    // Generate PayFast payment data
    const formData = generatePaymentData(typedOrder, email)

    return NextResponse.json({
      paymentUrl: PAYFAST_CONFIG.processUrl,
      formData,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
