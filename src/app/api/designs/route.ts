import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/audit'

/**
 * POST /api/designs
 * Save a new design.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { product_template_id, name, canvas_json, thumbnail_url } = body

    if (!product_template_id || !name || !canvas_json) {
      return NextResponse.json(
        { error: 'Missing required fields: product_template_id, name, canvas_json' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('designs')
      .insert({
        user_id: user.id,
        product_template_id,
        name,
        canvas_json,
        thumbnail_url: thumbnail_url || null,
        is_saved_template: false,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error saving design:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await logActivity({
      user_id: user.id,
      action: 'design_created',
      entity_type: 'design',
      entity_id: data.id,
      metadata: { name: data.name },
    })

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('POST /api/designs error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/designs
 * List the current user's designs with thumbnails.
 */
export async function GET() {
  try {
    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('designs')
      .select('id, name, thumbnail_url, product_template_id, created_at, updated_at, product_template:product_templates(id, name, product_group:product_groups(name))')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error listing designs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /api/designs error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
