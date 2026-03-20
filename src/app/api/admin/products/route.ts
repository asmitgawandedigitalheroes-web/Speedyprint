import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/products — list all product groups
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)
    const division = searchParams.get('division')

    let query = supabase
      .from('product_groups')
      .select('*, product_templates(id)')
      .order('display_order', { ascending: true })

    if (division) {
      query = query.eq('division', division)
    }

    const { data, error } = await query

    if (error) throw error

    // Add template count
    const products = (data || []).map((p) => ({
      ...p,
      template_count: p.product_templates?.length || 0,
      product_templates: undefined,
    }))

    return NextResponse.json({ products })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/admin/products — create a new product group
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, description, division, image_url, display_order, is_active } = body

    if (!name || !division) {
      return NextResponse.json(
        { error: 'Name and division are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('product_groups')
      .insert({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: description || null,
        division,
        image_url: image_url || null,
        display_order: display_order ?? 0,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A product with this slug already exists' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ product: data }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
