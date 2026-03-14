import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type RouteParams = { params: Promise<{ id: string }> }

// PUT /api/admin/testimonials/[id] — update a testimonial
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await req.json()
    const { customer_name, company_name, location, rating, review_text, featured } =
      body

    const updateData: Record<string, unknown> = {}
    if (customer_name !== undefined) updateData.customer_name = customer_name
    if (company_name !== undefined) updateData.company_name = company_name || null
    if (location !== undefined) updateData.location = location || null
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        )
      }
      updateData.rating = rating
    }
    if (review_text !== undefined) updateData.review_text = review_text
    if (featured !== undefined) updateData.featured = featured

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('testimonials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ testimonial: data })
  } catch {
    return NextResponse.json(
      { error: 'Failed to update testimonial' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/testimonials/[id] — delete a testimonial
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete testimonial' },
      { status: 500 }
    )
  }
}
