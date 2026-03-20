import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/designs — list all designs across all users
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || ''
    const userId = searchParams.get('user_id') || ''

    const offset = (page - 1) * limit

    let query = supabase
      .from('designs')
      .select(
        `
        id,
        user_id,
        product_template_id,
        name,
        thumbnail_url,
        is_saved_template,
        created_at,
        updated_at,
        profiles:user_id (id, email, full_name),
        product_templates:product_template_id (id, name, product_group_id, product_groups:product_group_id (name))
      `,
        { count: 'exact' }
      )
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      designs: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch designs' },
      { status: 500 }
    )
  }
}
