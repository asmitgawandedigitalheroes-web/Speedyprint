import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculatePrice } from '@/lib/pricing/calculator'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { quantity, params: selectedParams } = body as {
      quantity: number
      params: Record<string, string>
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch active pricing rules for this product group
    const { data: rules, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('product_group_id', id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!rules || rules.length === 0) {
      return NextResponse.json(
        { error: 'No pricing rules configured for this product' },
        { status: 404 }
      )
    }

    const result = calculatePrice(rules, {
      quantity,
      ...selectedParams,
    })

    return NextResponse.json({ price: result })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
