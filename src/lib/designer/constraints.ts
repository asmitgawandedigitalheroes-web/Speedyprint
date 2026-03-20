import type { CanvasZones } from './canvas-utils'
import { isZoneGuide } from './canvas-utils'

/**
 * A locked rectangular zone in canvas-pixel coordinates.
 * Objects cannot be placed overlapping these areas.
 */
export interface LockedZonePx {
  left: number
  top: number
  width: number
  height: number
  label?: string
}

const SNAP_THRESHOLD = 5 // pixels

// ---------------------------------------------------------------------------
// Guide-line cache — pre-allocate Line objects per canvas so we never call
// canvas.add() / canvas.remove() during drag (those are expensive and cause
// the jitter / double-render effect the user sees).
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _guideCache = new Map<object, any[]>()
const MAX_GUIDE_LINES = 6 // matches the maximum output of getSnapLines()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _getOrCreateGuides(fabric: any, canvas: any): any[] {
  const cached = _guideCache.get(canvas)
  if (cached) return cached

  const lines: unknown[] = []
  for (let i = 0; i < MAX_GUIDE_LINES; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const line = new fabric.Line([0, 0, 0, 0], {
      stroke: '#3b82f6',
      strokeWidth: 1,
      strokeDashArray: [4, 4],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      name: '__alignment_guide',
      visible: false,
    })
    canvas.add(line)
    lines.push(line)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _guideCache.set(canvas, lines as any[])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return lines as any[]
}

interface SnapLine {
  orientation: 'horizontal' | 'vertical'
  position: number
}

/**
 * Calculate snap guides for horizontal and vertical center + edges of the safe zone.
 */
function getSnapLines(zones: CanvasZones): SnapLine[] {
  const { safePx } = zones
  const centerX = safePx.left + safePx.width / 2
  const centerY = safePx.top + safePx.height / 2

  return [
    // Safe zone edges
    { orientation: 'vertical', position: safePx.left },
    { orientation: 'vertical', position: safePx.left + safePx.width },
    { orientation: 'horizontal', position: safePx.top },
    { orientation: 'horizontal', position: safePx.top + safePx.height },
    // Center lines
    { orientation: 'vertical', position: centerX },
    { orientation: 'horizontal', position: centerY },
  ]
}

/**
 * Snap a value to the nearest snap line if within threshold.
 * Returns the snapped value or the original value if no snap.
 */
function snapToLine(
  value: number,
  lines: SnapLine[],
  orientation: 'horizontal' | 'vertical'
): { snapped: number; didSnap: boolean } {
  for (const line of lines) {
    if (line.orientation !== orientation) continue
    if (Math.abs(value - line.position) <= SNAP_THRESHOLD) {
      return { snapped: line.position, didSnap: true }
    }
  }
  return { snapped: value, didSnap: false }
}

/**
 * Draw alignment guide lines on the canvas when snapping.
 * Reuses pre-allocated Line objects — never adds/removes during drag.
 */
export function drawAlignmentGuides(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any,
  snappedLines: SnapLine[]
): void {
  const guides = _getOrCreateGuides(fabric, canvas)

  // Update coordinates and visibility — no canvas.add / canvas.remove
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  guides.forEach((guide: any, i: number) => {
    if (i < snappedLines.length) {
      const sl = snappedLines[i]
      if (sl.orientation === 'vertical') {
        guide.set({ x1: sl.position, y1: 0, x2: sl.position, y2: canvas.height, visible: true })
      } else {
        guide.set({ x1: 0, y1: sl.position, x2: canvas.width, y2: sl.position, visible: true })
      }
    } else {
      guide.set({ visible: false })
    }
  })

  canvas.requestRenderAll()
}

