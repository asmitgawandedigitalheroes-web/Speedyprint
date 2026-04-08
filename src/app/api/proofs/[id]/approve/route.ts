import { NextRequest, NextResponse, after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logProofAudit } from '@/lib/proofAudit'
import { generateOrderProductionFiles } from '@/lib/production/generator'
import { logActivity } from '@/lib/audit'

// ── POST /api/proofs/:id/approve – Customer approves a proof ─────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const admin = createAdminClient()

  // BUG-020 FIX: Sanitize customer notes before storing to prevent stored XSS.
  // A user could submit notes with <script> or event-handler attributes.
  // Strip all HTML tags and limit length to prevent abuse.
  // Note: If a full HTML-rendering context is ever needed, use DOMPurify on the server.
  const rawNotes: string = typeof body.notes === 'string' ? body.notes : ''
  const sanitizedNotes = rawNotes.replace(/<[^>]*>/g, '').trim().slice(0, 2000) || null

  // Determine the actual role of the caller (admin/production_staff vs customer)
  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isStaff = callerProfile?.role === 'admin' || callerProfile?.role === 'production_staff'
  const actorRole = isStaff ? (callerProfile!.role as 'admin' | 'production_staff') : 'customer'

  // Capture client IP for approval audit log
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const respondedAt = new Date().toISOString()

  // Update proof status (with audit columns; gracefully falls back if migration not yet applied)
  let { data: proof, error } = await admin
    .from('proofs')
    .update({
      status: 'approved',
      customer_notes: sanitizedNotes,
      responded_at: respondedAt,
      approved_by: user.id,
      approved_ip: clientIp,
      approval_log: {
        timestamp: respondedAt,
        ip: clientIp,
        user_id: user.id,
        role: actorRole,
        notes: sanitizedNotes,
      },
    })
    .eq('id', id)
    .select()
    .single()

  if (error?.message?.includes('approved_by') || error?.message?.includes('approved_ip')) {
    const retry = await admin
      .from('proofs')
      .update({ status: 'approved', customer_notes: sanitizedNotes, responded_at: respondedAt })
      .eq('id', id)
      .select()
      .single()
    proof = retry.data
    error = retry.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Move order item to approved status
  await admin.from('order_items').update({ status: 'approved' }).eq('id', proof!.order_item_id)

  // ── Audit log ─────────────────────────────────────────────────────────────
  await logProofAudit({
    proof_id:      id,
    order_item_id: proof!.order_item_id,
    action:        'proof_approved',
    actor_id:      user.id,
    actor_role:    actorRole,
    notes:         sanitizedNotes,
    client_ip:     clientIp,
    metadata:      {
      version: proof!.version,
      responded_at: respondedAt,
      ...(isStaff ? { on_behalf_of_customer: true } : {}),
    },
  })

  // Global Audit Log
  const { data: itemWithOrder } = await admin
    .from('order_items')
    .select('order:orders(order_number)')
    .eq('id', proof!.order_item_id)
    .single()

  const orderNumber = Array.isArray(itemWithOrder?.order)
    ? itemWithOrder?.order[0]?.order_number
    : (itemWithOrder?.order as any)?.order_number

  await logActivity({
    user_id: user.id,
    action: 'proof_approved',
    entity_type: 'proof',
    entity_id: id,
    metadata: {
      order_item_id: proof!.order_item_id,
      version: proof!.version,
      notes: sanitizedNotes,
      order_number: orderNumber
    },
    is_admin_action: isStaff,
  })

  // ── Auto-generate production files in the background ──────────────────────
  // after() runs after the response is sent, so the customer doesn't wait.
  const orderItemId = proof!.order_item_id
  after(async () => {
    try {
      const adminBg = createAdminClient()
      const { data: itemRow } = await adminBg
        .from('order_items')
        .select('order_id')
        .eq('id', orderItemId)
        .single()
      if (itemRow?.order_id) {
        await generateOrderProductionFiles(itemRow.order_id)
      }
    } catch (err) {
      console.error('[AutoProdGen] Background production generation failed:', err)
    }
  })

  return NextResponse.json(proof)
}
