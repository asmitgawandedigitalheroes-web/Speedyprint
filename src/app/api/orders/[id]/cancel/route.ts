import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/orders/[id]/cancel
 * Cancels an order owned by the authenticated user.
 * Only allows cancellation of: draft, pending_payment, paid orders.
 * In-production and completed orders cannot be self-cancelled.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Verify ownership and current status
  const { data: order, error: fetchError } = await admin
    .from('orders')
    .select('id, status, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const cancellable = ['draft', 'pending_payment', 'paid']
  if (!cancellable.includes(order.status)) {
    return NextResponse.json(
      { error: `Cannot cancel an order that is "${order.status}". Please contact support.` },
      { status: 422 }
    )
  }

  const { error: updateError } = await admin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (updateError) {
    console.error('[/api/orders/cancel] Update error:', updateError)
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
