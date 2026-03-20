import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/proofs/:order_item_id – List all proof versions for an order item ─
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: order_item_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Admins can access any order item's proofs; customers only their own
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'production_staff'

  if (!isAdmin) {
    const { data: item } = await admin
      .from('order_items')
      .select('order:orders(user_id)')
      .eq('id', order_item_id)
      .single()
    const ownerUserId = (item?.order as any)?.user_id
    if (ownerUserId !== user.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('proofs')
    .select('*')
    .eq('order_item_id', order_item_id)
    .order('version', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// ── PUT /api/proofs/:id – Admin updates notes on a proof ──────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'production_staff'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { data: proof, error } = await admin
    .from('proofs')
    .update({ admin_notes: body.admin_notes ?? null })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(proof)
}
