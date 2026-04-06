import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export async function GET(request: NextRequest) {
  const { error: authError, status: authStatus } = await requireAdmin()
  if (authError) return NextResponse.json({ error: authError }, { status: authStatus })

  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const unreadCount = (data ?? []).filter((r) => r.status === 'unread').length

    return NextResponse.json({ submissions: data ?? [], unreadCount })
  } catch (err) {
    console.error('[Enquiries GET] error:', err)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}
