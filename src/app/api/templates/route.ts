import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/templates
 * Returns all active product templates grouped with their product group.
 * Uses the admin client to bypass RLS so customers/anonymous users in the
 * designer can always load templates regardless of row-level security policies.
 * Falls back to the anon client if the service role key is not configured.
 */
export async function GET() {
  try {
    const query = async (supabase: ReturnType<typeof createAdminClient>) => {
      return supabase
        .from('product_templates')
        .select('*, product_group:product_groups(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
    }

    let data: unknown[] | null = null
    let error: { message: string } | null = null

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const result = await query(createAdminClient())
      data = result.data
      error = result.error
    }

    // Fallback to anon client if admin client is not available or failed
    if (!data) {
      const anonClient = await createClient()
      const result = await (anonClient as unknown as ReturnType<typeof createAdminClient>)
        .from('product_templates')
        .select('*, product_group:product_groups(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      data = result.data
      error = result.error
    }

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
