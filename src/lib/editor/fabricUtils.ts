import {
  Canvas as FabricCanvas,
  Textbox,
  FabricImage,
  Rect,
  Circle,
  Triangle,
  Line,
  Polygon,
  FabricObject,
  Pattern,
  Gradient,
  Group,
  loadSVGFromString,
  util,
} from 'fabric'
import { useEditorStore } from './useEditorStore'

/** Get artboard center coordinates for placing new objects */
export function getArtboardCenter(): { x: number; y: number } {
  const { canvas } = useEditorStore.getState()
  if (canvas) {
    const artboard = canvas.getObjects().find(
      (o) => (o as unknown as Record<string, unknown>).isArtboard
    )
    if (artboard) {
      const center = artboard.getCenterPoint()
      return { x: center.x, y: center.y }
    }
  }
  // Fallback if no canvas/artboard yet
  const { artboardWidth, artboardHeight } = useEditorStore.getState()
  return { x: artboardWidth / 2, y: artboardHeight / 2 }
}

/** Find the artboard rect on the canvas */
function findArtboard(canvas: FabricCanvas) {
  return canvas.getObjects().find((o) => (o as unknown as Record<string, unknown>).isArtboard)
}

/* ──────────────────────── Text ──────────────────────── */

export function addText(
  canvas: FabricCanvas,
  options?: { 
    text?: string; 
    fontSize?: number; 
    fill?: string; 
    fontFamily?: string; 
    fontWeight?: string;
    fontStyle?: string;
    stroke?: string;
    strokeWidth?: number;
  }
) {
  const { artboardWidth, artboardHeight } = useEditorStore.getState()
  const w = artboardWidth || 800
  const h = artboardHeight || 600
  const textWidth = w * 0.3
  // Clamp to artboard bounds — getArtboardCenter() can return (0,0) before artboard is placed
  const left = Math.max(0, Math.min((w - textWidth) / 2, w - textWidth))
  const top = Math.max(0, Math.min(h / 2 - 20, h - 40))
  const text = new Textbox(options?.text ?? 'Double-click to edit', {
    left,
    top,
    fontSize: options?.fontSize ?? 24,
    fill: options?.fill ?? '#333333',
    fontFamily: options?.fontFamily ?? 'Inter, sans-serif',
    fontWeight: options?.fontWeight as any ?? 'normal',
    fontStyle: options?.fontStyle as any ?? 'normal',
    stroke: options?.stroke ?? null,
    strokeWidth: options?.strokeWidth ?? 0,
    editable: true,
    originX: 'left',
    originY: 'top',
  })
  
  // Set width to fit the content initially, with a fallback
  const initialWidth = text.getLineWidth(0) || 200
  text.set('width', initialWidth + 2) // +2 for a tiny bit of breathing room

  canvas.add(text)
  canvas.setActiveObject(text)
  canvas.renderAll()
  return text
}

/* ──────────────────────── Image ──────────────────────── */