/**
 * Hide all alignment guide lines (does NOT remove them from the canvas).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function clearAlignmentGuides(canvas: any): void {
  const cached = _guideCache.get(canvas)
  if (cached) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cached.forEach((guide: any) => guide.set({ visible: false }))
    return
  }

  // Fallback for any legacy guides that might exist (e.g. from a previous session)
  canvas
    .getObjects()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((obj: any) => obj.name === '__alignment_guide')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .forEach((guide: any) => canvas.remove(guide))
}

/**
 * Eagerly pre-allocate guide lines for a canvas.
 * Call this once when the fabric module and canvas are ready so the first drag
 * never triggers canvas.add() mid-gesture.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initGuideLines(fabric: any, canvas: any): void {
  _getOrCreateGuides(fabric, canvas)
}

/**
 * Permanently remove pre-allocated guide lines and clear the cache.
 * Call this when the canvas / plugin is being destroyed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function destroyGuideLines(canvas: any): void {
  const cached = _guideCache.get(canvas)
  if (cached) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cached.forEach((guide: any) => canvas.remove(guide))
    _guideCache.delete(canvas)
  }
}

/**
 * Check whether two axis-aligned bounding rects overlap.
 */
function rectsOverlap(
  r1: { left: number; top: number; width: number; height: number },
  r2: { left: number; top: number; width: number; height: number }
): boolean {
  return !(
    r1.left + r1.width <= r2.left ||
    r2.left + r2.width <= r1.left ||
    r1.top + r1.height <= r2.top ||
    r2.top + r2.height <= r1.top
  )
}


/**
 * Enforce constraints on the active object:
 * 1. Prevent objects from going outside the bleed zone (hard boundary).
 * 2. Snap objects that are close to safe zone edges or center lines.
 * 3. Show alignment guides when snapping.
 * 4. Push objects out of template-defined locked zones.
 *
 * Should be called on `object:moving` and `object:modified` events.
 */
