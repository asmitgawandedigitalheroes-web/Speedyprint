import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/testimonials — list all testimonials
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ testimonials: data })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    )
  }
}

// POST /api/admin/testimonials — create a new testimonial
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_name, company_name, location, rating, review_text, featured } =
      body

    if (!customer_name || !review_text || !rating) {
      return NextResponse.json(
        { error: 'Customer name, review text, and rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        customer_name,
        company_name: company_name || null,
        location: location || null,
        rating,
        review_text,
        featured: featured ?? false,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ testimonial: data }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create testimonial' },
      { status: 500 }
    )
  }
}
