import { NextRequest, NextResponse } from 'next/server'

// Matches both /view and /edit share links
const CANVA_DESIGN_RE = /canva\.com\/design\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)\/(view|edit)/

/**
 * GET /api/canva/resolve?url=<canva_share_url>
 *
 * Follows canva.link short-URLs server-side (avoids CORS), extracts the
 * design ID + share hash, and returns an embed-ready URL.
 *
 * Supports:
 *   - canva.link short links   → https://canva.link/xxxxx
 *   - Full Canva view URLs     → https://www.canva.com/design/{id}/{hash}/view
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')
  if (!raw) {
    return NextResponse.json({ error: 'url parameter is required' }, { status: 400 })
  }

  // Validate it looks like a Canva URL before following redirects
  const isCanvaUrl =
    raw.includes('canva.link') ||
    raw.includes('canva.com/design') ||
    raw.includes('www.canva.com')

  if (!isCanvaUrl) {
    return NextResponse.json({ error: 'Not a recognised Canva URL' }, { status: 422 })
  }

  let finalUrl: string
  try {
    const res = await fetch(raw, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      },
      // Only follow the redirect chain, don't download the body
      signal: AbortSignal.timeout(8000),
    })
    finalUrl = res.url
  } catch (err) {
    console.error('[canva/resolve] fetch error:', err)
    return NextResponse.json({ error: 'Could not reach Canva. Check the URL and try again.' }, { status: 502 })
  }

  const match = finalUrl.match(CANVA_DESIGN_RE)
  if (!match) {
    return NextResponse.json(
      { error: 'Could not find a Canva design in that URL. Make sure the link is set to "Anyone with the link can view".' },
      { status: 422 }
    )
  }

  const [, designId, shareHash] = match
  // Clean URL without UTM params
  const cleanUrl = `https://www.canva.com/design/${designId}/${shareHash}/view`
  const embedUrl = `${cleanUrl}?embed`

  return NextResponse.json({ designId, shareHash, resolvedUrl: cleanUrl, embedUrl })
}
