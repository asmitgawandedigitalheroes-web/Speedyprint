import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/settings — fetch all site settings
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('site_settings').select('*')

    if (error) throw error

    const settings: Record<string, string> = {}
    for (const row of data ?? []) {
      settings[row.key] = row.value
    }

    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings — update site settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { settings } = body as { settings: Record<string, string> }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    for (const [key, value] of Object.entries(settings)) {
      const { error } = await supabase.from('site_settings').upsert(
        {
          key,
          value: String(value),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
