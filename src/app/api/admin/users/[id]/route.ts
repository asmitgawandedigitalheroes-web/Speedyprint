import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/users/[id] — get user profile + their orders
export async function GET(_req: NextRequest, { params }: RouteParams) {
  // BUG-004 FIX: Require admin authentication — profile data and order history are sensitive
  const { error: authError, status: authStatus } = await requireAdmin()
  if (authError) return NextResponse.json({ error: authError }, { status: authStatus })

  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch user's orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at, paid_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      profile,
      orders: orders ?? [],
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] — update user profile
export async function PUT(req: NextRequest, { params }: RouteParams) {
  // BUG-004 FIX: Require admin authentication before updating any user's profile
  const { error: authError, status: authStatus } = await requireAdmin()
  if (authError) return NextResponse.json({ error: authError }, { status: authStatus })

  try {
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()

    const allowedFields = [
      'full_name',
      'company_name',
      'phone',
      'address_line1',
      'address_line2',
      'city',
      'province',
      'postal_code',
      'country',
      // BUG-004 FIX: 'role' intentionally removed from allowedFields.
      // Role changes are a privileged operation and must go through a
      // dedicated endpoint with additional validation and audit logging.
      // Leaving 'role' here allowed any authenticated user (or exploited admin)
      // to escalate any account to admin role via a simple PUT request.
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ profile: data })
  } catch {
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
