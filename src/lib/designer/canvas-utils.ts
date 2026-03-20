import type { ProductTemplate } from '@/types'

// --- Unit Conversion ---

const SCREEN_DPI = 96
const PRINT_DPI = 300

/**
 * Convert millimeters to pixels at a given DPI.
 */
export function mmToPixels(mm: number, dpi: number = PRINT_DPI): number {
  return (mm / 25.4) * dpi
}

/**
 * Convert pixels to millimeters at a given DPI.
 */
export function pixelsToMm(px: number, dpi: number = PRINT_DPI): number {
  return (px / dpi) * 25.4
}

/**
 * Scale factor from print resolution to screen display resolution.
 * Objects are stored in print-DPI coordinates but rendered at screen DPI.
 */
export function getDisplayScale(printDpi: number = PRINT_DPI): number {
  return SCREEN_DPI / printDpi
}

// --- Zone Guide Names (used to filter from serialization) ---

export const ZONE_GUIDE_NAMES = [
  '__bleed_zone',
  '__trim_zone',
  '__safe_zone',
] as const

export type ZoneGuideName = (typeof ZONE_GUIDE_NAMES)[number]

/**
 * All internal (non-user) object names used by the designer.
 */
export const INTERNAL_OBJECT_NAMES = [
  '__bleed_zone',
  '__trim_zone',
  '__safe_zone',
  '__print_bg',
  '__artboard_handle',
  '__alignment_guide',
  '__grid_line',
  '__watermark',
  '__locked_zone',
] as const

/**
 * Check whether a Fabric object is one of the non-selectable zone guides.
 */
export function isZoneGuide(obj: { name?: string }): boolean {
  return ZONE_GUIDE_NAMES.includes(obj.name as ZoneGuideName)
}

/**
 * Check whether a Fabric object is any internal (non-user) object.
 */
export function isInternalObject(obj: { name?: string }): boolean {
  return INTERNAL_OBJECT_NAMES.includes(obj.name as (typeof INTERNAL_OBJECT_NAMES)[number])
}

/**
 * Get the center of the safe zone by reading the actual __safe_zone fabric object.
 * Falls back to zones data if the object is not found.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSafeZoneCenter(canvas: any, zones: CanvasZones | null): { x: number; y: number } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeRect = canvas.getObjects().find((obj: any) => obj.name === '__safe_zone')
  if (safeRect) {
    return {
      x: (safeRect.left as number) + (safeRect.width as number) / 2,
      y: (safeRect.top as number) + (safeRect.height as number) / 2,
    }
  }
  if (zones) {
    return {
      x: zones.safePx.left + zones.safePx.width / 2,
      y: zones.safePx.top + zones.safePx.height / 2,
    }
  }
  return { x: 200, y: 200 }
}

// --- Zone Rectangle Creation ---

export interface ZoneRectOptions {
  left: number
  top: number
  width: number
  height: number
  stroke: string
  strokeDashArray?: number[]
  name: ZoneGuideName
}

/**
 * Create a non-selectable zone rectangle on the canvas.
 * Requires the `fabric` namespace to be passed in (because fabric is only
 * available client-side via dynamic import).
 */
export function createZoneRect(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any,
  options: ZoneRectOptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return new fabric.Rect({
    left: options.left,
    top: options.top,
    width: options.width,
    height: options.height,
    fill: 'transparent',
    stroke: options.stroke,
    strokeWidth: 1,
    strokeDashArray: options.strokeDashArray,
    selectable: false,
    evented: false,
    excludeFromExport: true,
    name: options.name,
    hoverCursor: 'default',
  })
}

// --- Canvas Initialization ---

export interface CanvasZones {
  bleedPx: { left: number; top: number; width: number; height: number }
  trimPx: { left: number; top: number; width: number; height: number }
  safePx: { left: number; top: number; width: number; height: number }
}

/**
 * Compute zone rectangles in display pixels from a ProductTemplate.
 */
export function computeZones(template: ProductTemplate): CanvasZones {
  const dpi = template.dpi || PRINT_DPI
  const scale = getDisplayScale(dpi)

  const printW = mmToPixels(template.print_width_mm, dpi)
  const printH = mmToPixels(template.print_height_mm, dpi)
  const bleedPx = mmToPixels(template.bleed_mm, dpi)
  const safePx = mmToPixels(template.safe_zone_mm, dpi)

  // Display dimensions (scaled for screen)
  const totalW = (printW + bleedPx * 2) * scale
  const totalH = (printH + bleedPx * 2) * scale
  const bleedDisplay = bleedPx * scale
  const safeDisplay = safePx * scale
  const trimW = printW * scale
  const trimH = printH * scale

  return {
    bleedPx: { left: 0, top: 0, width: totalW, height: totalH },
    trimPx: { left: bleedDisplay, top: bleedDisplay, width: trimW, height: trimH },
    safePx: {
      left: bleedDisplay + safeDisplay,
      top: bleedDisplay + safeDisplay,
      width: trimW - safeDisplay * 2,
      height: trimH - safeDisplay * 2,
    },
  }
}

