import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'

const MM_TO_POINTS = 2.8346

// Local type aliases for pdf-lib internal types
type EmbeddedFont = Awaited<ReturnType<PDFDocument['embedFont']>>
type PDFPageObj = ReturnType<PDFDocument['addPage']>

interface CanvasObject {
  type: string
  left?: number
  top?: number
  width?: number
  height?: number
  scaleX?: number
  scaleY?: number
  angle?: number
  fill?: string | null
  stroke?: string | null
  strokeWidth?: number
  opacity?: number
  visible?: boolean
  // Text
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string | number
  fontStyle?: string
  textAlign?: string
  lineHeight?: number
  // Per-placeholder VDP text fitting config
  minFontSize?: number
  maxFontSize?: number
  overflowBehavior?: 'truncate' | 'shrink' | 'stretch'
  multiline?: boolean
  // Image
  src?: string
  // Circle
  radius?: number
  // Group children
  objects?: CanvasObject[]
  isArtboard?: boolean
  isGuide?: boolean
  rawText?: string
  originX?: string
  originY?: string
}

// ─── Text fitting helpers ─────────────────────────────────────────────────────

/**
 * Truncate text with "…" so it fits within maxWidth at the given font size.
 * Returns the original string if it already fits.
 */
function truncateTextToWidth(
  text: string,
  font: EmbeddedFont,
  fontSize: number,
  maxWidth: number
): string {
  if (!text || maxWidth <= 0) return text
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text
  const ellipsis = '...'
  const ellipsisW = font.widthOfTextAtSize(ellipsis, fontSize)
  if (ellipsisW >= maxWidth) return text.slice(0, 1)
  let t = text
  while (t.length > 1 && font.widthOfTextAtSize(t, fontSize) + ellipsisW > maxWidth) {
    t = t.slice(0, -1)
  }
  return t + ellipsis
}

/**
 * Word-wrap a single line of text into multiple lines that each fit maxWidth.
 */
function wrapTextToWidth(
  text: string,
  font: EmbeddedFont,
  fontSize: number,
  maxWidth: number
): string[] {
  if (!text || maxWidth <= 0) return [text ?? '']
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : [text]
}

/**
 * Binary-search (via 0.5pt steps) for the largest font size ≤ maxFontSize
 * that makes all lines fit within (boxW × boxH).
 */
function shrinkFontToFit(
  rawLines: string[],
  font: EmbeddedFont,
  maxFontSize: number,
  minFontSize: number,
  boxW: number,
  boxH: number,
  lineHeightMult: number,
  doWordWrap: boolean
): number {
  let size = maxFontSize
  while (size > minFontSize) {
    const lineH = size * lineHeightMult
    let allLines: string[] = []
    for (const line of rawLines) {
      if (doWordWrap && boxW > 0) {
        allLines = allLines.concat(wrapTextToWidth(line, font, size, boxW))
      } else {
        allLines.push(line)
      }
    }
    const maxW = allLines.reduce((m, l) =>
      Math.max(m, l ? font.widthOfTextAtSize(l, size) : 0), 0)
    const totalH = allLines.length * lineH
    if (maxW <= boxW && (boxH <= 0 || totalH <= boxH)) break
    size = Math.max(size - 0.5, minFontSize)
  }
  return size
}

/**
 * Draw text stretched horizontally to fill targetWidth by distributing
 * extra space evenly between characters.
 */
function drawStretchedText(
  page: PDFPageObj,
  text: string,
  font: EmbeddedFont,
  fontSize: number,
  x: number,
  y: number,
  targetWidth: number,
  color: ReturnType<typeof rgb>,
  opacity: number,
  rotate?: ReturnType<typeof degrees>
) {
  const naturalW = font.widthOfTextAtSize(text, fontSize)
  if (text.length <= 1 || naturalW <= 0 || Math.abs(naturalW - targetWidth) < 0.5) {
    page.drawText(text, { x, y, size: fontSize, font, color, opacity, ...(rotate ? { rotate } : {}) })
    return
  }
  const extraPerGap = (targetWidth - naturalW) / (text.length - 1)
  let curX = x
  for (const char of text) {
    page.drawText(char, { x: curX, y, size: fontSize, font, color, opacity, ...(rotate ? { rotate } : {}) })
    curX += font.widthOfTextAtSize(char, fontSize) + extraPerGap
  }
}

export interface CanvasJSON {
  objects?: CanvasObject[]
  width?: number
  height?: number
  background?: string
}

