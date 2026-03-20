/**
 * Server-side PNG rasteriser — Feature 4.6
 *
 * Renders a Fabric.js canvas JSON to a high-resolution PNG using
 * @napi-rs/canvas (Node.js native canvas, no browser required).
 *
 * Resolution: dpi * (print_mm / 25.4) pixels per axis.
 * Bleed is included when includeBleed=true (same convention as generatePDF).
 */

import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import type { PrintSpecs } from './generator'

// ── Types (mirrors generator.ts) ─────────────────────────────────────────────

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
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string | number
  fontStyle?: string
  textAlign?: string
  lineHeight?: number
  src?: string
  radius?: number
  objects?: CanvasObject[]
}

interface CanvasJSON {
  objects?: CanvasObject[]
  width?: number
  height?: number
  background?: string
}

export interface GeneratePNGOptions {
  isProof?: boolean
  includeBleed?: boolean
  dpi?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Converts any CSS-ish color string to a form ctx.fillStyle accepts. */
function toCssColor(color: string | undefined | null, opacity = 1): string {
  if (!color || color === 'transparent') return `rgba(0,0,0,0)`
  if (opacity < 1) {
    // Inject alpha into hex or rgb
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
      const r = parseInt(full.slice(0, 2), 16)
      const g = parseInt(full.slice(2, 4), 16)
      const b = parseInt(full.slice(4, 6), 16)
      return `rgba(${r},${g},${b},${opacity})`
    }
    const m = color.match(/rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)/)
    if (m) return `rgba(${m[1]},${m[2]},${m[3]},${opacity})`
  }
  return color
}

/** Extracts alpha from rgba(...) colors, combined with object-level opacity. */
function effectiveOpacity(color: string | undefined | null, objOpacity: number): number {
  if (!color) return objOpacity
  const m = color.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*(\d+(?:\.\d+)?)\)/)
  if (m) return parseFloat(m[1]) * objOpacity
  return objOpacity
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Rasterises a Fabric.js canvas JSON to a PNG Uint8Array.
 *
 * @param canvasJSON  Fabric.js canvas JSON (same format as generatePDF)
 * @param printSpecs  Physical dimensions + bleed
 * @param options     dpi (default 300), isProof, includeBleed
 */
export async function generatePNG(
  canvasJSON: CanvasJSON,
  printSpecs: PrintSpecs,
  options: GeneratePNGOptions = {}
): Promise<Uint8Array> {
  const { print_width_mm, print_height_mm, bleed_mm } = printSpecs
  const { isProof = false, includeBleed = true, dpi = 300 } = options

  const pxPerMm = dpi / 25.4
  const bleedMm = includeBleed ? bleed_mm : 0
  const canvasW = Math.round((print_width_mm + bleedMm * 2) * pxPerMm)
  const canvasH = Math.round((print_height_mm + bleedMm * 2) * pxPerMm)
  const bleedPx = bleedMm * pxPerMm

  const srcW = canvasJSON.width ?? 800
  const srcH = canvasJSON.height ?? 600
  const scaleX = (print_width_mm * pxPerMm) / srcW
  const scaleY = (print_height_mm * pxPerMm) / srcH

  const canvas = createCanvas(canvasW, canvasH)
  const ctx = canvas.getContext('2d')

  // Background
  if (canvasJSON.background && canvasJSON.background !== 'transparent') {
    ctx.fillStyle = canvasJSON.background
    ctx.fillRect(0, 0, canvasW, canvasH)
  } else {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasW, canvasH)
  }

  for (const obj of canvasJSON.objects ?? []) {
    if (obj.visible === false) continue
    await renderObject(obj, ctx, scaleX, scaleY, bleedPx)
  }

  // Proof watermark
  if (isProof) {
    const label = 'PROOF – NOT FOR PRODUCTION'
    const fontSize = Math.round(canvasW * 0.06)
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.fillStyle = '#e60000'
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.translate(canvasW / 2, canvasH / 2)
    ctx.rotate(Math.PI / 4)
    const tw = ctx.measureText(label).width
    ctx.fillText(label, -tw / 2, 0)
    ctx.restore()
  }

  const buffer = await canvas.encode('png')
  return new Uint8Array(buffer)
}

// ── Object renderer ───────────────────────────────────────────────────────────

