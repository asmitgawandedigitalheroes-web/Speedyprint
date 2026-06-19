import { NextRequest, NextResponse } from 'next/server'

const CANVA_DESIGN_RE = /canva\.com\/design\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/(view|edit)/

/**
 * GET /api/canva/screenshot?embedUrl=<url>
 *
 * Uses a headless Chromium browser (playwright-core) to render the Canva
 * design embed and return a high-quality PNG as a base64 data URL.
 * This is intentionally server-only — Chromium is never shipped to the client.
 */
export async function GET(req: NextRequest) {
  const embedUrl = req.nextUrl.searchParams.get('embedUrl')

  if (!embedUrl || !CANVA_DESIGN_RE.test(embedUrl)) {
    return NextResponse.json({ error: 'Invalid or missing embedUrl' }, { status: 400 })
  }

  let browser
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { chromium } = require('playwright-core')

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })

    const page = await browser.newPage()

    // High-res viewport so the design renders at good quality
    await page.setViewportSize({ width: 1920, height: 1080 })

    // Use the embed URL — it's lighter than the full viewer and loads faster.
    // waitUntil:'domcontentloaded' avoids the timeout caused by Canva's constant
    // background analytics requests which prevent 'networkidle' from ever firing.
    await page.goto(embedUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    })

    // Wait for Canva's React canvas to finish painting the design
    await page.waitForTimeout(6000)

    // Try to find and screenshot just the design canvas element
    // Canva renders the design inside a <canvas> or presentation container
    let screenshotBuffer: Buffer
    try {
      // Canva's presentation wrapper — hide the header/toolbar UI
      await page.evaluate(() => {
        // Hide Canva chrome: nav bars, buttons, etc.
        const selectors = [
          '[data-testid="page-tools"]',
          '[data-testid="present-menu"]',
          'header',
          'nav',
          '[role="toolbar"]',
        ]
        selectors.forEach(sel => {
          document.querySelectorAll(sel).forEach((el) => {
            ;(el as HTMLElement).style.display = 'none'
          })
        })
      })
      await page.waitForTimeout(300)
      screenshotBuffer = await page.screenshot({ type: 'png' })
    } catch {
      screenshotBuffer = await page.screenshot({ type: 'png' })
    }

    const base64 = screenshotBuffer.toString('base64')
    return NextResponse.json({ image: `data:image/png;base64,${base64}` })
  } catch (err) {
    console.error('[canva/screenshot] error:', err)
    return NextResponse.json(
      { error: 'Could not capture the Canva design. Make sure the link is set to "Anyone can view".' },
      { status: 500 }
    )
  } finally {
    await browser?.close()
  }
}
