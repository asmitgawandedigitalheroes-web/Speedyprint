import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type RouteParams = { params: Promise<{ id: string }> }

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'production_staff'].includes(profile.role)) return null

  return admin
}

// GET /api/admin/templates/:id
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('product_templates')
      .select('*, product_group:product_groups(id, name, division), parameters:template_parameters(*)')
      .eq('id', id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    return NextResponse.json({ template: data })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}

// PUT /api/admin/templates/:id
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      product_group_id,
      name,
      description,
      print_width_mm,
      print_height_mm,
      bleed_mm,
      safe_zone_mm,
      dpi,
      image_url,
      is_active,
    } = body

    const updates: Record<string, unknown> = {}
    if (product_group_id !== undefined) updates.product_group_id = product_group_id
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description || null
    if (print_width_mm !== undefined) updates.print_width_mm = print_width_mm
    if (print_height_mm !== undefined) updates.print_height_mm = print_height_mm
    if (bleed_mm !== undefined) updates.bleed_mm = bleed_mm
    if (safe_zone_mm !== undefined) updates.safe_zone_mm = safe_zone_mm
    if (dpi !== undefined) updates.dpi = dpi
    if (image_url !== undefined) updates.image_url = image_url || null
    if (is_active !== undefined) updates.is_active = is_active

    const { data, error } = await admin
      .from('product_templates')
      .update(updates)
      .eq('id', id)
      .select('*, product_group:product_groups(id, name, division)')
      .single()

    if (error) throw error

    return NextResponse.json({ template: data })
  } catch {
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

// DELETE /api/admin/templates/:id
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await admin.from('product_templates').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