async function renderObject(
  obj: CanvasObject,
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  scaleX: number,
  scaleY: number,
  bleedPx: number
) {
  const sx = (obj.scaleX ?? 1) * scaleX
  const sy = (obj.scaleY ?? 1) * scaleY
  const left = (obj.left ?? 0) * scaleX + bleedPx
  const top = (obj.top ?? 0) * scaleY + bleedPx
  const objW = (obj.width ?? 0) * sx
  const objH = (obj.height ?? 0) * sy
  const opacity = obj.opacity ?? 1
  const type = (obj.type ?? '').toLowerCase()
  const angle = ((obj.angle ?? 0) * Math.PI) / 180

  ctx.save()
  ctx.globalAlpha = opacity

  if (angle !== 0) {
    ctx.translate(left + objW / 2, top + objH / 2)
    ctx.rotate(angle)
    ctx.translate(-(left + objW / 2), -(top + objH / 2))
  }

  if (type === 'group') {
    ctx.restore()
    for (const child of obj.objects ?? []) {
      await renderObject(
        { ...child, left: (obj.left ?? 0) + (child.left ?? 0), top: (obj.top ?? 0) + (child.top ?? 0) },
        ctx, scaleX, scaleY, bleedPx
      )
    }
    return
  }

  if (type === 'rect') {
    if (obj.fill && obj.fill !== 'transparent') {
      ctx.fillStyle = toCssColor(obj.fill, effectiveOpacity(obj.fill, 1))
      ctx.fillRect(left, top, objW, objH)
    }
    if (obj.stroke && obj.stroke !== 'transparent') {
      ctx.strokeStyle = toCssColor(obj.stroke)
      ctx.lineWidth = (obj.strokeWidth ?? 1) * Math.min(scaleX, scaleY)
      ctx.strokeRect(left, top, objW, objH)
    }
  } else if (type === 'circle') {
    const radius = (obj.radius ?? 50) * Math.min(sx, sy)
    ctx.beginPath()
    ctx.arc(left + radius, top + radius, radius, 0, Math.PI * 2)
    if (obj.fill && obj.fill !== 'transparent') {
      ctx.fillStyle = toCssColor(obj.fill, effectiveOpacity(obj.fill, 1))
      ctx.fill()
    }
    if (obj.stroke && obj.stroke !== 'transparent') {
      ctx.strokeStyle = toCssColor(obj.stroke)
      ctx.lineWidth = (obj.strokeWidth ?? 1) * Math.min(scaleX, scaleY)
      ctx.stroke()
    }
  } else if (type === 'line') {
    if (obj.stroke && obj.stroke !== 'transparent') {
      ctx.strokeStyle = toCssColor(obj.stroke)
      ctx.lineWidth = (obj.strokeWidth ?? 1) * Math.min(scaleX, scaleY)
      ctx.beginPath()
      ctx.moveTo(left, top + objH)
      ctx.lineTo(left + objW, top)
      ctx.stroke()
    }
  } else if (type === 'textbox' || type === 'itext' || type === 'text') {
    const text = obj.text ?? ''
    if (!text.trim()) {
      ctx.restore()
      return
    }

    const fontSize = Math.round((obj.fontSize ?? 16) * sy)
    const isBold = obj.fontWeight === 'bold' || String(obj.fontWeight) === '700' || obj.fontWeight === 700
    const isItalic = obj.fontStyle === 'italic' || obj.fontStyle === 'oblique'
    const family = obj.fontFamily ?? 'sans-serif'
    const fontStr = [
      isItalic ? 'italic' : '',
      isBold ? 'bold' : '',
      `${fontSize}px`,
      `"${family}", sans-serif`,
    ]
      .filter(Boolean)
      .join(' ')

    ctx.font = fontStr
    ctx.fillStyle = toCssColor(obj.fill as string, effectiveOpacity(obj.fill as string, 1))
    ctx.textBaseline = 'top'
    ctx.textAlign = (obj.textAlign as CanvasTextAlign) ?? 'left'

    const lineHeightPx = fontSize * (obj.lineHeight ?? 1.16)
    const lines = text.split('\n')
    const xPos = obj.textAlign === 'center' ? left + objW / 2
      : obj.textAlign === 'right' ? left + objW
      : left

    lines.forEach((line, i) => {
      if (!line) return
      ctx.fillText(line, xPos, top + i * lineHeightPx, objW > 0 ? objW : undefined)
    })
  } else if (type === 'image') {
    const src = obj.src
    if (!src) {
      ctx.restore()
      return
    }
    try {
      let imgSrc: string | Buffer
      if (src.startsWith('data:')) {
        const b64 = src.split(',')[1]
        imgSrc = Buffer.from(b64, 'base64')
      } else {
        const res = await fetch(src)
        if (!res.ok) {
          ctx.restore()
          return
        }
        imgSrc = Buffer.from(await res.arrayBuffer())
      }
      const img = await loadImage(imgSrc)
      ctx.drawImage(img, left, top, objW, objH)
    } catch (err) {
      console.error('[PNG] Image load error:', err)
    }
  }

  ctx.restore()
}