export interface PrintSpecs {
  print_width_mm: number
  print_height_mm: number
  bleed_mm: number
}

export interface GenerateOptions {
  /** Adds a red "PROOF" watermark diagonal across the page */
  isProof?: boolean
  /** Whether to include bleed area in the output dimensions (default true) */
  includeBleed?: boolean
}

// ─── Color helpers ───────────────────────────────────────────────────────────

function parseColor(color: string | undefined | null): [number, number, number] {
  if (!color || color === 'transparent' || color === 'rgba(0,0,0,0)') return [0, 0, 0]

  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
    return [
      parseInt(full.slice(0, 2), 16) / 255,
      parseInt(full.slice(2, 4), 16) / 255,
      parseInt(full.slice(4, 6), 16) / 255,
    ]
  }

  const m = color.match(/rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)/)
  if (m) return [parseFloat(m[1]) / 255, parseFloat(m[2]) / 255, parseFloat(m[3]) / 255]

  const named: Record<string, [number, number, number]> = {
    black: [0, 0, 0], white: [1, 1, 1], red: [1, 0, 0],
    blue: [0, 0, 1], green: [0, 0.5, 0], yellow: [1, 1, 0],
    gray: [0.5, 0.5, 0.5], grey: [0.5, 0.5, 0.5],
  }
  return named[color.toLowerCase()] ?? [0, 0, 0]
}

function parseOpacity(color: string | undefined | null, objOpacity: number): number {
  if (!color) return objOpacity
  const m = color.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*(\d+(?:\.\d+)?)\)/)
  if (m) return parseFloat(m[1]) * objOpacity
  return objOpacity
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Generate a print-ready PDF from a Fabric.js canvas JSON.
 * Handles: text (Textbox / IText), Image, Rect, Circle, Line, Group.
 */
export async function generatePDF(
  canvasData: CanvasJSON | CanvasJSON[],
  printSpecs: PrintSpecs,
  options: GenerateOptions = {}
): Promise<Uint8Array> {
  const { print_width_mm, print_height_mm, bleed_mm } = printSpecs
  const { isProof = false, includeBleed = true } = options

  const bleedMM = includeBleed ? bleed_mm : 0
  const pageW_pt = (print_width_mm + bleedMM * 2) * MM_TO_POINTS
  const pageH_pt = (print_height_mm + bleedMM * 2) * MM_TO_POINTS
  const bleedOffset_pt = bleedMM * MM_TO_POINTS

  const pdfDoc = await PDFDocument.create()
  const pages = Array.isArray(canvasData) ? canvasData : [canvasData]

  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
  }

  for (const canvasJSON of pages) {
    const page = pdfDoc.addPage([pageW_pt, pageH_pt])

    // ─── Find or calculate artboard ──────────────────────────────────────────
  let artboard = canvasJSON.objects?.find(o => o.isArtboard) as CanvasObject & { originX?: string, originY?: string } | undefined
  
  let artW: number
  let artH: number
  let artL: number
  let artT: number

  if (artboard) {
    artW = (artboard.width ?? 800) * (artboard.scaleX ?? 1)
    artH = (artboard.height ?? 600) * (artboard.scaleY ?? 1)
    artL = artboard.left ?? 0
    artT = artboard.top ?? 0

    if (artboard.originX === 'center') artL -= artW / 2
    else if (artboard.originX === 'right') artL -= artW

    if (artboard.originY === 'center') artT -= artH / 2
    else if (artboard.originY === 'bottom') artT -= artH
  } else {
    // FALLBACK: Calculate bounding box of all visible objects
    const visibleObjects = (canvasJSON.objects || []).filter(o => o.visible !== false && !o.isGuide)
    if (visibleObjects.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      
      visibleObjects.forEach(obj => {
        const sx = obj.scaleX ?? 1
        const sy = obj.scaleY ?? 1
        const w = (obj.width ?? 0) * sx
        const h = (obj.height ?? 0) * sy
        let l = obj.left ?? 0
        let t = obj.top ?? 0
        
        // Account for object origins
        if (obj.originX === 'center') l -= w / 2
        else if (obj.originX === 'right') l -= w
        if (obj.originY === 'center') t -= h / 2
        else if (obj.originY === 'bottom') t -= h

        minX = Math.min(minX, l)
        minY = Math.min(minY, t)
        maxX = Math.max(maxX, l + w)
        maxY = Math.max(maxY, t + h)
      })

      artL = minX
      artT = minY
      artW = maxX - minX
      artH = maxY - minY
      
      // If the resulting box is centered at 0,0, expand it symmetrically to prevent clipping
      if (Math.abs(minX + maxX) < 1 && Math.abs(minY + maxY) < 1) {
        const halfW = Math.max(Math.abs(minX), Math.abs(maxX))
        const halfH = Math.max(Math.abs(minY), Math.abs(maxY))
        artL = -halfW
        artT = -halfH
        artW = halfW * 2
        artH = halfH * 2
      }
    } else {
      artW = canvasJSON.width ?? 800
      artH = canvasJSON.height ?? 600
      artL = 0
      artT = 0
    }
  }

    const scaleX = (print_width_mm * MM_TO_POINTS) / artW
    const scaleY = (print_height_mm * MM_TO_POINTS) / artH

    // Background fill
    const bg = artboard?.fill || canvasJSON.background
    if (bg && bg !== 'transparent') {
      const [r, g, b] = parseColor(bg as string)
      page.drawRectangle({ x: 0, y: 0, width: pageW_pt, height: pageH_pt, color: rgb(r, g, b) })
    }

    for (const obj of canvasJSON.objects ?? []) {
      if (obj.visible === false || obj.isGuide || obj.isArtboard) continue
      
      // Make coordinates relative to artboard
      const relativeObj = {
        ...obj,
        left: (obj.left ?? 0) - artL,
        top: (obj.top ?? 0) - artT
      }
      
      await renderObject(relativeObj, pdfDoc, page, scaleX, scaleY, bleedOffset_pt, pageH_pt, fonts)
    }

    // Proof watermark
    if (isProof) {
      const wFont = fonts.bold
      const label = 'PROOF – NOT FOR PRODUCTION'
      const wSize = pageW_pt * 0.06
      const wWidth = wFont.widthOfTextAtSize(label, wSize)
      page.drawText(label, {
        x: (pageW_pt - wWidth) / 2,
        y: pageH_pt / 2,
        size: wSize,
        font: wFont,
        color: rgb(0.9, 0, 0),
        opacity: 0.35,
        rotate: degrees(45),
      })
    }
  }

  return pdfDoc.save()
}

