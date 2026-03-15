import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/users/[id] — get user profile + their orders
export async function GET(_req: NextRequest, { params }: RouteParams) {
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
      'role',
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
