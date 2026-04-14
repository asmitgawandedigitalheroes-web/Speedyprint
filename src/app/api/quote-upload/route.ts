import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rateLimit'

/**
 * POST /api/quote-upload
 *
 * Public (unauthenticated) artwork upload for quote/enquiry submissions.
 * Files are stored in the design-assets bucket under quotes/ and are
 * accessible via the returned public URL.
 *
 * Accepted types: PDF, AI (application/postscript), EPS, PNG, JPG, SVG
 * Max size: 50 MB
 */

const BUCKET = 'design-assets'
const MAX_SIZE_BYTES = 50 * 1024 * 1024

// MIME types accepted for quote artwork
const ALLOWED_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/svg+xml': '.svg',
  'application/postscript': '.ai',  // AI files
  'application/eps': '.eps',
  'application/x-eps': '.eps',
  'image/x-eps': '.eps',
}

// Extension fallback for types browsers may misreport (AI/EPS often come as octet-stream)
const ALLOWED_EXTENSIONS = ['.pdf', '.ai', '.eps', '.png', '.jpg', '.jpeg', '.svg']

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 uploads per IP per hour
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? '127.0.0.1'
    if (!(await rateLimit(`quote-upload:${ip}`, 10, 60 * 60 * 1000))) {
      return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    // Size check
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 50 MB.` },
        { status: 413 }
      )
    }

    // MIME or extension check (AI/EPS often reported as octet-stream by browsers)
    const mimeOk = !!ALLOWED_MIME[file.type]
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    const extOk = ALLOWED_EXTENSIONS.includes(ext)

    if (!mimeOk && !extOk) {
      return NextResponse.json(
        { error: `Unsupported file type. Accepted: PDF, AI, EPS, PNG, JPG, SVG.` },
        { status: 415 }
      )
    }

    // Sanitize filename
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 100)

    const storagePath = `quotes/${Date.now()}-${sanitizedName}`

    const admin = createAdminClient()
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, new Uint8Array(arrayBuffer), {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('[/api/quote-upload] Storage error:', uploadError)
      return NextResponse.json({ error: 'Failed to store file. Please try again.' }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

    return NextResponse.json({ url: publicUrl, path: storagePath })
  } catch (err) {
    console.error('[/api/quote-upload] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
