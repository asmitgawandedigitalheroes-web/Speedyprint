/**
 * Lightweight server-safe sanitizers.
 * No external dependencies — works in both Node and Edge runtimes.
 */

/**
 * Sanitizes HTML content to remove XSS vectors.
 * Strips <script>, <iframe>, event handlers, and javascript: URLs.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''

  return html
    // Remove <script> blocks and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove <iframe> blocks
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove dangerous interactive elements
    .replace(/<(object|embed|applet|form|input|button|textarea|select)\b[^>]*>/gi, '')
    // Remove all inline event handlers (onclick, onload, onerror, etc.)
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    // Remove javascript: protocol in href/src/action
    .replace(/(href|src|action|formaction)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '')
    // Remove data: URIs in src (can carry malicious payloads)
    .replace(/src\s*=\s*(?:"data:[^"]*"|'data:[^']*')/gi, '')
    // Remove <base> tag (can redirect all relative URLs)
    .replace(/<base\b[^>]*>/gi, '')
    // Remove <meta http-equiv> (can trigger refreshes/redirects)
    .replace(/<meta\b[^>]*http-equiv[^>]*>/gi, '')
}

/**
 * Sanitizes SVG markup from the database to prevent XSS.
 * Strips script elements, foreignObject (can embed arbitrary HTML),
 * and all inline event handlers.
 */
export function sanitizeSvg(svg: string): string {
  if (!svg || typeof svg !== 'string') return ''

  return svg
    // Remove <script> blocks
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove <foreignObject> — can embed full HTML documents
    .replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '')
    // Remove inline event handlers
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>\/]*)/gi, '')
    // Remove javascript: hrefs/xlinks
    .replace(/(href|xlink:href)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '')
    // Remove data: hrefs
    .replace(/(href|xlink:href)\s*=\s*(?:"data:[^"]*"|'data:[^']*')/gi, '')
    // Remove use of external resources via xlink:href pointing to external URLs
    .replace(/xlink:href\s*=\s*(?:"https?:[^"]*"|'https?:[^']*')/gi, '')
}

/**
 * Prevents CSV formula injection by prefixing dangerous leading characters with a single quote.
 * Cells starting with =, +, -, @, TAB, or CR are treated as formulas by Excel/Sheets.
 */
export function sanitizeCsvCell(value: string): string {
  if (!value || typeof value !== 'string') return ''
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

/**
 * Validates that a redirect path is a safe relative URL.
 * Prevents open redirects via //evil.com or javascript: URLs.
 */
export function isSafeRedirect(path: string): boolean {
  if (!path || typeof path !== 'string') return false
  // Must start with / but not // (protocol-relative URL)
  return path.startsWith('/') && !path.startsWith('//')
}

/**
 * Validates that a request's Origin header matches the app's own origin.
 * Use on state-mutating API routes to prevent CSRF from third-party sites.
 * Pass the request's Origin header and the app's base URL.
 */
export function isValidOrigin(origin: string | null, appUrl: string): boolean {
  if (!origin) return false
  try {
    const requestOrigin = new URL(origin)
    const appOrigin = new URL(appUrl)

    // Allow localhost and 127.0.0.1 in development
    if (
      requestOrigin.hostname === 'localhost' ||
      requestOrigin.hostname === '127.0.0.1'
    ) {
      return true
    }

    return requestOrigin.hostname === appOrigin.hostname
  } catch {
    return false
  }
}