export async function addImage(canvas: FabricCanvas, file: File) {
  const center = getArtboardCenter()
  const { artboardWidth, artboardHeight } = useEditorStore.getState()

  return new Promise<FabricImage>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string
        const img = await FabricImage.fromURL(dataUrl)
        const maxW = artboardWidth * 0.6
        const maxH = artboardHeight * 0.6
        const scale = Math.min(
          maxW / (img.width ?? 1),
          maxH / (img.height ?? 1),
          1
        )
        img.set({
          left: center.x - ((img.width ?? 0) * scale) / 2,
          top: center.y - ((img.height ?? 0) * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          originX: 'left',
          originY: 'top',
        })
        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
        resolve(img)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Add an image from a URL (for clipart/stickers) */
export async function addImageFromURL(canvas: FabricCanvas, url: string, maxSize = 0.4) {
  const center = getArtboardCenter()
  const { artboardWidth, artboardHeight } = useEditorStore.getState()
  const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
  const maxW = artboardWidth * maxSize
  const maxH = artboardHeight * maxSize
  const scale = Math.min(maxW / (img.width ?? 1), maxH / (img.height ?? 1), 1)
  img.set({
    left: center.x - ((img.width ?? 0) * scale) / 2,
    top: center.y - ((img.height ?? 0) * scale) / 2,
    scaleX: scale,
    scaleY: scale,
    originX: 'left',
    originY: 'top',
  })
  canvas.add(img)
  canvas.setActiveObject(img)
  canvas.renderAll()
  return img
}

/** Add an SVG string as editable Fabric objects to canvas */
export async function addSVGToCanvas(canvas: FabricCanvas, svgString: string, maxSize = 0.35) {
  const { objects, options } = await loadSVGFromString(svgString)
  const validObjects = objects.filter((o): o is FabricObject => o !== null)
  if (validObjects.length === 0) return null

  const group = util.groupSVGElements(validObjects, options)
  const center = getArtboardCenter()
  const { artboardWidth, artboardHeight } = useEditorStore.getState()
  const maxW = artboardWidth * maxSize
  const maxH = artboardHeight * maxSize
  const scale = Math.min(maxW / (group.width ?? 1), maxH / (group.height ?? 1), 1)

  group.set({
    left: center.x - ((group.width ?? 0) * scale) / 2,
    top: center.y - ((group.height ?? 0) * scale) / 2,
    scaleX: scale,
    scaleY: scale,
    objectCaching: false,
  } as Record<string, unknown>)

  canvas.add(group)
  canvas.setActiveObject(group)
  canvas.renderAll()
  return group
}

/* ──────────────────────── Shapes ──────────────────────── */

export function addRect(canvas: FabricCanvas) {
  const center = getArtboardCenter()
  const rect = new Rect({
    left: center.x - 50,
    top: center.y - 50,
    width: 100,
    height: 100,
    fill: '#4F46E5',
    stroke: '#3730A3',
    strokeWidth: 1,
    rx: 4,
    ry: 4,
    originX: 'left',
    originY: 'top',
  })
  canvas.add(rect)
  canvas.setActiveObject(rect)
  canvas.renderAll()
  return rect
}

export function addCircle(canvas: FabricCanvas) {
  const center = getArtboardCenter()
  const circle = new Circle({
    left: center.x - 40,
    top: center.y - 40,
    radius: 40,
    fill: '#059669',
    stroke: '#047857',
    strokeWidth: 1,
    originX: 'left',
    originY: 'top',
  })
  canvas.add(circle)
  canvas.setActiveObject(circle)
  canvas.renderAll()
  return circle
}

export function addTriangle(canvas: FabricCanvas) {
  const center = getArtboardCenter()
  const tri = new Triangle({
    left: center.x - 40,
    top: center.y - 40,
    width: 80,
    height: 80,
    fill: '#DC2626',
    stroke: '#B91C1C',
    strokeWidth: 1,
    originX: 'left',
    originY: 'top',
  })
  canvas.add(tri)
  canvas.setActiveObject(tri)
  canvas.renderAll()
  return tri
}

export function addLine(canvas: FabricCanvas) {
  const center = getArtboardCenter()
  const line = new Line(
    [center.x - 60, center.y, center.x + 60, center.y],
    {
      stroke: '#333333',
      strokeWidth: 2,
    }
  )
  canvas.add(line)
  canvas.setActiveObject(line)
  canvas.renderAll()
  return line
}

export function addStar(canvas: FabricCanvas) {
  const center = getArtboardCenter()
  const cx = 0, cy = 0, outerR = 40, innerR = 18, points = 5
  const starPoints: { x: number; y: number }[] = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (Math.PI / points) * i - Math.PI / 2
    starPoints.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) })
  }
  const star = new Polygon(starPoints, {
    left: center.x - 40,
    top: center.y - 40,
    fill: '#F59E0B',
    stroke: '#D97706',
    strokeWidth: 1,
  })
  canvas.add(star)
  canvas.setActiveObject(star)
  canvas.renderAll()
  return star
}

/* ──────────────────────── Object Operations ──────────────────────── */

export function deleteSelected(canvas: FabricCanvas) {
  const active = canvas.getActiveObjects()
  if (!active.length) return
  active.forEach((obj) => {
    const meta = obj as unknown as Record<string, unknown>
    if (meta.isArtboard || meta.isGuide) return
    canvas.remove(obj)
  })
  canvas.discardActiveObject()
  canvas.renderAll()
}

/** Group multiple selected objects into one permanent group */
export function groupSelected(canvas: FabricCanvas) {
  const active = canvas.getActiveObject()
  if (!active || active.type !== 'activeSelection') return
  
  const group = (active as any).toGroup()
  canvas.setActiveObject(group)
  canvas.renderAll()
  return group
}

