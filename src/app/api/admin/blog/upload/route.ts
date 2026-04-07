import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/admin/blog/upload
 *
 * Accepts a multipart/form-data body with a "file" field.
 * Uploads to Supabase Storage bucket "blog".
 */

const BUCKET = 'blog'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

const ALLOWED_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
}

export async function POST(request: NextRequest) {
  try {
    // --- Auth Check ---
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin/staff role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'production_staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // --- Parse Form ---
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // --- Validate ---
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum is 5 MB.' },
        { status: 413 }
      )
    }

    const mimeType = file.type
    const extension = ALLOWED_MIME[mimeType]

    if (!extension) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please use PNG, JPG, WebP, or SVG.' },
        { status: 415 }
      )
    }

    // --- Upload ---
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 100)

    const storagePath = `featured/${Date.now()}-${sanitizedName}`

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    const admin = createAdminClient()
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('[/api/admin/blog/upload] Storage error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image. Please try again.' },
        { status: 500 }
      )
    }

    // --- Get Public URL ---
    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

    return NextResponse.json({
      url: publicUrl,
    })
  } catch (err) {
    console.error('[/api/admin/blog/upload] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
