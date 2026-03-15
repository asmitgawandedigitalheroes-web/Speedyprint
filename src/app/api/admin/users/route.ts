import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/users — list users with pagination, search, role filter
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const search = url.searchParams.get('search') ?? ''
    const role = url.searchParams.get('role') ?? ''
    const page = parseInt(url.searchParams.get('page') ?? '1', 10)
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)
    const offset = (page - 1) * limit

    const supabase = createAdminClient()

    // Build the query
    let query = supabase
      .from('profiles')
      .select('*, orders:orders(id)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`
      )
    }

    if (role) {
      query = query.eq('role', role)
    }

    const { data, error, count } = await query

    if (error) throw error

    const users = (data ?? []).map((user) => ({
      ...user,
      order_count: user.orders?.length ?? 0,
      orders: undefined,
    }))

    return NextResponse.json({
      users,
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
