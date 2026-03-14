import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/blog/[id] — get a single blog post
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post: data })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/blog/[id] — update a blog post
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, slug, excerpt, content, featured_image, author, published } =
      body

    const supabase = createAdminClient()

    // Get current post to check publish state change
    const { data: current } = await supabase
      .from('blog_posts')
      .select('published')
      .eq('id', id)
      .single()

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (excerpt !== undefined) updateData.excerpt = excerpt || null
    if (content !== undefined) updateData.content = content || null
    if (featured_image !== undefined)
      updateData.featured_image = featured_image || null
    if (author !== undefined) updateData.author = author || null
    if (published !== undefined) {
      updateData.published = published
      // Set published_at when first published
      if (published && !current?.published) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A post with this slug already exists' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ post: data })
  } catch {
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/blog/[id] — delete a blog post
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