// ─── Object renderer ─────────────────────────────────────────────────────────

async function renderObject(
  obj: CanvasObject & { originX?: string, originY?: string },
  pdfDoc: PDFDocument,
  page: ReturnType<PDFDocument['addPage']>,
  scaleX: number,
  scaleY: number,
  bleedOffset: number,
  pageH: number,
  fonts: Record<string, Awaited<ReturnType<PDFDocument['embedFont']>>>
) {
  const sx = (obj.scaleX ?? 1) * scaleX
  const sy = (obj.scaleY ?? 1) * scaleY
  
  // Fabric.js logic for origins:
  // If originX is 'center', left is the middle. If 'left', it's the edge.
  const objW = (obj.width ?? 0) * sx
  const objH = (obj.height ?? 0) * sy
  
  let left = obj.left ?? 0
  let top = obj.top ?? 0

  if (obj.originX === 'center') left -= (obj.width ?? 0) * (obj.scaleX ?? 1) / 2
  else if (obj.originX === 'right') left -= (obj.width ?? 0) * (obj.scaleX ?? 1)

  if (obj.originY === 'center') top -= (obj.height ?? 0) * (obj.scaleY ?? 1) / 2
  else if (obj.originY === 'bottom') top -= (obj.height ?? 0) * (obj.scaleY ?? 1)

  const opacity = obj.opacity ?? 1
  const type = (obj.type ?? '').toLowerCase()
  // PDF y=0 is bottom; fabric y=0 is top → flip
  const pdfX = left * scaleX + bleedOffset
  const pdfY = pageH - (top * scaleY + objH + bleedOffset)
  const rot = obj.angle ? degrees(-obj.angle) : undefined

  if (type === 'group') {
    for (const child of obj.objects ?? []) {
      await renderObject(
        { ...child, left: left + (child.left ?? 0), top: top + (child.top ?? 0) },
        pdfDoc, page, scaleX, scaleY, bleedOffset, pageH, fonts
      )
    }
    return
  }

  if (type === 'textbox' || type === 'itext' || type === 'text') {
    const text = obj.text ?? ''
    if (!text.trim()) return

    // ── Per-placeholder VDP settings ──────────────────────────────────────
    const overflowBehavior = (obj.overflowBehavior ?? 'truncate') as 'truncate' | 'shrink' | 'stretch'
    // multiline defaults true for textbox, false for itext/text
    const isMultiline = obj.multiline !== undefined
      ? obj.multiline
      : (type === 'textbox')
    const alignment = (obj.textAlign ?? 'left') as 'left' | 'center' | 'right'

    // Font size: scaled canvas→PDF, clamped by maxFontSize if set
    const baseFontSize = (obj.fontSize ?? 16) * sy
    const minFontSizePt = (obj.minFontSize ?? 4) * sy
    const maxFontSizePt = obj.maxFontSize ? obj.maxFontSize * sy : baseFontSize
    const cappedFontSize = Math.min(baseFontSize, maxFontSizePt)

    const isBold = obj.fontWeight === 'bold' || String(obj.fontWeight) === '700' || obj.fontWeight === 700
    const isItalic = obj.fontStyle === 'italic' || obj.fontStyle === 'oblique'
    const font =
      isBold && isItalic ? fonts.boldItalic
      : isBold ? fonts.bold
      : isItalic ? fonts.italic
      : fonts.regular

    const fillColor = obj.fill as string | undefined
    const [r, g, b] = parseColor(fillColor)
    const colorOpacity = parseOpacity(fillColor, opacity)
    const lineHeightMult = obj.lineHeight ?? 1.16

    // ── Prepare raw lines (respect multiline flag) ─────────────────────────
    const rawLines = isMultiline
      ? text.split('\n')
      : [text.replace(/\n/g, ' ')]

    // ── Shrink-to-fit: find final font size ────────────────────────────────
    let finalFontSize = cappedFontSize
    if (overflowBehavior === 'shrink' && objW > 0) {
      finalFontSize = shrinkFontToFit(
        rawLines, font, cappedFontSize, minFontSizePt,
        objW, objH, lineHeightMult, isMultiline
      )
    }

    const lineHeightPt = finalFontSize * lineHeightMult

    // ── Build display lines (word-wrap for multiline non-stretch) ──────────
    let displayLines: string[]
    if (isMultiline && objW > 0 && overflowBehavior !== 'stretch') {
      displayLines = []
      for (const line of rawLines) {
        displayLines.push(...wrapTextToWidth(line, font, finalFontSize, objW))
      }
    } else {
      displayLines = rawLines
    }

    // ── Render each line ──────────────────────────────────────────────────
    displayLines.forEach((line, i) => {
      if (line === null || line === undefined) return

      let lineText = line

      // Apply overflow behavior per line
      if (overflowBehavior === 'truncate' && objW > 0) {
        lineText = truncateTextToWidth(line, font, finalFontSize, objW)
      }

      if (!lineText) return

      const lineY = pdfY + objH - finalFontSize - i * lineHeightPt

      // Clip lines that fall below the bounding box bottom
      if (objH > 0 && lineY < pdfY - finalFontSize) return

      // Compute alignment X offset
      const lineW = font.widthOfTextAtSize(lineText, finalFontSize)
      let lineX = pdfX
      if (objW > 0) {
        if (alignment === 'center') {
          lineX = pdfX + (objW - lineW) / 2
        } else if (alignment === 'right') {
          lineX = pdfX + objW - lineW
        }
      }

      if (overflowBehavior === 'stretch' && objW > 0 && lineText.length > 1) {
        drawStretchedText(page, lineText, font, finalFontSize, lineX, lineY,
          objW, rgb(r, g, b), colorOpacity, rot)
      } else {
        page.drawText(lineText, {
          x: lineX,
          y: lineY,
          size: finalFontSize,
          font,
          color: rgb(r, g, b),
          opacity: colorOpacity,
          ...(rot ? { rotate: rot } : {}),
        })
      }
    })
    return
  }

  if (type === 'rect') {
    const [fr, fg, fb] = parseColor(obj.fill as string)
    const [sr, sg, sb] = parseColor(obj.stroke as string)
    const hasFill = !!obj.fill && obj.fill !== 'transparent'
    const hasStroke = !!obj.stroke && obj.stroke !== 'transparent'
    page.drawRectangle({
      x: pdfX, y: pdfY, width: objW, height: objH,
      color: hasFill ? rgb(fr, fg, fb) : undefined,
      borderWidth: hasStroke ? (obj.strokeWidth ?? 1) * Math.min(scaleX, scaleY) : 0,
      borderColor: hasStroke ? rgb(sr, sg, sb) : undefined,
      opacity,
      ...(rot ? { rotate: rot } : {}),
    })
    return
  }

  if (type === 'circle') {
    const radius = (obj.radius ?? 50) * Math.min(sx, sy)
    const [fr, fg, fb] = parseColor(obj.fill as string)
    const [sr, sg, sb] = parseColor(obj.stroke as string)
    const hasFill = !!obj.fill && obj.fill !== 'transparent'
    const hasStroke = !!obj.stroke && obj.stroke !== 'transparent'
    page.drawEllipse({
      x: pdfX + radius, y: pdfY + radius,
      xScale: radius, yScale: radius,
      color: hasFill ? rgb(fr, fg, fb) : undefined,
      borderWidth: hasStroke ? (obj.strokeWidth ?? 1) * Math.min(scaleX, scaleY) : 0,
      borderColor: hasStroke ? rgb(sr, sg, sb) : undefined,
      opacity,
    })
    return
  }

  if (type === 'line') {
    const [sr, sg, sb] = parseColor(obj.stroke as string)
    if (obj.stroke && obj.stroke !== 'transparent') {
      page.drawLine({
        start: { x: pdfX, y: pdfY + objH },
        end: { x: pdfX + objW, y: pdfY },
        thickness: (obj.strokeWidth ?? 1) * Math.min(scaleX, scaleY),
        color: rgb(sr, sg, sb),
        opacity,
      })
    }
    return
  }

  if (type === 'image') {
    const src = obj.src
    if (!src) return
    try {
      let imageData: ArrayBuffer
      if (src.startsWith('data:')) {
        const b64 = src.split(',')[1]
        imageData = Buffer.from(b64, 'base64').buffer as ArrayBuffer
      } else {
        const res = await fetch(src)
        if (!res.ok) return
        imageData = await res.arrayBuffer()
      }

      const isPng = src.startsWith('data:image/png') || /\.png(\?|$)/i.test(src)
      let img
      try {
        img = isPng ? await pdfDoc.embedPng(imageData) : await pdfDoc.embedJpg(imageData)
      } catch {
        try {
          img = isPng ? await pdfDoc.embedJpg(imageData) : await pdfDoc.embedPng(imageData)
        } catch {
          return
        }
      }

      page.drawImage(img, {
        x: pdfX, y: pdfY, width: objW, height: objH,
        opacity,
        ...(rot ? { rotate: rot } : {}),
      })
    } catch (err) {
      console.error('[PDF] Image embed error:', err)
    }
  }
}

