import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(['admin', 'production_staff'])
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const userId = searchParams.get('userId')
    const isAdminAction = searchParams.get('isAdminAction')
    const search = searchParams.get('search') // Order number or similar

    const supabase = createAdminClient()
    let query = supabase
      .from('audit_logs')
      .select('*, profile:profiles(id, full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (action) query = query.eq('action', action)
    if (entityType) query = query.eq('entity_type', entityType)
    if (userId) query = query.eq('user_id', userId)
    if (isAdminAction !== null && isAdminAction !== undefined && isAdminAction !== '') {
      query = query.eq('is_admin_action', isAdminAction === 'true')
    }
    
    // Filtering by metadata search (e.g. order number)
    if (search) {
      query = query.or(`metadata->>order_number.ilike.%${search}%,metadata->>name.ilike.%${search}%`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, count, error } = await query.range(from, to)

    if (error) throw error

    return NextResponse.json({
      logs: data,
      count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (err: any) {
    console.error('AuditLog Fetch Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
