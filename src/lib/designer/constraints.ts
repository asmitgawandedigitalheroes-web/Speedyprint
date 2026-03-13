import type { CanvasZones } from './canvas-utils'
import { isZoneGuide } from './canvas-utils'

const SNAP_THRESHOLD = 5 // pixels

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
 * Creates temporary lines that should be removed after object:modified.
 */
export function drawAlignmentGuides(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any,
  snappedLines: SnapLine[]
): void {
  // Remove existing guides
  clearAlignmentGuides(canvas)

  snappedLines.forEach((line) => {
    const coords =
      line.orientation === 'vertical'
        ? [line.position, 0, line.position, canvas.getHeight()]
        : [0, line.position, canvas.getWidth(), line.position]

    const guideLine = new fabric.Line(coords, {
      stroke: '#3b82f6',
      strokeWidth: 1,
      strokeDashArray: [4, 4],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      name: '__alignment_guide',
    })

    canvas.add(guideLine)
  })

  canvas.renderAll()
}

/**
 * Remove all alignment guide lines from the canvas.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function clearAlignmentGuides(canvas: any): void {
  const guides = canvas
    .getObjects()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((obj: any) => obj.name === '__alignment_guide')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  guides.forEach((guide: any) => canvas.remove(guide))
}

/**
 * Enforce constraints on the active object:
 * 1. Prevent objects from going outside the safe zone.
 * 2. Snap objects that are close to edges or center lines.
 * 3. Show alignment guides when snapping.
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
  event?: { target?: any }
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

  // --- Clamp within safe zone (prevent going outside) ---
  const clampedLeft = Math.max(
    safePx.left + offsetLeft,
    Math.min(newLeft, safePx.left + safePx.width - objWidth + offsetLeft)
  )
  const clampedTop = Math.max(
    safePx.top + offsetTop,
    Math.min(newTop, safePx.top + safePx.height - objHeight + offsetTop)
  )

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

  const { safePx } = zones
  const bound = obj.getBoundingRect()

  // If the scaled object exceeds the safe zone, limit the scale
  if (bound.width > safePx.width) {
    const maxScaleX = (safePx.width / (obj.width * (obj.scaleX || 1))) * (obj.scaleX || 1)
    obj.set({ scaleX: maxScaleX })
  }

  if (bound.height > safePx.height) {
    const maxScaleY = (safePx.height / (obj.height * (obj.scaleY || 1))) * (obj.scaleY || 1)
    obj.set({ scaleY: maxScaleY })
  }

  obj.setCoords()
}
