import { NextRequest, NextResponse } from 'next/server'

const ICONIFY_BASE = 'https://api.iconify.design'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') // e.g. "search" or "collection" or "mdi/star.svg"

  if (!path) {
    return NextResponse.json({ error: 'Missing path param' }, { status: 400 })
  }

  // Forward all other query params to Iconify
  const forward = new URLSearchParams()
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'path') forward.set(key, value)
  }

  const upstreamUrl = `${ICONIFY_BASE}/${path}${forward.toString() ? `?${forward.toString()}` : ''}`

  try {
    const res = await fetch(upstreamUrl, {
      headers: { 'Accept': 'application/json, image/svg+xml, */*' },
      next: { revalidate: 3600 }, // cache 1 hour — icons don't change often
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error', status: res.status }, { status: res.status })
    }

    const contentType = res.headers.get('content-type') || ''

    if (contentType.includes('svg')) {
      const text = await res.text()
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (err) {
    console.error('[Iconify proxy error]', err)
    return NextResponse.json({ error: 'Failed to fetch from Iconify' }, { status: 500 })
  }
}