// ─── Variable data merge ──────────────────────────────────────────────────────

const PLACEHOLDER_RE = /\{\{([^}]+)\}\}/g

/**
 * Deep-clone a canvas JSON and replace {{placeholder}} patterns in all
 * text objects with values from `variables`.
 *
 * - Placeholder keys must match `variables` keys exactly (case-sensitive).
 * - Missing keys fall back to empty string — no crash, no leftover {{…}}.
 * - Pass `warnOnMissing: true` to emit console warnings for unresolved keys
 *   (useful during server-side batch processing for debugging).
 *
 * @param canvasJSON      Original Fabric.js canvas JSON
 * @param variables       Map of placeholder key → replacement value
 * @param options.warnOnMissing  Log a warning for each unresolved placeholder
 */
export function mergeVariables(
  canvasJSON: CanvasJSON,
  variables: Record<string, string>,
  options?: { warnOnMissing?: boolean }
): CanvasJSON {
  const json = JSON.parse(JSON.stringify(canvasJSON)) as CanvasJSON
  const warn = options?.warnOnMissing ?? false

  function processObject(obj: CanvasObject) {
    // rawText is the original template source; text is the live (possibly
    // already-merged) value. Always derive from rawText when present so that
    // re-merging a canvas works correctly.
    const sourceText = obj.rawText || obj.text

    if (sourceText) {
      if (warn) {
        // Collect all placeholder keys used in this object
        for (const [, key] of sourceText.matchAll(new RegExp(PLACEHOLDER_RE.source, 'g'))) {
          if (!(key in variables)) {
            console.warn(
              `[VDP] Unresolved placeholder "{{${key}}}" — no matching CSV column. Replacing with empty string.`
            )
          }
        }
      }

      let t = sourceText
      // Replace known variables
      for (const [key, val] of Object.entries(variables)) {
        t = t.replaceAll(`{{${key}}}`, val ?? '')
      }
      // Clear any remaining unmatched {{…}} so they don't appear in output
      t = t.replace(PLACEHOLDER_RE, '')
      obj.text = t
    }

    if (obj.objects) obj.objects.forEach(processObject)
  }

  json.objects?.forEach(processObject)
  return json
}
