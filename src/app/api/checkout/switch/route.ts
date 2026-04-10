import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { SWITCH_CONFIG, generateSwitchPaymentData } from '@/lib/switch/config'
import type { Order } from '@/types'

export async function POST(req: NextRequest) {
  try {
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

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, profile:profiles(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const typedOrder = order as Order & { profile?: { email: string } }
    const email = typedOrder.profile?.email || ''
    const formData = generateSwitchPaymentData(typedOrder, email)

    return NextResponse.json({
      paymentUrl: SWITCH_CONFIG.processUrl,
      formData,
    })
  } catch (error: any) {
    console.error('Switch Checkout Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
