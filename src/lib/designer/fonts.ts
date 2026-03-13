/**
 * Google Fonts utility for the web-to-print designer.
 * Provides dynamic font loading and a shared font list.
 */

// --- Font List ---

export const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Raleway',
  'Poppins',
  'Playfair Display',
  'Merriweather',
  'Source Sans 3',
  'Ubuntu',
  'Nunito',
  'PT Sans',
  'Work Sans',
  'Quicksand',
  'Barlow',
  'Cabin',
  'Dosis',
  'Titillium Web',
] as const

export type GoogleFont = (typeof GOOGLE_FONTS)[number]

// --- Font Loading ---

const loadedFonts = new Set<string>()
let linkElement: HTMLLinkElement | null = null

/**
 * Load a single Google Font dynamically by injecting/updating
 * a `<link>` element in `<head>`.
 */
export function loadGoogleFont(font: string): void {
  if (typeof window === 'undefined') return
  if (loadedFonts.has(font)) return
  loadedFonts.add(font)
  rebuildFontLink()
}

/**
 * Load all Google Fonts at once (call on designer mount).
 */
export function loadGoogleFonts(fonts: readonly string[]): void {
  if (typeof window === 'undefined') return

  let changed = false
  for (const font of fonts) {
    if (!loadedFonts.has(font)) {
      loadedFonts.add(font)
      changed = true
    }
  }

  if (changed) {
    rebuildFontLink()
  }
}

/**
 * Build (or update) the single Google Fonts `<link>` stylesheet in `<head>`.
 */
function rebuildFontLink(): void {
  const families = Array.from(loadedFonts)
    .map((f) => f.replace(/ /g, '+'))
    .join('&family=')

  const href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`

  if (!linkElement) {
    linkElement = document.createElement('link')
    linkElement.rel = 'stylesheet'
    linkElement.id = 'sp-google-fonts'
    document.head.appendChild(linkElement)
  }

  linkElement.href = href
}