/**
 * Initialize the canvas with template zones (bleed, trim, safe).
 * Returns the computed zones for later constraint enforcement.
 */
export function initializeCanvas(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any,
  template: ProductTemplate
): CanvasZones {
  const zones = computeZones(template)

  // Set canvas dimensions to the bleed area (Fabric v7 API)
  canvas.setDimensions({ width: zones.bleedPx.width, height: zones.bleedPx.height })

  // White background for the entire canvas
  canvas.backgroundColor = '#f0f0f0'

  // Bleed area (red dashed)
  const bleedRect = createZoneRect(fabric, {
    left: zones.bleedPx.left,
    top: zones.bleedPx.top,
    width: zones.bleedPx.width,
    height: zones.bleedPx.height,
    stroke: '#ef4444',
    strokeDashArray: [8, 4],
    name: '__bleed_zone',
  })

  // White fill for the print area
  const printBg = new fabric.Rect({
    left: zones.trimPx.left,
    top: zones.trimPx.top,
    width: zones.trimPx.width,
    height: zones.trimPx.height,
    fill: '#ffffff',
    stroke: 'transparent',
    selectable: false,
    evented: false,
    excludeFromExport: true,
    name: '__print_bg',
  })

  // Trim line (solid black)
  const trimRect = createZoneRect(fabric, {
    left: zones.trimPx.left,
    top: zones.trimPx.top,
    width: zones.trimPx.width,
    height: zones.trimPx.height,
    stroke: '#000000',
    name: '__trim_zone',
  })

  // Safe zone (green dashed)
  const safeRect = createZoneRect(fabric, {
    left: zones.safePx.left,
    top: zones.safePx.top,
    width: zones.safePx.width,
    height: zones.safePx.height,
    stroke: '#22c55e',
    strokeDashArray: [6, 3],
    name: '__safe_zone',
  })

  canvas.add(printBg)
  canvas.add(bleedRect)
  canvas.add(trimRect)
  canvas.add(safeRect)

  // Ensure zone guides stay at the bottom
  canvas.sendObjectToBack(printBg)

  return zones
}

// --- Serialization ---

/**
 * Serialize canvas state, excluding zone guide rectangles.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCanvasJSON(canvas: any): Record<string, unknown> {
  const json = canvas.toJSON(['name', 'excludeFromExport']) as Record<string, unknown>
  // Filter out zone guide objects
  if (json.objects && Array.isArray(json.objects)) {
    json.objects = (json.objects as Array<{ name?: string }>).filter(
      (obj) => !isZoneGuide(obj) && obj.name !== '__print_bg'
    )
  }
  return json
}

/**
 * Load canvas state from JSON, preserving existing zone guides.
 * Fabric.js v7 uses Promise-based loadFromJSON (no callback parameter).
 */
export async function loadCanvasJSON(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any,
  json: Record<string, unknown>,
  callback?: () => void
): Promise<void> {
  // Store existing zone guides before loading
  const guides = canvas
    .getObjects()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((obj: any) => isZoneGuide(obj) || obj.name === '__print_bg')

  // Fabric.js v7: loadFromJSON returns a Promise (no callback)
  await canvas.loadFromJSON(json)

  // Re-add zone guides at the bottom
  guides.forEach((guide: unknown) => {
    canvas.add(guide)
    canvas.sendObjectToBack(guide)
  })

  canvas.renderAll()
  callback?.()
}

// --- Hide / Show Zone Guides for Export ---

/**
 * Hide all zone guide objects and the artboard handle so they don't appear
 * in toDataURL() renders (preview, export, thumbnail).
 * Returns the list of hidden objects so they can be restored.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hideZoneGuides(canvas: any): any[] {
  const hidden: unknown[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas.getObjects().forEach((obj: any) => {
    if (
      isZoneGuide(obj) ||
      obj.name === '__print_bg' ||
      obj.name === '__artboard_handle' ||
      obj.name === '__alignment_guide'
    ) {
      if (obj.visible !== false) {
        obj.set({ visible: false })
        hidden.push(obj)
      }
    }
  })
  canvas.renderAll()
  return hidden
}

/**
 * Restore previously hidden zone guide objects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function showZoneGuides(hidden: any[]): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hidden.forEach((obj: any) => obj.set({ visible: true }))
}

// --- Thumbnail Generation ---

/**
 * Generate a thumbnail data URL from the canvas.
 * Hides zone guides before rendering and restores them after.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateThumbnail(canvas: any, maxSize: number = 400): string {
  const width = canvas.width
  const height = canvas.height
  const scale = Math.min(maxSize / width, maxSize / height, 1)

  // Hide zone guides so they don't appear in the thumbnail
  const hidden = hideZoneGuides(canvas)

  const dataUrl = canvas.toDataURL({
    format: 'png',
    quality: 0.8,
    multiplier: scale,
  })

  // Restore zone guides
  showZoneGuides(hidden)
  canvas.renderAll()

  return dataUrl
}
