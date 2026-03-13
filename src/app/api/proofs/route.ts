import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { order_item_id, design_id, proof_file_url, proof_thumbnail_url } = body

  const admin = createAdminClient()

  // Get current max version
  const { data: existing } = await admin
    .from('proofs')
    .select('version')
    .eq('order_item_id', order_item_id)
    .order('version', { ascending: false })
    .limit(1)

  const version = existing && existing.length > 0 ? existing[0].version + 1 : 1

  const { data, error } = await admin
    .from('proofs')
    .insert({
      order_item_id,
      design_id,
      version,
      proof_file_url,
      proof_thumbnail_url,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update order item status
  await admin.from('order_items').update({ status: 'proof_sent' }).eq('id', order_item_id)

  return NextResponse.json(data, { status: 201 })
}
