import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Division } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const division = searchParams.get('division') as Division | null

    let query = supabase
      .from('product_groups')
      .select('*, product_templates(id)')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (division) {
      query = query.eq('division', division)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add template_count to each product group
    const products = (data ?? []).map((group) => ({
      ...group,
      template_count: Array.isArray(group.product_templates)
        ? group.product_templates.length
        : 0,
      product_templates: undefined,
    }))

    return NextResponse.json({ products })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
