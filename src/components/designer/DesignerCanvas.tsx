'use client'

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react'
import type { ProductTemplate } from '@/types'
import type { DesignerCanvasRef } from '@/hooks/useDesigner'
import type { CanvasZones } from '@/lib/designer/canvas-utils'
import {
  initializeCanvas,
  getCanvasJSON,
  loadCanvasJSON,
  isZoneGuide,
} from '@/lib/designer/canvas-utils'
import {
  enforceConstraints,
  enforceScaleConstraints,
  clearAlignmentGuides,
} from '@/lib/designer/constraints'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react'

// --- Constants ---

const MAX_UNDO_STACK = 50
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.1

// --- Types ---

interface DesignerCanvasProps {
  template: ProductTemplate
  initialJson?: Record<string, unknown> | null
  onSelectionChange?: (obj: unknown | null) => void
  onCanvasModified?: () => void
  className?: string
}

// --- Component ---

const DesignerCanvasInner = forwardRef<DesignerCanvasRef, DesignerCanvasProps>(
  function DesignerCanvasInner(
    { template, initialJson, onSelectionChange, onCanvasModified, className },
    ref
  ) {
    const canvasElRef = useRef<HTMLCanvasElement>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvasRef = useRef<any>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fabricRef = useRef<any>(null)
    const zonesRef = useRef<CanvasZones | null>(null)
    const [zoom, setZoom] = useState(1)
    const [isReady, setIsReady] = useState(false)

    // Undo/redo stacks
    const undoStack = useRef<string[]>([])
    const redoStack = useRef<string[]>([])
    const isUndoRedo = useRef(false)

    // Pan state
    const isPanning = useRef(false)
    const lastPanPoint = useRef<{ x: number; y: number } | null>(null)
    const spaceHeld = useRef(false)

    // --- Save state to undo stack ---

    const saveState = useCallback(() => {
      if (isUndoRedo.current || !canvasRef.current) return

      const json = JSON.stringify(getCanvasJSON(canvasRef.current))

      // Avoid duplicate consecutive states
      if (undoStack.current.length > 0 && undoStack.current[undoStack.current.length - 1] === json) {
        return
      }

      undoStack.current.push(json)
      if (undoStack.current.length > MAX_UNDO_STACK) {
        undoStack.current.shift()
      }
      // Clear redo stack when new action is performed
      redoStack.current = []
    }, [])

    // --- Undo ---

    const undo = useCallback(() => {
      if (undoStack.current.length === 0 || !canvasRef.current) return

      isUndoRedo.current = true
      const currentState = JSON.stringify(getCanvasJSON(canvasRef.current))
      redoStack.current.push(currentState)

      const prevState = undoStack.current.pop()!
      const json = JSON.parse(prevState)
      loadCanvasJSON(canvasRef.current, json, () => {
        isUndoRedo.current = false
        canvasRef.current?.renderAll()
      })
    }, [])

    // --- Redo ---

    const redo = useCallback(() => {
      if (redoStack.current.length === 0 || !canvasRef.current) return

      isUndoRedo.current = true
      const currentState = JSON.stringify(getCanvasJSON(canvasRef.current))
      undoStack.current.push(currentState)

      const nextState = redoStack.current.pop()!
      const json = JSON.parse(nextState)
      loadCanvasJSON(canvasRef.current, json, () => {
        isUndoRedo.current = false
        canvasRef.current?.renderAll()
      })
    }, [])

    // --- Delete selected ---

    const deleteSelected = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const activeObjects = canvas.getActiveObjects()
      if (activeObjects.length === 0) return

      saveState()

      activeObjects.forEach((obj: { name?: string }) => {
        if (!isZoneGuide(obj) && obj.name !== '__print_bg') {
          canvas.remove(obj)
        }
      })

      canvas.discardActiveObject()
      canvas.renderAll()
      onSelectionChange?.(null)
      onCanvasModified?.()
    }, [saveState, onSelectionChange, onCanvasModified])

    // --- Initialize Fabric Canvas ---

    useEffect(() => {
      let mounted = true

      async function initFabric() {
        try {
          const fabric = await import('fabric')
          if (!mounted || !canvasElRef.current) return

        fabricRef.current = fabric

        const canvas = new fabric.Canvas(canvasElRef.current, {
          preserveObjectStacking: true,
          selection: true,
          stopContextMenu: true,
          fireRightClick: true,
          controlsAboveOverlay: true,
        })

        canvasRef.current = canvas

        // Initialize zones
        const zones = initializeCanvas(fabric, canvas, template)
        zonesRef.current = zones

        // Fit canvas to container on init
        fitToScreen(canvas, zones)

        // --- Event Handlers ---

        // Selection events
        canvas.on('selection:created', (e: { selected?: unknown[] }) => {
          onSelectionChange?.(e.selected?.[0] ?? null)
        })

        canvas.on('selection:updated', (e: { selected?: unknown[] }) => {
          onSelectionChange?.(e.selected?.[0] ?? null)
        })

        canvas.on('selection:cleared', () => {
          onSelectionChange?.(null)
        })

        // Object modification events
        canvas.on('object:moving', (e: { target?: unknown }) => {
          if (zonesRef.current) {
            enforceConstraints(fabric, canvas, zonesRef.current, e as { target?: unknown })
          }
        })

        canvas.on('object:scaling', (e: { target?: unknown }) => {
          if (zonesRef.current) {
            enforceScaleConstraints(zonesRef.current, e as { target?: unknown })
          }
        })

        canvas.on('object:modified', () => {
          clearAlignmentGuides(canvas)
          saveState()
          onCanvasModified?.()
        })

        canvas.on('object:added', () => {
          if (!isUndoRedo.current) {
            onCanvasModified?.()
          }
        })

        canvas.on('object:removed', () => {
          if (!isUndoRedo.current) {
            onCanvasModified?.()
          }
        })

        canvas.on('text:changed', () => {
          onCanvasModified?.()
        })

        // --- Pan with middle mouse button ---
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        canvas.on('mouse:down', (opt: any) => {
          const evt = opt.e as MouseEvent
          if (evt.button === 1 || spaceHeld.current) {
            // Middle mouse button or space held
            isPanning.current = true
            lastPanPoint.current = { x: evt.clientX, y: evt.clientY }
            canvas.selection = false
            canvas.defaultCursor = 'grab'
            evt.preventDefault()
            evt.stopPropagation()
          }
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        canvas.on('mouse:move', (opt: any) => {
          if (!isPanning.current || !lastPanPoint.current) return

          const evt = opt.e as MouseEvent
          const vpt = canvas.viewportTransform
          if (!vpt) return

          const dx = evt.clientX - lastPanPoint.current.x
          const dy = evt.clientY - lastPanPoint.current.y

          vpt[4] += dx
          vpt[5] += dy

          lastPanPoint.current = { x: evt.clientX, y: evt.clientY }
          canvas.requestRenderAll()
        })

        canvas.on('mouse:up', () => {
          if (isPanning.current) {
            isPanning.current = false
            lastPanPoint.current = null
            canvas.selection = true
            canvas.defaultCursor = 'default'
            canvas.setViewportTransform(canvas.viewportTransform!)
          }
        })

        // --- Zoom with scroll wheel ---
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        canvas.on('mouse:wheel', (opt: any) => {
          const evt = opt.e as WheelEvent
          evt.preventDefault()
          evt.stopPropagation()

          const delta = evt.deltaY
          let newZoom = canvas.getZoom()
          newZoom *= 0.999 ** delta

          newZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM)

          const point = new fabric.Point(evt.offsetX, evt.offsetY)
          canvas.zoomToPoint(point, newZoom)
          setZoom(newZoom)
        })

        // Load initial JSON if provided
        if (initialJson) {
          loadCanvasJSON(canvas, initialJson, () => {
            saveState()
          })
        } else {
          saveState()
        }

        setIsReady(true)
        } catch (err) {
          console.error('[DesignerCanvas] initFabric failed:', err)
        }
      }

      initFabric()

      return () => {
        mounted = false
        if (canvasRef.current) {
          canvasRef.current.dispose()
          canvasRef.current = null
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template])

    // --- Keyboard shortcuts ---

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Track space key for pan mode
        if (e.code === 'Space' && !e.repeat) {
          spaceHeld.current = true
          if (canvasRef.current) {
            canvasRef.current.defaultCursor = 'grab'
          }
          // Don't prevent default if user is typing in an input
          const target = e.target as HTMLElement
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return
          }
          e.preventDefault()
        }

        // Don't intercept shortcuts when typing in inputs
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault()
          undo()
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
          e.preventDefault()
          redo()
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          // Only delete if not editing text
          const activeObj = canvasRef.current?.getActiveObject()
          if (activeObj && activeObj.isEditing) return
          e.preventDefault()
          deleteSelected()
        }
      }

      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
          spaceHeld.current = false
          if (canvasRef.current && !isPanning.current) {
            canvasRef.current.defaultCursor = 'default'
          }
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)

      return () => {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
      }
    }, [undo, redo, deleteSelected])

    // --- Fit to screen ---

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function fitToScreen(canvas?: any, zones?: CanvasZones | null) {
      const c = canvas || canvasRef.current
      const z = zones || zonesRef.current
      if (!c || !z) return

      const container = canvasElRef.current?.parentElement
      if (!container) return

      const containerWidth = container.clientWidth - 40 // padding
      const containerHeight = container.clientHeight - 40

      const canvasWidth = z.bleedPx.width
      const canvasHeight = z.bleedPx.height

      const scaleX = containerWidth / canvasWidth
      const scaleY = containerHeight / canvasHeight
      const newZoom = Math.min(scaleX, scaleY, 1)

      // Center the canvas
      const vpWidth = containerWidth
      const vpHeight = containerHeight
      const offsetX = (vpWidth - canvasWidth * newZoom) / 2
      const offsetY = (vpHeight - canvasHeight * newZoom) / 2

      c.setViewportTransform([newZoom, 0, 0, newZoom, offsetX, offsetY])
      setZoom(newZoom)
    }

    // --- Zoom controls ---

    const zoomIn = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const center = canvas.getCenterPoint()
      const newZoom = Math.min(canvas.getZoom() + ZOOM_STEP, MAX_ZOOM)
      canvas.zoomToPoint(center, newZoom)
      setZoom(newZoom)
    }, [])

    const zoomOut = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const center = canvas.getCenterPoint()
      const newZoom = Math.max(canvas.getZoom() - ZOOM_STEP, MIN_ZOOM)
      canvas.zoomToPoint(center, newZoom)
      setZoom(newZoom)
    }, [])

    const zoomFit = useCallback(() => {
      fitToScreen()
    }, [])

    // --- Add methods ---

    const addText = useCallback(
      (options?: Record<string, unknown>) => {
        const fabric = fabricRef.current
        const canvas = canvasRef.current
        const zones = zonesRef.current
        if (!fabric || !canvas || !zones) return

        saveState()

        const text = new fabric.IText('Edit this text', {
          left: zones.safePx.left + zones.safePx.width / 2,
          top: zones.safePx.top + zones.safePx.height / 2,
          originX: 'center',
          originY: 'center',
          fontFamily: 'Inter',
          fontSize: 24,
          fill: '#000000',
          ...options,
        })

        canvas.add(text)
        canvas.setActiveObject(text)
        canvas.renderAll()
        onCanvasModified?.()
      },
      [saveState, onCanvasModified]
    )

    const addImage = useCallback(
      async (url: string, options?: Record<string, unknown>) => {
        const fabric = fabricRef.current
        const canvas = canvasRef.current
        const zones = zonesRef.current
        if (!fabric || !canvas || !zones) return null

        saveState()

        return new Promise((resolve) => {
          const imgElement = new Image()
          imgElement.crossOrigin = 'anonymous'
          imgElement.onload = () => {
            const fabricImage = new fabric.FabricImage(imgElement, {
              left: zones.safePx.left + zones.safePx.width / 2,
              top: zones.safePx.top + zones.safePx.height / 2,
              originX: 'center',
              originY: 'center',
              ...options,
            })

            // Scale to max 300px on largest dimension
            const maxDim = 300
            const imgWidth = fabricImage.width || 1
            const imgHeight = fabricImage.height || 1
            const scaleFactor = Math.min(maxDim / imgWidth, maxDim / imgHeight, 1)
            fabricImage.scale(scaleFactor)

            canvas.add(fabricImage)
            canvas.setActiveObject(fabricImage)
            canvas.renderAll()
            onCanvasModified?.()
            resolve(fabricImage)
          }
          imgElement.onerror = () => resolve(null)
          imgElement.src = url
        })
      },
      [saveState, onCanvasModified]
    )

    const addShape = useCallback(
      (type: 'rect' | 'circle' | 'line', options?: Record<string, unknown>) => {
        const fabric = fabricRef.current
        const canvas = canvasRef.current
        const zones = zonesRef.current
        if (!fabric || !canvas || !zones) return

        saveState()

        const centerX = zones.safePx.left + zones.safePx.width / 2
        const centerY = zones.safePx.top + zones.safePx.height / 2

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let shape: any

        switch (type) {
          case 'rect':
            shape = new fabric.Rect({
              left: centerX,
              top: centerY,
              originX: 'center',
              originY: 'center',
              width: 120,
              height: 80,
              fill: '#3b82f6',
              stroke: '#1d4ed8',
              strokeWidth: 2,
              rx: 0,
              ry: 0,
              ...options,
            })
            break

          case 'circle':
            shape = new fabric.Circle({
              left: centerX,
              top: centerY,
              originX: 'center',
              originY: 'center',
              radius: 50,
              fill: '#22c55e',
              stroke: '#15803d',
              strokeWidth: 2,
              ...options,
            })
            break

          case 'line':
            shape = new fabric.Line(
              [centerX - 60, centerY, centerX + 60, centerY],
              {
                stroke: '#000000',
                strokeWidth: 3,
                ...options,
              }
            )
            break
        }

        if (shape) {
          canvas.add(shape)
          canvas.setActiveObject(shape)
          canvas.renderAll()
          onCanvasModified?.()
        }
      },
      [saveState, onCanvasModified]
    )

    // --- Imperative handle ---

    useImperativeHandle(
      ref,
      () => ({
        getCanvas: () => canvasRef.current,
        addText,
        addImage,
        addShape,
        undo,
        redo,
        saveJSON: () => {
          if (!canvasRef.current) return {}
          return getCanvasJSON(canvasRef.current)
        },
        loadJSON: (json: Record<string, unknown>) => {
          if (!canvasRef.current) return
          loadCanvasJSON(canvasRef.current, json, () => {
            saveState()
          })
        },
        exportImage: (format: string = 'png') => {
          if (!canvasRef.current) return ''
          return canvasRef.current.toDataURL({
            format,
            quality: 1,
            multiplier: 1,
          })
        },
        zoomIn,
        zoomOut,
        zoomFit,
        deleteSelected,
      }),
      [addText, addImage, addShape, undo, redo, zoomIn, zoomOut, zoomFit, deleteSelected, saveState]
    )

    return (
      <div className={cn('relative flex-1 overflow-hidden bg-muted/50', className)}>
        {/* Zoom controls */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={zoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={zoomIn}
            title="Zoom In"
          >
            <ZoomIn className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={zoomFit}
            title="Fit to Screen"
          >
            <Maximize className="size-3.5" />
          </Button>
        </div>

        {/* Canvas status */}
        {!isReady && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">Initializing canvas...</span>
            </div>
          </div>
        )}

        {/* Canvas element */}
        <div className="flex h-full w-full items-center justify-center p-5">
          <canvas ref={canvasElRef} />
        </div>
      </div>
    )
  }
)

DesignerCanvasInner.displayName = 'DesignerCanvasInner'

export { DesignerCanvasInner }
export type { DesignerCanvasProps }
