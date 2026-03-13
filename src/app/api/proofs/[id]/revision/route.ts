import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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

  return NextResponse.json(proof)
}
