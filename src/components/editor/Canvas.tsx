'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Canvas as FabricCanvas, Rect, Shadow, Point, Line as FabricLine, PencilBrush } from 'fabric'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { HistoryManager } from '@/lib/editor/history'
import { 
  applyRotationCursor,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  groupSelected,
  ungroupSelected
} from '@/lib/editor/fabricUtils'
import FloatingToolbar from './FloatingToolbar'
import ContextMenu from './ContextMenu'

const DEFAULT_ARTBOARD_WIDTH = 800
const DEFAULT_ARTBOARD_HEIGHT = 600

function computeDisplayScale(
  fullWidthPx: number,
  fullHeightPx: number,
  maxDisplay = 800
): number {
  if (fullWidthPx <= maxDisplay && fullHeightPx <= maxDisplay) return 1
  return Math.min(maxDisplay / fullWidthPx, maxDisplay / fullHeightPx)
}

export default function EditorCanvas() {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<FabricCanvas | null>(null)
  const historyRef = useRef<HistoryManager | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const keydownRef = useRef<((e: KeyboardEvent) => void) | null>(null)

  // Track container size to trigger canvas init once layout is ready
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null)

  const {
    setCanvas,
    setActiveObject,
    refreshObjects,
    pushHistory,
    showGrid,
    showPrintBoundaries,
    canvasDimensions,
    template,
    setArtboardSize,
    setZoom,
  } = useEditorStore()

  const saveHistory = useCallback(
    (json: string) => pushHistory(json),
    [pushHistory]
  )

  // Observe container size — triggers canvas init when layout is ready
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 50 && height > 50) {
          // Only set once for initialization — don't keep updating
          setContainerSize((prev) => prev ?? { w: Math.round(width), h: Math.round(height) })
        }
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Compute artboard dimensions from canvasDimensions (or defaults)
  const computeArtboard = useCallback(() => {
    let artboardW = DEFAULT_ARTBOARD_WIDTH
    let artboardH = DEFAULT_ARTBOARD_HEIGHT
    if (canvasDimensions) {
      const scale = computeDisplayScale(canvasDimensions.widthPx, canvasDimensions.heightPx, 800)
      artboardW = Math.round(canvasDimensions.widthPx * scale)
      artboardH = Math.round(canvasDimensions.heightPx * scale)
    }
    return { artboardW, artboardH }
  }, [canvasDimensions])

  // Initialize Fabric.js canvas once container has dimensions
  useEffect(() => {
    if (!canvasElRef.current || fabricRef.current || !containerSize) return

    const containerW = containerSize.w
    const containerH = containerSize.h

    const { artboardW, artboardH } = computeArtboard()

    setArtboardSize(artboardW, artboardH)

    // Create canvas filling the container
    const canvas = new FabricCanvas(canvasElRef.current, {
      width: containerW,
      height: containerH,
      backgroundColor: 'transparent',
      selection: true,
      preserveObjectStacking: true,
    })

    // Style Fabric.js wrapper to fill container
    const wrapper = canvas.getElement().parentElement
    if (wrapper) {
      wrapper.style.position = 'absolute'
      wrapper.style.inset = '0'
      wrapper.style.width = '100%'
      wrapper.style.height = '100%'
    }

    // Add artboard rect (white workspace with shadow)
    const artboard = new Rect({
      left: 0,
      top: 0,
      originX: 'left',
      originY: 'top',
      width: artboardW,
      height: artboardH,
      fill: '#ffffff',
      selectable: false,
      evented: false,
      hoverCursor: 'default',
      shadow: new Shadow({ color: 'rgba(0,0,0,0.15)', blur: 20, offsetX: 0, offsetY: 2 }),
    })
    ;(artboard as unknown as Record<string, unknown>).isArtboard = true
    canvas.add(artboard)

    // Calculate initial zoom to fit artboard with padding
    const padding = 0.85
    const initialZoom = Math.min(
      (containerW * padding) / artboardW,
      (containerH * padding) / artboardH,
      1
    )

    fabricRef.current = canvas
    setCanvas(canvas)

    // Customize rotation control cursor (~45 degree arrow) for all objects
    applyRotationCursor(canvas)

    // Initialize Drawing Brush
    const pencil = new PencilBrush(canvas)
    pencil.color = useEditorStore.getState().brushColor
    pencil.width = useEditorStore.getState().brushWidth
    canvas.freeDrawingBrush = pencil

    // Use store's setZoom which handles centering via setCenterFromObject
    setZoom(initialZoom)

    // Mouse wheel zoom — zoom toward cursor position
    canvas.on('mouse:wheel', (opt) => {
      const evt = opt.e as WheelEvent
      evt.preventDefault()
      evt.stopPropagation()

      const delta = evt.deltaY
      const currentZoom = canvas.getZoom()
      let newZoom = delta > 0 ? currentZoom * 0.95 : currentZoom * 1.05
      newZoom = Math.max(0.1, Math.min(5, newZoom))

      // Zoom toward the mouse pointer position
      canvas.zoomToPoint(new Point(evt.offsetX, evt.offsetY), newZoom)

      // Sync store zoom state (without re-centering)
      useEditorStore.setState({ zoom: newZoom })
    })

    // History
    const history = new HistoryManager(saveHistory, 300)
    historyRef.current = history
    history.captureImmediate(canvas)

    // Selection events
    canvas.on('selection:created', (e) => setActiveObject(e.selected?.[0] ?? null))
    canvas.on('selection:updated', (e) => setActiveObject(e.selected?.[0] ?? null))
    canvas.on('selection:cleared', () => setActiveObject(null))

    // Handle clicks on locked (non-selectable) objects to show the floating toolbar
    canvas.on('mouse:down', (opt) => {
      if (opt.target) {
        const meta = opt.target as unknown as Record<string, unknown>
        // Ignore artboard and guides
        if (meta.isArtboard || meta.isGuide) {
          // If we click the background, Fabric clears selection normally, 
          // but we ensure store is cleared too.
          if (!canvas.getActiveObject()) setActiveObject(null)
          return
        }
        
        // If it's a valid object, set it in the store
        // This handles cases where Fabric doesn't fire 'selection' events for locked objects
        setActiveObject(opt.target)
      } else {
        // Clicked empty canvas
        setActiveObject(null)
      }
    })

    // Artboard boundary enforcement — clamp object within artboard while dragging
    canvas.on('object:moving', (e) => {
      const obj = e.target
      if (!obj) return
      const meta = obj as unknown as Record<string, unknown>
      if (meta.isArtboard || meta.isGuide) return
      const { artboardWidth, artboardHeight } = useEditorStore.getState()
      if (!artboardWidth || !artboardHeight) return

      // Use setCoords() before getting bounds to ensure accuracy during drag
      obj.setCoords()
      const bound = obj.getBoundingRect()
      
      let nextLeft = obj.left ?? 0
      let nextTop = obj.top ?? 0

      // Clamp Left/Right
      if (bound.left < 0) {
        nextLeft -= bound.left
      } else if (bound.left + bound.width > artboardWidth) {
        nextLeft -= (bound.left + bound.width - artboardWidth)
      }

      // Clamp Top/Bottom
      if (bound.top < 0) {
        nextTop -= bound.top
      } else if (bound.top + bound.height > artboardHeight) {
        nextTop -= (bound.top + bound.height - artboardHeight)
      }

      obj.set({ left: nextLeft, top: nextTop })
      obj.setCoords()
    })

    // History capture (skip during undo/redo)
    canvas.on('object:modified', () => {
      if (!useEditorStore.getState().isRestoring) history.capture(canvas)
      refreshObjects()
    })
    canvas.on('object:added', () => {
      const state = useEditorStore.getState()
      if (!state.isRestoring) {
        history.capture(canvas)
        // Mobile UX: Auto-close sidebar when element is added
        if (window.innerWidth < 768) {
          state.setLeftPanel(null)
        }
      }
      refreshObjects()
    })
    canvas.on('object:removed', () => {
      if (!useEditorStore.getState().isRestoring) history.capture(canvas)
      refreshObjects()
    })

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const ctrl = e.ctrlKey || e.metaKey

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = canvas.getActiveObjects()
        if (active.length) {
          active.forEach((obj) => {
            const meta = obj as unknown as Record<string, unknown>
            if (meta.isArtboard || meta.isGuide) return
            canvas.remove(obj)
          })
          canvas.discardActiveObject()
          canvas.renderAll()
        }
      }
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useEditorStore.getState().undo()
      }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        useEditorStore.getState().redo()
      }
      if (ctrl && e.key === 'a') {
        e.preventDefault()
        canvas.discardActiveObject()
        const objs = canvas.getObjects().filter(
          (o) => {
            const meta = o as unknown as Record<string, unknown>
            return !meta.isArtboard && !meta.isGuide
          }
        )
        if (objs.length) {
          const sel = new (
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require('fabric').ActiveSelection
          )(objs, { canvas })
          canvas.setActiveObject(sel)
          canvas.renderAll()
        }
      }

      // Layering shortcuts
      if (ctrl && (e.key === ']' || e.key === '[')) {
        e.preventDefault()
        const isForward = e.key === ']'
        const isToEdge = e.altKey

        if (isForward) {
          if (isToEdge) bringToFront(canvas)
          else bringForward(canvas)
        } else {
          if (isToEdge) sendToBack(canvas)
          else sendBackward(canvas)
        }
        refreshObjects()
        canvas.renderAll()
      }

      // Grouping shortcuts
      if (ctrl && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (e.shiftKey) {
          ungroupSelected(canvas)
        } else {
          groupSelected(canvas)
        }
        refreshObjects()
        canvas.renderAll()
      }
    }
    keydownRef.current = handleKeyDown
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      if (keydownRef.current) window.removeEventListener('keydown', keydownRef.current)
      history.dispose()
      // BUG-033 FIX: Explicitly remove canvas event listeners before dispose.
      // canvas.dispose() removes them in Fabric.js v6, but being explicit prevents leaks
      // if the Fabric.js version changes. These were being attached on every init.
      canvas.off('mouse:wheel')
      canvas.off('object:moving')
      canvas.off('object:added')
      canvas.off('object:modified')
      canvas.off('object:removed')
      canvas.off('selection:created')
      canvas.off('selection:updated')
      canvas.off('selection:cleared')
      canvas.off('text:editing:exited')
      canvas.dispose()
      fabricRef.current = null
      setCanvas(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerSize])

  // Handle canvasDimensions change (template switch) — resize artboard in-place
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const { artboardW, artboardH } = computeArtboard()

    // Find existing artboard rect
    const artboard = canvas.getObjects().find(
      (o) => (o as unknown as Record<string, unknown>).isArtboard
    )
    if (!artboard) return

    // Update artboard rect dimensions and reset position to origin
    artboard.set({ left: 0, top: 0, width: artboardW, height: artboardH })
    artboard.setCoords()

    // Update store
    setArtboardSize(artboardW, artboardH)

    // Re-clamp all objects into the new artboard bounds
    canvas.getObjects().forEach((obj) => {
      const meta = obj as unknown as Record<string, unknown>
      if (meta.isArtboard || meta.isGuide) return

      obj.setCoords()
      const bound = obj.getBoundingRect()
      let nextLeft = obj.left ?? 0
      let nextTop = obj.top ?? 0

      // If object is now completely or partially outside, bring it back or center it
      if (bound.left < 0 || bound.left + bound.width > artboardW) {
        // Simple approach: center it if it's lost
        nextLeft = (artboardW - bound.width) / 2
      }
      if (bound.top < 0 || bound.top + bound.height > artboardH) {
        nextTop = (artboardH - bound.height) / 2
      }

      obj.set({ left: nextLeft, top: nextTop })
      obj.setCoords()
    })

    // Recalculate zoom to fit new artboard with padding
    const containerW = canvas.getWidth()
    const containerH = canvas.getHeight()
    const padding = 0.85
    const fitZoom = Math.min(
      (containerW * padding) / artboardW,
      (containerH * padding) / artboardH,
      1
    )

    // Compute viewport transform directly (setCenterFromObject approach)
    const objCenter = artboard.getCenterPoint()
    const vpt = canvas.viewportTransform
    if (vpt) {
      vpt[0] = fitZoom
      vpt[3] = fitZoom
      vpt[4] = (containerW / 2) - (objCenter.x * fitZoom)
      vpt[5] = (containerH / 2) - (objCenter.y * fitZoom)
      canvas.setViewportTransform(vpt)
    }

    // Sync store zoom state
    useEditorStore.setState({ zoom: fitZoom })
    canvas.renderAll()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasDimensions])

  // Handle container resize (after init) — resize canvas and re-center artboard
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const canvas = fabricRef.current
      if (!canvas) return
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 50 && height > 50) {
          canvas.setDimensions({ width, height })
          canvas.calcOffset()

          // Re-center artboard after resize
          const artboard = canvas.getObjects().find(
            (o) => (o as unknown as Record<string, unknown>).isArtboard
          )
          if (artboard) {
            const objCenter = artboard.getCenterPoint()
            const currentZoom = canvas.getZoom()
            const vpt = canvas.viewportTransform
            if (vpt) {
              vpt[4] = (width / 2) - (objCenter.x * currentZoom)
              vpt[5] = (height / 2) - (objCenter.y * currentZoom)
              canvas.setViewportTransform(vpt)
            }
          }

          canvas.renderAll()
        }
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Add grid lines as Fabric objects
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const { artboardWidth, artboardHeight } = useEditorStore.getState()
    if (!artboardWidth || !artboardHeight || !showGrid) return

    const guideObjects: FabricLine[] = []
    const gridSize = 20
    const gridProps = {
      stroke: 'rgba(0,0,0,0.06)',
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
      hoverCursor: 'default',
      excludeFromExport: true,
    }
    for (let x = gridSize; x < artboardWidth; x += gridSize) {
      const line = new FabricLine([x, 0, x, artboardHeight], gridProps)
      ;(line as unknown as Record<string, unknown>).isGuide = true
      guideObjects.push(line)
    }
    for (let y = gridSize; y < artboardHeight; y += gridSize) {
      const line = new FabricLine([0, y, artboardWidth, y], gridProps)
      ;(line as unknown as Record<string, unknown>).isGuide = true
      guideObjects.push(line)
    }

    guideObjects.forEach((obj) => canvas.add(obj))
    canvas.renderAll()

    return () => {
      guideObjects.forEach((obj) => canvas.remove(obj))
      canvas.renderAll()
    }
  }, [showGrid, canvasDimensions])

  // Add print boundary guides (bleed & safe zone) — always visible by default
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !showPrintBoundaries) return

    const { artboardWidth, artboardHeight } = useEditorStore.getState()
    if (!artboardWidth || !artboardHeight) return

    // Use template values if available; fall back to sensible print defaults
    // Default: 3 mm bleed, 3 mm safe zone (typical for most print products)
    const DEFAULT_BLEED_PX   = Math.max(12, artboardWidth * 0.018)  // ~3 mm at 96dpi
    const DEFAULT_SAFE_PX    = Math.max(12, artboardWidth * 0.018)

    let bleedPx: number
    let safeZonePx: number

    if (canvasDimensions) {
      const scaleX = artboardWidth / canvasDimensions.widthPx
      bleedPx   = canvasDimensions.bleedPx    > 0 ? canvasDimensions.bleedPx    * scaleX : DEFAULT_BLEED_PX
      safeZonePx = canvasDimensions.safeZonePx > 0 ? canvasDimensions.safeZonePx * scaleX : DEFAULT_SAFE_PX
    } else {
      bleedPx    = DEFAULT_BLEED_PX
      safeZonePx = DEFAULT_SAFE_PX
    }

    const guideObjects: (Rect | FabricLine)[] = []

    // ── Bleed boundary rect (red dashed) ─────────────────────────────────
    //    The trim line — where the paper will be cut.
    const bleedRect = new Rect({
      left:         bleedPx,
      top:          bleedPx,
      width:        artboardWidth  - bleedPx * 2,
      height:       artboardHeight - bleedPx * 2,
      fill:         'transparent',
      stroke:       'rgba(239,68,68,0.85)',
      strokeWidth:  1,
      strokeDashArray: [6, 3],
      selectable:   false,
      evented:      false,
      hoverCursor:  'default',
      excludeFromExport: true,
    })
    ;(bleedRect as unknown as Record<string, unknown>).isGuide = true
    guideObjects.push(bleedRect)

    // ── Safe zone rect (blue dashed) ──────────────────────────────────────
    //    Keep all critical content (text, logos) inside this boundary.
    const sx = bleedPx + safeZonePx
    const safeRect = new Rect({
      left:         sx,
      top:          sx,
      width:        artboardWidth  - sx * 2,
      height:       artboardHeight - sx * 2,
      fill:         'transparent',
      stroke:       'rgba(59,130,246,0.75)',
      strokeWidth:  1,
      strokeDashArray: [4, 3],
      selectable:   false,
      evented:      false,
      hoverCursor:  'default',
      excludeFromExport: true,
    })
    ;(safeRect as unknown as Record<string, unknown>).isGuide = true
    guideObjects.push(safeRect)

    // ── Corner crop marks at bleed boundary ──────────────────────────────
    //    Short L-shaped lines just outside the trim at each corner.
    const markLen = Math.max(8, bleedPx * 0.8)   // length of each crop-mark arm
    const gap = 2                                  // gap between crop mark and trim line
    const corners: Array<[number, number, number, number][]> = [
      // Top-left  (horizontal + vertical)
      [[bleedPx - gap - markLen, bleedPx, bleedPx - gap, bleedPx],
       [bleedPx, bleedPx - gap - markLen, bleedPx, bleedPx - gap]],
      // Top-right
      [[artboardWidth - bleedPx + gap, bleedPx, artboardWidth - bleedPx + gap + markLen, bleedPx],
       [artboardWidth - bleedPx, bleedPx - gap - markLen, artboardWidth - bleedPx, bleedPx - gap]],
      // Bottom-left
      [[bleedPx - gap - markLen, artboardHeight - bleedPx, bleedPx - gap, artboardHeight - bleedPx],
       [bleedPx, artboardHeight - bleedPx + gap, bleedPx, artboardHeight - bleedPx + gap + markLen]],
      // Bottom-right
      [[artboardWidth - bleedPx + gap, artboardHeight - bleedPx, artboardWidth - bleedPx + gap + markLen, artboardHeight - bleedPx],
       [artboardWidth - bleedPx, artboardHeight - bleedPx + gap, artboardWidth - bleedPx, artboardHeight - bleedPx + gap + markLen]],
    ]
    for (const [h, v] of corners) {
      for (const coords of [h, v]) {
        const mark = new FabricLine(coords as [number, number, number, number], {
          stroke:      'rgba(0,0,0,0.35)',
          strokeWidth: 0.75,
          selectable:  false,
          evented:     false,
          hoverCursor: 'default',
          excludeFromExport: true,
        })
        ;(mark as unknown as Record<string, unknown>).isGuide = true
        guideObjects.push(mark)
      }
    }

    guideObjects.forEach((obj) => canvas.add(obj))
    canvas.renderAll()

    return () => {
      guideObjects.forEach((obj) => canvas.remove(obj))
      canvas.renderAll()
    }
  }, [showPrintBoundaries, canvasDimensions])

  const templateInfo = template
    ? `${template.name} — ${template.print_width_mm}×${template.print_height_mm}mm @ ${template.dpi} DPI`
    : null

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden editor-checkered-bg"
    >
      {/* Template info pill */}
      <div className={`absolute top-2 left-2 z-10 bg-ed-surface/90 backdrop-blur-sm border border-ed-border rounded-md px-3 py-1 text-xs text-ed-text-muted shadow-sm ${templateInfo ? '' : 'hidden'}`}>
        {templateInfo}
      </div>

      {/* Bleed / Safe legend — shown when print boundaries are on */}
      {showPrintBoundaries && (
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-3 rounded-lg bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm px-3 py-1.5 select-none pointer-events-none">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-600">
            <span className="inline-block h-[2px] w-5 rounded-full" style={{ background: 'rgba(239,68,68,0.85)', backgroundImage: 'repeating-linear-gradient(90deg,rgba(239,68,68,0.85) 0,rgba(239,68,68,0.85) 6px,transparent 6px,transparent 9px)' }} />
            Bleed
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-600">
            <span className="inline-block h-[2px] w-5 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg,rgba(59,130,246,0.85) 0,rgba(59,130,246,0.85) 4px,transparent 4px,transparent 7px)' }} />
            Safe
          </span>
        </div>
      )}

      <canvas ref={canvasElRef} />
      <DrawingModeSync />
      <FloatingToolbar />
      <ContextMenu />
    </div>
  )
}

/** 
 * Separate component to sync store drawing state with canvas object without re-rendering the whole Canvas component 
 */
function DrawingModeSync() {
  const canvas = useEditorStore((s) => s.canvas)
  const isDrawingMode = useEditorStore((s) => s.isDrawingMode)
  const brushColor = useEditorStore((s) => s.brushColor)
  const brushWidth = useEditorStore((s) => s.brushWidth)

  useEffect(() => {
    if (!canvas) return
    canvas.isDrawingMode = isDrawingMode
    if (isDrawingMode && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor
      canvas.freeDrawingBrush.width = brushWidth
    }
  }, [canvas, isDrawingMode, brushColor, brushWidth])

  return null
}
