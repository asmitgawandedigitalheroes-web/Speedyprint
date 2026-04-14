import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error: authError, status: authStatus } = await requireAdmin()
  if (authError) return NextResponse.json({ error: authError }, { status: authStatus })

  const { data, error } = await createAdminClient()
    .from('quote_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error: authError, status: authStatus } = await requireAdmin()
  if (authError) return NextResponse.json({ error: authError }, { status: authStatus })

  const body = await request.json()

  const ALLOWED_STATUSES = ['new', 'reviewing', 'quoted', 'accepted', 'rejected', 'expired']
  const patch: Record<string, unknown> = {}

  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 })
    }
    patch.status = body.status
  }
  if (body.quoted_price !== undefined) {
    const price = Number(body.quoted_price)
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: 'Invalid quoted_price.' }, { status: 400 })
    }
    patch.quoted_price = price
  }
  if (body.quote_valid_days !== undefined) {
    patch.quote_valid_days = Math.max(1, parseInt(body.quote_valid_days))
  }
  if (body.admin_notes !== undefined) {
    patch.admin_notes = String(body.admin_notes).slice(0, 5000)
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  const { data, error } = await createAdminClient()
    .from('quote_requests')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error('[Admin/Quotes] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update quote.' }, { status: 500 })
  }
  return NextResponse.json(data)
}
