import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('product_groups')
      .select(
        `
        *,
        product_templates (
          *,
          template_parameters (*)
        ),
        pricing_rules (*)
      `
      )
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort templates and parameters by display_order
    if (data.product_templates) {
      data.product_templates.sort(
        (a: { display_order?: number }, b: { display_order?: number }) =>
          (a.display_order ?? 0) - (b.display_order ?? 0)
      )
      for (const template of data.product_templates) {
        if (template.template_parameters) {
          template.template_parameters.sort(
            (a: { display_order: number }, b: { display_order: number }) =>
              a.display_order - b.display_order
          )
        }
      }
    }

    // Sort pricing rules by display_order
    if (data.pricing_rules) {
      data.pricing_rules.sort(
        (a: { display_order: number }, b: { display_order: number }) =>
          a.display_order - b.display_order
      )
    }

    return NextResponse.json({ product: data })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