export function enforceConstraints(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any,
  zones: CanvasZones,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event?: { target?: any },
  lockedZones?: LockedZonePx[]
): void {
  const obj = event?.target || canvas.getActiveObject()
  if (!obj) return

  // Skip zone guide objects
  if (isZoneGuide(obj) || obj.name === '__print_bg' || obj.name === '__alignment_guide') {
    return
  }

  const { safePx } = zones
  const snapLines = getSnapLines(zones)
  const activeSnaps: SnapLine[] = []

  // Get object bounding rect
  const bound = obj.getBoundingRect()
  const objLeft = obj.left as number
  const objTop = obj.top as number
  const objWidth = bound.width
  const objHeight = bound.height

  // Compute the offset between obj.left/top and bounding rect left/top
  // (accounts for transformations, rotation, origin)
  const offsetLeft = objLeft - bound.left
  const offsetTop = objTop - bound.top

  let newLeft = objLeft
  let newTop = objTop

  // --- Snap to center (object center to zone center) ---
  const objCenterX = bound.left + objWidth / 2
  const objCenterY = bound.top + objHeight / 2

  const snapCenterX = snapToLine(objCenterX, snapLines, 'vertical')
  if (snapCenterX.didSnap) {
    newLeft = snapCenterX.snapped - objWidth / 2 + offsetLeft
    activeSnaps.push({ orientation: 'vertical', position: snapCenterX.snapped })
  }

  const snapCenterY = snapToLine(objCenterY, snapLines, 'horizontal')
  if (snapCenterY.didSnap) {
    newTop = snapCenterY.snapped - objHeight / 2 + offsetTop
    activeSnaps.push({ orientation: 'horizontal', position: snapCenterY.snapped })
  }

  // --- Snap edges to safe zone edges ---
  if (!snapCenterX.didSnap) {
    const snapLeft = snapToLine(bound.left, snapLines, 'vertical')
    if (snapLeft.didSnap) {
      newLeft = snapLeft.snapped + offsetLeft
      activeSnaps.push({ orientation: 'vertical', position: snapLeft.snapped })
    } else {
      const snapRight = snapToLine(bound.left + objWidth, snapLines, 'vertical')
      if (snapRight.didSnap) {
        newLeft = snapRight.snapped - objWidth + offsetLeft
        activeSnaps.push({ orientation: 'vertical', position: snapRight.snapped })
      }
    }
  }

  if (!snapCenterY.didSnap) {
    const snapTopEdge = snapToLine(bound.top, snapLines, 'horizontal')
    if (snapTopEdge.didSnap) {
      newTop = snapTopEdge.snapped + offsetTop
      activeSnaps.push({ orientation: 'horizontal', position: snapTopEdge.snapped })
    } else {
      const snapBottom = snapToLine(bound.top + objHeight, snapLines, 'horizontal')
      if (snapBottom.didSnap) {
        newTop = snapBottom.snapped - objHeight + offsetTop
        activeSnaps.push({ orientation: 'horizontal', position: snapBottom.snapped })
      }
    }
  }

  // --- Clamp within bleed zone (hard outer boundary — objects may extend into bleed but not beyond) ---
  const { bleedPx } = zones
  let clampedLeft = Math.max(
    bleedPx.left + offsetLeft,
    Math.min(newLeft, bleedPx.left + bleedPx.width - objWidth + offsetLeft)
  )
  let clampedTop = Math.max(
    bleedPx.top + offsetTop,
    Math.min(newTop, bleedPx.top + bleedPx.height - objHeight + offsetTop)
  )

  // --- Push out of locked zones ---
  if (lockedZones && lockedZones.length > 0) {
    for (const zone of lockedZones) {
      const currentBound = {
        left: clampedLeft - offsetLeft,
        top: clampedTop - offsetTop,
        width: objWidth,
        height: objHeight,
      }
      if (!rectsOverlap(currentBound, zone)) continue

      // Try all 4 exit directions — pick the one that, after bleed re-clamp,
      // no longer overlaps the zone (minimum displacement wins).
      const candidates: { left: number; top: number }[] = [
        { left: zone.left - objWidth + offsetLeft,       top: clampedTop },              // exit left
        { left: zone.left + zone.width + offsetLeft,     top: clampedTop },              // exit right
        { left: clampedLeft,                             top: zone.top - objHeight + offsetTop }, // exit up
        { left: clampedLeft,                             top: zone.top + zone.height + offsetTop }, // exit down
      ]

      let bestLeft = clampedLeft
      let bestTop = clampedTop
      let bestDist = Infinity

      for (const cand of candidates) {
        // Apply bleed clamp to the candidate
        const cl = Math.max(
          bleedPx.left + offsetLeft,
          Math.min(cand.left, bleedPx.left + bleedPx.width - objWidth + offsetLeft)
        )
        const ct = Math.max(
          bleedPx.top + offsetTop,
          Math.min(cand.top, bleedPx.top + bleedPx.height - objHeight + offsetTop)
        )
        // Accept only if the object no longer overlaps after the clamp
        const newBound = { left: cl - offsetLeft, top: ct - offsetTop, width: objWidth, height: objHeight }
        if (!rectsOverlap(newBound, zone)) {
          const dist = Math.abs(cl - clampedLeft) + Math.abs(ct - clampedTop)
          if (dist < bestDist) {
            bestDist = dist
            bestLeft = cl
            bestTop = ct
          }
        }
      }

      clampedLeft = bestLeft
      clampedTop = bestTop
    }
  }

  obj.set({ left: clampedLeft, top: clampedTop })
  obj.setCoords()

  // Draw alignment guides while moving
  if (activeSnaps.length > 0) {
    drawAlignmentGuides(fabric, canvas, activeSnaps)
  } else {
    clearAlignmentGuides(canvas)
  }
}

/**
 * Enforce scale constraints: prevent objects from being scaled
 * larger than the safe zone.
 */
export function enforceScaleConstraints(
  zones: CanvasZones,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event?: { target?: any }
): void {
  const obj = event?.target
  if (!obj) return

  if (isZoneGuide(obj) || obj.name === '__print_bg' || obj.name === '__alignment_guide') {
    return
  }

  const { bleedPx } = zones
  const bound = obj.getBoundingRect()

  // If the scaled object exceeds the bleed zone, limit the scale
  if (bound.width > bleedPx.width) {
    const maxScaleX = (bleedPx.width / (obj.width * (obj.scaleX || 1))) * (obj.scaleX || 1)
    obj.set({ scaleX: maxScaleX })
  }

  if (bound.height > bleedPx.height) {
    const maxScaleY = (bleedPx.height / (obj.height * (obj.scaleY || 1))) * (obj.scaleY || 1)
    obj.set({ scaleY: maxScaleY })
  }

  obj.setCoords()
}