/** Take a Group and break it back into individual objects */
export function ungroupSelected(canvas: FabricCanvas) {
  const active = canvas.getActiveObject()
  if (!active || active.type !== 'group') return
  
  const selection = (active as any).toActiveSelection()
  canvas.setActiveObject(selection)
  canvas.renderAll()
  return selection
}

/* ──────────────────────── Clipboard ──────────────────────── */

let _clipboard: FabricObject | null = null

export function copyToClipboard(canvas: FabricCanvas) {
  const active = canvas.getActiveObject()
  if (!active || (active as unknown as Record<string, unknown>).isArtboard) return
  active.clone().then((cloned: FabricObject) => {
    _clipboard = cloned
  })
}

export function pasteFromClipboard(canvas: FabricCanvas) {
  if (!_clipboard) return
  _clipboard.clone().then((cloned: FabricObject) => {
    canvas.discardActiveObject()
    cloned.set({
      left: (cloned.left ?? 0) + 20,
      top: (cloned.top ?? 0) + 20,
      evented: true,
    })
    if (cloned.type === 'activeSelection') {
      // ActiveSelection needs to be added object by object
      cloned.canvas = canvas
      ;(cloned as any).forEachObject((obj: FabricObject) => canvas.add(obj))
      cloned.setCoords()
    } else {
      canvas.add(cloned)
    }
    // Update clipboard position for next paste
    if (_clipboard) {
      _clipboard.top = (_clipboard.top ?? 0) + 20
      _clipboard.left = (_clipboard.left ?? 0) + 20
    }
    canvas.setActiveObject(cloned)
    canvas.renderAll()
  })
}

export function duplicateSelected(canvas: FabricCanvas) {
  const active = canvas.getActiveObject()
  if (!active || (active as unknown as Record<string, unknown>).isArtboard) return
  active.clone().then((cloned: typeof active) => {
    cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20 })
    canvas.add(cloned)
    canvas.setActiveObject(cloned)
    canvas.renderAll()
  })
}

/* ──────────────────────── Style Copy ──────────────────────── */

let _styleClipboard: Record<string, any> | null = null

export function copyStyle(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  _styleClipboard = {
    fill: obj.fill,
    stroke: obj.stroke,
    strokeWidth: obj.strokeWidth,
    opacity: obj.opacity,
    // Text specific
    fontSize: (obj as any).fontSize,
    fontFamily: (obj as any).fontFamily,
    fontWeight: (obj as any).fontWeight,
    fontStyle: (obj as any).fontStyle,
    lineHeight: (obj as any).lineHeight,
    textAlign: (obj as any).textAlign,
    underline: (obj as any).underline,
    overline: (obj as any).overline,
    linethrough: (obj as any).linethrough,
  }
}

export function pasteStyle(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj || !_styleClipboard) return
  obj.set(_styleClipboard)
  canvas.renderAll()
}

/* ──────────────────────── Layer ordering ──────────────────────── */

export function bringForward(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  canvas.bringObjectForward(obj)
  canvas.renderAll()
}

export function sendBackward(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  canvas.sendObjectBackwards(obj)
  // Ensure it doesn't go behind the artboard
  const artboard = findArtboard(canvas)
  if (artboard) {
    const objects = canvas.getObjects()
    const objIndex = objects.indexOf(obj)
    const artboardIndex = objects.indexOf(artboard)
    if (objIndex <= artboardIndex) {
      canvas.bringObjectForward(obj)
    }
  }
  canvas.renderAll()
}

export function bringToFront(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  canvas.bringObjectToFront(obj)
  canvas.renderAll()
}

export function sendToBack(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  // Send to back but keep above artboard
  const artboard = findArtboard(canvas)
  if (artboard) {
    canvas.sendObjectToBack(obj)
    // Move obj just above artboard
    canvas.bringObjectForward(obj)
  } else {
    canvas.sendObjectToBack(obj)
  }
  canvas.renderAll()
}

/* ──────────────────────── Flip ──────────────────────── */

export function flipHorizontal(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  obj.set('flipX', !obj.flipX)
  canvas.renderAll()
}

export function flipVertical(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  obj.set('flipY', !obj.flipY)
  canvas.renderAll()
}

