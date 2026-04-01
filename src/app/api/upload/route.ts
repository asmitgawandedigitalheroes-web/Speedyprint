import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/upload
 *
 * Accepts a multipart/form-data body with a single "file" field.
 * Validates type and size, uploads to Supabase Storage bucket
 * "design-assets" (CDN-backed), and returns the public URL.
 *
 * Accepted types: PNG, JPG, WebP, SVG, PDF
 * Max size: 50 MB (enforced here and should match client-side validation)
 */

const BUCKET = 'design-assets'
const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

const ALLOWED_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
}

export async function POST(request: NextRequest) {
  try {
    // --- Auth ---
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // --- Parse multipart form ---
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // --- Validate size ---
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is 50 MB.`,
        },
        { status: 413 }
      )
    }

    // --- Validate MIME type ---
    // BUG-019 FIX: Do NOT fall back to file extension checking.
    // An attacker can name 'malware.exe' with Content-Type: image/png —
    // the MIME check fails but the filename extension fallback would previously accept it.
    // Now we ONLY accept files with a MIME type in the explicit whitelist.
    const mimeType = file.type
    const extension = ALLOWED_MIME[mimeType]

    if (!extension) {
      return NextResponse.json(
        {
          error: `Unsupported file type "${mimeType}". Accepted: PNG, JPG, WebP, SVG, PDF.`,
        },
        { status: 415 }
      )
    }

    // --- Build storage path ---
    // design-assets/{userId}/{timestamp}-{sanitized-name}
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 100)

    const storagePath = `${user.id}/${Date.now()}-${sanitizedName}`

    // --- Upload to Supabase Storage ---
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    const admin = createAdminClient()
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('[/api/upload] Storage error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to store file. Please try again.' },
        { status: 500 }
      )
    }

    // --- Get public CDN URL ---
    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

    return NextResponse.json({
      url: publicUrl,
      path: storagePath,
    })
  } catch (err) {
    console.error('[/api/upload] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
