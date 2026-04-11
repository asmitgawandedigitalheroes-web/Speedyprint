import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logProofAudit } from '@/lib/proofAudit'

// ── POST /api/proofs/:id/cancel – Customer cancels a proof/item ──────────────
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

  // Sanitize notes
  const rawNotes: string = typeof body.notes === 'string' ? body.notes : ''
  const sanitizedNotes = rawNotes.replace(/<[^>]*>/g, '').trim().slice(0, 2000) || null

  // Capture client IP
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  // 1. Get proof context
  const { data: proof, error: proofErr } = await admin
    .from('proofs')
    .select('id, order_item_id, status, version')
    .eq('id', id)
    .single()

  if (proofErr || !proof) return NextResponse.json({ error: 'Proof not found' }, { status: 404 })

  // 2. Perform cancellation transaction
  const respondedAt = new Date().toISOString()
  
  // Update proof status
  const { error: updateErr } = await admin
    .from('proofs')
    .update({ 
      status: 'cancelled' as any,
      customer_notes: sanitizedNotes,
      responded_at: respondedAt,
      approval_log: {
        timestamp: respondedAt,
        ip: clientIp,
        user_id: user.id,
        role: 'customer',
        action: 'cancelled',
        notes: sanitizedNotes,
      },
    })
    .eq('id', id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // 3. Update order item to 'cancelled'
  const { error: itemErr } = await admin
    .from('order_items')
    .update({ status: 'cancelled' as any })
    .eq('id', proof.order_item_id)

  // 4. Audit Log
  await logProofAudit({
    proof_id:      id,
    order_item_id: proof.order_item_id,
    action:        'proof_cancelled',
    actor_id:      user.id,
    actor_role:    'customer',
    notes:         sanitizedNotes,
    client_ip:     clientIp,
    metadata:      {
      version: proof.version,
      intent: 'customer_cancellation',
      responded_at: respondedAt
    }
  })

  return NextResponse.json({ success: true })
}
