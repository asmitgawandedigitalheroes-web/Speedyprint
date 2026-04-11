import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/audit'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/orders/[id] — get full order detail
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Fetch order with related data
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        profile:profiles!orders_user_id_fkey(*),
        order_items(
          *,
          product_group:product_groups(id, name, image_url),
          product_template:product_templates(id, name),
          design:designs(id, name, thumbnail_url),
          proofs(*)
        )
      `
      )
      .eq('id', id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Fetch status history
    const { data: history } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      order: {
        ...order,
        items: order.order_items,
        order_items: undefined,
      },
      history: history ?? [],
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/orders/[id] — update order (status, tracking, notes)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {}

    if (body.status !== undefined) updateData.status = body.status
    if (body.tracking_number !== undefined)
      updateData.tracking_number = body.tracking_number
    if (body.admin_notes !== undefined)
      updateData.admin_notes = body.admin_notes

    // Auto-set timestamps based on status
    if (body.status === 'paid' && !body.skipTimestamp) {
      updateData.paid_at = new Date().toISOString()
    }
    if (body.status === 'in_production') {
      updateData.approved_at = new Date().toISOString()
    }
    if (body.status === 'completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.shipped_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log status change to history
    if (body.status) {
      await supabase.from('order_status_history').insert({
        order_id: id,
        status: body.status,
        notes: body.notes || null,
        changed_by: null,
      })

      // Log to global audit logs
      await logActivity({
        user_id: null, // Admin action, actor_id could be added if available in request
        action: 'order_status_updated',
        entity_type: 'order',
        entity_id: id,
        metadata: {
          status: body.status,
          notes: body.notes,
          order_number: data.order_number,
          order_user_id: data.user_id,
        },
        is_admin_action: true
      })
    }

    return NextResponse.json({ order: data })
  } catch {
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
