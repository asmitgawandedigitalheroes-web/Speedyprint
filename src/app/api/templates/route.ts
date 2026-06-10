import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/templates
 * Returns all active product templates grouped with their product group.
 * Uses the admin client to bypass RLS so customers/anonymous users in the
 * designer can always load templates regardless of row-level security policies.
 */
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('product_templates')
      .select('*, product_group:product_groups!inner(*)')
      .eq('is_active', true)
      .eq('product_groups.is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[/api/templates] fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [], {
      headers: {
        // Cache for 60 seconds at the CDN edge – templates don't change often
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (err: any) {
    console.error('[/api/templates] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
