import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/templates — list all product templates
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get('group_id')
    const isActive = searchParams.get('is_active')

    let query = supabase
      .from('product_templates')
      .select('*, product_group:product_groups(id, name, division)')
      .order('name', { ascending: true })

    if (groupId) query = query.eq('product_group_id', groupId)
    if (isActive !== null) query = query.eq('is_active', isActive === 'true')

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ templates: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST /api/admin/templates — create a new template
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'production_staff'].includes(profile.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

    if (!product_group_id || !name) {
      return NextResponse.json({ error: 'product_group_id and name are required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('product_templates')
      .insert({
        product_group_id,
        name,
        description: description || null,
        print_width_mm: print_width_mm ?? 100,
        print_height_mm: print_height_mm ?? 100,
        bleed_mm: bleed_mm ?? 3,
        safe_zone_mm: safe_zone_mm ?? 5,
        dpi: dpi ?? 300,
        image_url: image_url || null,
        is_active: is_active ?? true,
        template_json: {},
        panels: [],
      })
      .select('*, product_group:product_groups(id, name, division)')
      .single()

    if (error) throw error

    return NextResponse.json({ template: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
