import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/designs/:id
 * Load a single design.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

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
      .select('*, product_template:product_templates(*, product_group:product_groups(*))')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error loading design:', error)
      return NextResponse.json({ error: 'Design not found' }, { status: 404 })
    }

    // Check ownership or admin
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    if (data.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /api/designs/:id error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/designs/:id
 * Update a design (canvas_json, name, thumbnail_url).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

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

    // Verify ownership
    const { data: existing, error: fetchError } = await admin
      .from('designs')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 })
    }

    // Check ownership or admin
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    if (existing.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.canvas_json !== undefined) updates.canvas_json = body.canvas_json
    if (body.name !== undefined) updates.name = body.name
    if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url

    const { data, error } = await admin
      .from('designs')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating design:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('PATCH /api/designs/:id error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/designs/:id
 * Delete a design.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

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

    // Verify ownership
    const { data: existing, error: fetchError } = await admin
      .from('designs')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 })
    }

    // Check ownership or admin
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    if (existing.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await admin.from('designs').delete().eq('id', id)

    if (error) {
      console.error('Error deleting design:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/designs/:id error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
