import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { OrderStatus } from '@/types'

const VALID_STATUSES: OrderStatus[] = [
  'draft',
  'pending_payment',
  'paid',
  'in_production',
  'completed',
  'cancelled',
]

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { order_ids, status } = body as {
      order_ids: string[]
      status: string
    }

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json(
        { error: 'order_ids must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!status || !VALID_STATUSES.includes(status as OrderStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    // If marking as completed, set completed_at
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    // If marking as paid, set paid_at
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .in('id', order_ids)
      .select('id, order_number, status')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `${data?.length ?? 0} orders updated to ${status}`,
      updated: data,
    })
  } catch (error) {
    console.error('Bulk status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update order statuses' },
      { status: 500 }
    )
  }
}