/* ──────────────────────── Center & Alignment ──────────────────────── */

export function centerOnArtboard(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  const center = getArtboardCenter()
  const bound = obj.getBoundingRect()
  obj.set({
    left: center.x - bound.width / 2,
    top: center.y - bound.height / 2,
  })
  obj.setCoords()
  canvas.renderAll()
}

export function alignLeft(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  obj.set({ left: 0 })
  obj.setCoords()
  canvas.renderAll()
}

export function alignRight(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  const { artboardWidth } = useEditorStore.getState()
  const bound = obj.getBoundingRect()
  obj.set({ left: artboardWidth - bound.width })
  obj.setCoords()
  canvas.renderAll()
}

export function alignTop(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  obj.set({ top: 0 })
  obj.setCoords()
  canvas.renderAll()
}

export function alignBottom(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  const { artboardHeight } = useEditorStore.getState()
  const bound = obj.getBoundingRect()
  obj.set({ top: artboardHeight - bound.height })
  obj.setCoords()
  canvas.renderAll()
}

export function alignCenterHorizontal(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  const { artboardWidth } = useEditorStore.getState()
  const bound = obj.getBoundingRect()
  obj.set({ left: (artboardWidth - bound.width) / 2 })
  obj.setCoords()
  canvas.renderAll()
}

export function alignCenterVertical(canvas: FabricCanvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  const { artboardHeight } = useEditorStore.getState()
  const bound = obj.getBoundingRect()
  obj.set({ top: (artboardHeight - bound.height) / 2 })
  obj.setCoords()
  canvas.renderAll()
}

/* ──────────────────────── Lock ──────────────────────── */

export function toggleLock(canvas: FabricCanvas, target?: FabricObject) {
  const obj = target || canvas.getActiveObject()
  if (!obj) return
  const locked = !obj.selectable
  obj.set({
    selectable: !locked ? false : true,
    evented: true, // Keep it true so we can still click it to show the "Unlock" toolbar
    lockMovementX: !locked,
    lockMovementY: !locked,
    lockRotation: !locked,
    lockScalingX: !locked,
    lockScalingY: !locked,
  })
  canvas.fire('object:modified', { target: obj })
  canvas.renderAll()
}

/* ──────────────────────── Background ──────────────────────── */

export function setBackground(canvas: FabricCanvas, color: string) {
  const artboard = findArtboard(canvas)
  if (artboard) {
    artboard.set('fill', color)
  } else {
    canvas.backgroundColor = color
  }
  canvas.renderAll()
}

/** Set a Fabric.js Pattern as the background fill */
export function setBackgroundPattern(canvas: FabricCanvas, pattern: Pattern) {
  const artboard = findArtboard(canvas)
  if (artboard) {
    artboard.set('fill', pattern)
  } else {
    canvas.backgroundColor = pattern as unknown as string
  }
  canvas.renderAll()
}

