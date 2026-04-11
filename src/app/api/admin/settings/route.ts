import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/audit'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

// GET /api/admin/settings — fetch all site settings
export async function GET() {
  // BUG-003 FIX: Require admin authentication before exposing any settings
  const { error, status } = await requireAdmin(['admin'])
  if (error) return NextResponse.json({ error }, { status })

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
  // BUG-003 FIX: Require admin authentication before allowing any settings update
  // Only 'admin' role allowed (not production_staff) to prevent privilege escalation
  const authResult = await requireAdmin(['admin'])
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

  try {
    const body = await req.json()
    const { settings } = body as { settings: Record<string, string> }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      )
    }

    // Validate pricing fields
    if (settings.vat_rate !== undefined) {
      const v = parseFloat(settings.vat_rate)
      if (isNaN(v) || v < 0 || v > 1) {
        return NextResponse.json({ error: 'VAT rate must be between 0 and 1' }, { status: 400 })
      }
    }
    if (settings.free_delivery_threshold !== undefined) {
      const v = parseFloat(settings.free_delivery_threshold)
      if (isNaN(v) || v < 0) {
        return NextResponse.json({ error: 'Free delivery threshold must be 0 or greater' }, { status: 400 })
      }
    }
    if (settings.flat_shipping_rate !== undefined) {
      const v = parseFloat(settings.flat_shipping_rate)
      if (isNaN(v) || v < 0) {
        return NextResponse.json({ error: 'Flat shipping rate must be 0 or greater' }, { status: 400 })
      }
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

    const { user } = authResult // requireAdmin result includes user

    // Log activity
    await logActivity({
      user_id: (user as any).id,
      action: 'site_settings_updated',
      entity_type: 'site_settings',
      metadata: { keys: Object.keys(settings) },
      is_admin_action: true,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
