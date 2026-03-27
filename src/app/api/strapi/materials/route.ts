import { NextRequest, NextResponse } from 'next/server'

const STRAPI_HOST = 'https://github.kuaitu.cc'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint') || 'material-types'
  const query = searchParams.toString().replace(`endpoint=${endpoint}`, '').replace(/^&/, '')

  try {
    const url = `${STRAPI_HOST}/api/${endpoint}${query ? `?${query}` : ''}`
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300 }, // cache 5 mins
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error', status: res.status }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[Strapi proxy error]', err)
    return NextResponse.json({ error: 'Failed to fetch from Strapi' }, { status: 500 })
  }
}