/** Set a linear gradient as the artboard background */
export function setBackgroundGradient(
  canvas: FabricCanvas,
  colorStops: { offset: number; color: string }[],
  angle = 135
) {
  const artboard = findArtboard(canvas)
  const target = artboard ?? canvas
  const w = artboard ? (artboard.width ?? 800) : canvas.getWidth()
  const h = artboard ? (artboard.height ?? 600) : canvas.getHeight()

  // Convert angle to coordinates
  const rad = (angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const halfW = w / 2
  const halfH = h / 2
  const len = Math.abs(halfW * cos) + Math.abs(halfH * sin)

  const x1 = halfW - len * cos
  const y1 = halfH - len * sin
  const x2 = halfW + len * cos
  const y2 = halfH + len * sin

  const gradient = new Gradient({
    type: 'linear',
    coords: { x1, y1, x2, y2 },
    colorStops,
  })

  if (artboard) {
    artboard.set('fill', gradient)
  } else {
    canvas.backgroundColor = gradient as unknown as string
  }
  canvas.renderAll()
}

/** Get current background color from artboard */
export function getBackgroundColor(canvas: FabricCanvas): string {
  const artboard = findArtboard(canvas)
  if (artboard) {
    const fill = artboard.fill
    if (typeof fill === 'string') return fill
    return '#ffffff'
  }
  const bg = canvas.backgroundColor
  if (typeof bg === 'string') return bg
  return '#ffffff'
}

/* ──────────────────────── Export / Import ──────────────────────── */

export function exportJSON(canvas: FabricCanvas): string {
  // @ts-ignore - Fabric 6/7 types might not show arguments for toJSON but it works
  return JSON.stringify(canvas.toJSON(['isArtboard', 'rawText']), null, 2)
}

export async function loadJSON(canvas: FabricCanvas, json: string) {
  await canvas.loadFromJSON(JSON.parse(json))
  canvas.renderAll()
}

export function exportPNG(canvas: FabricCanvas): string {
  const { artboardWidth, artboardHeight } = useEditorStore.getState()

  // Find the artboard to get its actual bounding box
  const artboard = canvas.getObjects().find(
    (o) => (o as unknown as Record<string, unknown>).isArtboard
  )

  // Save current viewport transform and reset to identity so export
  // captures the full artboard regardless of zoom/pan state
  const vpt = canvas.viewportTransform
  const savedVpt = vpt ? [...vpt] as typeof vpt : null
  canvas.viewportTransform = [1, 0, 0, 1, 0, 0]

  // Use the artboard's actual bounding rect for clipping coordinates
  let clipLeft = 0
  let clipTop = 0
  let clipWidth = artboardWidth
  let clipHeight = artboardHeight

  if (artboard) {
    const bound = artboard.getBoundingRect()
    clipLeft = bound.left
    clipTop = bound.top
    clipWidth = bound.width
    clipHeight = bound.height
  }

  const dataUrl = canvas.toDataURL({
    format: 'png',
    multiplier: 2,
    left: clipLeft,
    top: clipTop,
    width: clipWidth,
    height: clipHeight,
  })

  // Restore original viewport transform
  if (savedVpt) {
    canvas.viewportTransform = savedVpt
  }
  canvas.renderAll()

  return dataUrl
}

export function exportSVG(canvas: FabricCanvas): string {
  // Find artboard to set SVG viewBox to artboard bounds
  const artboard = canvas.getObjects().find(
    (o) => (o as unknown as Record<string, unknown>).isArtboard
  )

  if (artboard) {
    const bound = artboard.getBoundingRect()
    return canvas.toSVG({
      viewBox: {
        x: bound.left,
        y: bound.top,
        width: bound.width,
        height: bound.height,
      },
    })
  }

  return canvas.toSVG()
}

/* ──────────────────────── Custom Controls ──────────────────────── */

const CTRL_COLOR = '#4DA6FF'       // light blue
const CTRL_FILL = '#FFFFFF'        // white fill for handles
const CTRL_STROKE = CTRL_COLOR     // border of handles
const CTRL_CORNER_SIZE = 12
const CTRL_BORDER_WIDTH = 1.5

/** Draw a circular control handle */
function renderCircleControl(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  _styleOverride: unknown,
  fabricObject: FabricObject
) {
  const size = fabricObject.cornerSize ?? CTRL_CORNER_SIZE
  ctx.save()
  ctx.translate(left, top)
  ctx.beginPath()
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
  ctx.fillStyle = CTRL_FILL
  ctx.fill()
  ctx.strokeStyle = CTRL_STROKE
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
}

/** Draw a pill-shaped (rounded rect) middle edge control */
function renderPillControl(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  _styleOverride: unknown,
  fabricObject: FabricObject
) {
  const isHorizontal = fabricObject.controls
    ? false // will be set per-control via wrapper
    : false
  void isHorizontal
  const w = 16
  const h = 6
  const r = 3
  ctx.save()
  ctx.translate(left, top)
  ctx.beginPath()
  ctx.roundRect(-w / 2, -h / 2, w, h, r)
  ctx.fillStyle = CTRL_FILL
  ctx.fill()
  ctx.strokeStyle = CTRL_STROKE
  ctx.lineWidth = 1.2
  ctx.stroke()
  ctx.restore()
}

function renderPillControlH(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  _styleOverride: unknown,
  _fabricObject: FabricObject
) {
  const w = 6
  const h = 16
  const r = 3
  ctx.save()
  ctx.translate(left, top)
  ctx.beginPath()
  ctx.roundRect(-w / 2, -h / 2, w, h, r)
  ctx.fillStyle = CTRL_FILL
  ctx.fill()
  ctx.strokeStyle = CTRL_STROKE
  ctx.lineWidth = 1.2
  ctx.stroke()
  ctx.restore()
}

/** Draw rotation control — circle with rotate icon */
function renderRotationControl(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
) {
  const r = 10
  ctx.save()
  ctx.translate(left, top)

  // White circle background
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fillStyle = CTRL_FILL
  ctx.fill()
  ctx.strokeStyle = CTRL_STROKE
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Rotation arrow icon
  ctx.beginPath()
  ctx.arc(0, 0, 5, -Math.PI * 0.8, Math.PI * 0.5)
  ctx.strokeStyle = CTRL_COLOR
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  ctx.stroke()

  // Arrowhead
  const endX = 5 * Math.cos(Math.PI * 0.5)
  const endY = 5 * Math.sin(Math.PI * 0.5)
  ctx.beginPath()
  ctx.moveTo(endX - 3, endY - 2)
  ctx.lineTo(endX, endY)
  ctx.lineTo(endX + 3, endY - 2)
  ctx.strokeStyle = CTRL_COLOR
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()

  ctx.restore()
}

/**
 * Apply modern selection controls to all objects on the canvas:
 * - Light blue selection border
 * - Circular white corner handles
 * - Pill-shaped middle edge handles
 * - Styled rotation control with icon
 */
export function applyRotationCursor(canvas: FabricCanvas) {
  const cornerKeys = new Set(['tl', 'tr', 'bl', 'br'])
  const hPillKeys = new Set(['mt', 'mb'])
  const vPillKeys = new Set(['ml', 'mr'])

  const applyModernControls = (obj: FabricObject) => {
    const meta = obj as unknown as Record<string, unknown>
    if (meta.isArtboard || meta.isGuide) return

    // Selection border style
    obj.set({
      borderColor: CTRL_COLOR,
      borderScaleFactor: CTRL_BORDER_WIDTH,
      cornerColor: CTRL_FILL,
      cornerStrokeColor: CTRL_STROKE,
      cornerSize: CTRL_CORNER_SIZE,
      cornerStyle: 'circle',
      transparentCorners: false,
      borderOpacityWhenMoving: 0.6,
      padding: 4,
    } as Partial<FabricObject>)

    // Ensure controls are own-instance (not shared prototype)
    // Clone controls so we don't mutate the class prototype
    const ownControls: Record<string, typeof obj.controls[string]> = {}
    for (const key of Object.keys(obj.controls)) {
      const ctrl = obj.controls[key]
      // Shallow clone the control
      ownControls[key] = Object.assign(Object.create(Object.getPrototypeOf(ctrl)), ctrl)
    }
    obj.controls = ownControls

    // Apply custom renderers and cursors to ALL controls
    for (const [key, ctrl] of Object.entries(obj.controls)) {
      if (key === 'mtr') {
        // Rotation control — bottom center with icon
        ctrl.render = renderRotationControl
        ctrl.cursorStyle = 'grab'
        ctrl.x = 0
        ctrl.y = 0.5
        ctrl.offsetY = 24
        ctrl.withConnection = true
      } else if (cornerKeys.has(key)) {
        // Corner controls — white circles
        ctrl.render = renderCircleControl
        ctrl.cursorStyle = key === 'tl' || key === 'br' ? 'nwse-resize' : 'nesw-resize'
      } else if (hPillKeys.has(key)) {
        // Top/bottom middle — horizontal pill
        ctrl.render = renderPillControl
        ctrl.cursorStyle = 'ns-resize'
      } else if (vPillKeys.has(key)) {
        // Left/right middle — vertical pill
        ctrl.render = renderPillControlH
        ctrl.cursorStyle = 'ew-resize'
      } else {
        // Any other control (e.g. textbox edit controls) — use circle style
        ctrl.render = renderCircleControl
      }
    }
  }

  // Apply to existing objects
  canvas.getObjects().forEach(applyModernControls)

  // Apply to future objects
  canvas.on('object:added', (e) => {
    const obj = (e as unknown as { target: FabricObject }).target
    if (obj) applyModernControls(obj)
  })

  // Re-apply after text editing exits (Textbox recreates controls)
  canvas.on('text:editing:exited', (e) => {
    const obj = (e as unknown as { target: FabricObject }).target
    if (obj) applyModernControls(obj)
  })
}
