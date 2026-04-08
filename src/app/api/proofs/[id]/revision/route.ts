import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendAdminRevisionRequested } from '@/lib/email/resend'
import { logProofAudit, getClientIp } from '@/lib/proofAudit'
import { logActivity } from '@/lib/audit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (!body.notes?.trim()) {
    return NextResponse.json({ error: 'Notes are required for revision requests' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: proof, error } = await admin
    .from('proofs')
    .update({
      status: 'revision_requested',
      customer_notes: body.notes,
      responded_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update order item status
  await admin.from('order_items').update({ status: 'pending_proof' }).eq('id', proof.order_item_id)

  // ── Audit log ─────────────────────────────────────────────────────────────
  await logProofAudit({
    proof_id:      id,
    order_item_id: proof.order_item_id,
    action:        'revision_requested',
    actor_id:      user.id,
    actor_role:    'customer',
    notes:         body.notes,
    client_ip:     getClientIp(request.headers),
    metadata:      { version: proof.version },
  })

  // Global Audit Log
  const { data: itemWithOrder } = await admin
    .from('order_items')
    .select('order:orders(order_number)')
    .eq('id', proof.order_item_id)
    .single()

  const orderNumForLog = Array.isArray(itemWithOrder?.order)
    ? itemWithOrder?.order[0]?.order_number
    : (itemWithOrder?.order as any)?.order_number

  await logActivity({
    user_id: user.id,
    action: 'proof_revision_requested',
    entity_type: 'proof',
    entity_id: id,
    metadata: {
      order_item_id: proof.order_item_id,
      version: proof.version,
      notes: body.notes,
      order_number: orderNumForLog
    },
    is_admin_action: false,
  })

  // ── Notify admin about the revision request ────────────────────────────────
  try {
    const { data: item } = await admin
      .from('order_items')
      .select('order:orders(order_number)')
      .eq('id', proof.order_item_id)
      .single()

    const orderNum = (item?.order as any)?.order_number
    if (orderNum) {
      await sendAdminRevisionRequested(orderNum, body.notes)
    }
  } catch (emailErr) {
    console.error('[Revision] Admin notification error:', emailErr)
  }

  return NextResponse.json(proof)
}
