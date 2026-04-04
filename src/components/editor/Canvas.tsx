'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Canvas as FabricCanvas, Rect, Shadow, Point, Line as FabricLine } from 'fabric'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { HistoryManager } from '@/lib/editor/history'
import { applyRotationCursor } from '@/lib/editor/fabricUtils'
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
      if (!useEditorStore.getState().isRestoring) history.capture(canvas)
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

  // Add print boundary guides (bleed & safe zone)
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !canvasDimensions || !showPrintBoundaries) return

    const { artboardWidth, artboardHeight } = useEditorStore.getState()
    if (!artboardWidth || !artboardHeight) return

    // Compute display-scale ratio (artboard display px / full px with bleed)
    const fullW = canvasDimensions.widthPx
    const fullH = canvasDimensions.heightPx
    const scaleX = artboardWidth / fullW
    const scaleY = artboardHeight / fullH

    const bleedPx = canvasDimensions.bleedPx * scaleX
    const safeZonePx = canvasDimensions.safeZonePx * scaleX

    const guideObjects: FabricLine[] = []

    const makeLine = (coords: [number, number, number, number], color: string, dashArray: number[]) => {
      const line = new FabricLine(coords, {
        stroke: color,
        strokeWidth: 1,
        strokeDashArray: dashArray,
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        excludeFromExport: true,
      })
      ;(line as unknown as Record<string, unknown>).isGuide = true
      return line
    }

    // Bleed boundary (red dashed) — inset from artboard edges by bleed amount
    if (bleedPx > 1) {
      const bx = bleedPx
      const by = bleedPx
      const bw = artboardWidth - bleedPx
      const bh = artboardHeight - bleedPx
      // Top
      guideObjects.push(makeLine([bx, by, bw, by], 'rgba(239,68,68,0.6)', [6, 4]))
      // Bottom
      guideObjects.push(makeLine([bx, bh, bw, bh], 'rgba(239,68,68,0.6)', [6, 4]))
      // Left
      guideObjects.push(makeLine([bx, by, bx, bh], 'rgba(239,68,68,0.6)', [6, 4]))
      // Right
      guideObjects.push(makeLine([bw, by, bw, bh], 'rgba(239,68,68,0.6)', [6, 4]))
    }

    // Safe zone (green dashed) — inset further by safe zone amount
    if (safeZonePx > 1) {
      const sx = bleedPx + safeZonePx
      const sy = bleedPx + safeZonePx
      const sw = artboardWidth - bleedPx - safeZonePx
      const sh = artboardHeight - bleedPx - safeZonePx
      // Top
      guideObjects.push(makeLine([sx, sy, sw, sy], 'rgba(34,197,94,0.5)', [4, 4]))
      // Bottom
      guideObjects.push(makeLine([sx, sh, sw, sh], 'rgba(34,197,94,0.5)', [4, 4]))
      // Left
      guideObjects.push(makeLine([sx, sy, sx, sh], 'rgba(34,197,94,0.5)', [4, 4]))
      // Right
      guideObjects.push(makeLine([sw, sy, sw, sh], 'rgba(34,197,94,0.5)', [4, 4]))
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
      <div className={`absolute top-2 left-2 z-10 bg-ed-surface/90 backdrop-blur-sm border border-ed-border rounded-md px-3 py-1 text-xs text-ed-text-muted shadow-sm ${templateInfo ? '' : 'hidden'}`}>
        {templateInfo}
      </div>
      <canvas ref={canvasElRef} />
      <FloatingToolbar />
      <ContextMenu />
    </div>
  )
}
