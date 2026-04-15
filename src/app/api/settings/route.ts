import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/settings — public read-only settings endpoint
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('site_settings').select('*')

    if (error) throw error

    const settings: Record<string, string> = {}
    for (const row of data ?? []) {
      settings[row.key] = row.value
    }

    return NextResponse.json({ settings }, {
      headers: {
        // Cache at the browser and CDN edge for 5 min; serve stale for up to 10 min while revalidating
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
