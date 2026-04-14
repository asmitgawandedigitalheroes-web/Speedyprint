import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export async function GET(request: NextRequest) {
  try {
    const { error: authError, status: authStatus } = await requireAdmin()
    if (authError) return NextResponse.json({ error: authError }, { status: authStatus })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '50'))
    const offset = (page - 1) * limit

    const admin = createAdminClient()

    let query = admin
      .from('quote_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (search?.trim()) {
      const s = search.trim()
      query = query.or(
        `full_name.ilike.%${s}%,email.ilike.%${s}%,event_name.ilike.%${s}%,company.ilike.%${s}%`
      )
    }

    const { data, error, count } = await query
    if (error) {
      console.error('[Admin/Quotes] Fetch error:', error.message, error.details, error.hint)
      return NextResponse.json(
        { error: 'Failed to fetch quotes.', detail: error.message },
        { status: 500 }
      )
    }

    // New (unread) count
    const { count: newCount } = await admin
      .from('quote_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')

    return NextResponse.json({
      quotes:   data     ?? [],
      total:    count    ?? 0,
      page,
      limit,
      newCount: newCount ?? 0,
    })
  } catch (err) {
    console.error('[Admin/Quotes] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
}
