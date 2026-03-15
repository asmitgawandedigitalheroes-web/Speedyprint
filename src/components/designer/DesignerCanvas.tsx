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
import { getCanvasJSON, loadCanvasJSON } from '@/lib/designer/canvas-utils'
import { loadGoogleFonts, GOOGLE_FONTS } from '@/lib/designer/fonts'
import { cn } from '@/lib/utils'
import { Editor } from '@/lib/designer/editor'
import { useEditorStore } from '@/lib/designer/store'
import {
  HistoryPlugin,
  CopyPastePlugin,
  ZoomPlugin,
  ZonePlugin,
  SnapPlugin,
  KeyboardPlugin,
  ContextMenuPlugin,
  GroupPlugin,
  AlignPlugin,
  FlipPlugin,
  GridPlugin,
  TextPlugin,
  RulerPlugin,
  GuidelinePlugin,
  QRCodePlugin,
  BarcodePlugin,
  ShapePlugin,
  ImagePlugin,
  ExportPlugin,
  ImportPlugin,
  WatermarkPlugin,
} from '@/lib/designer/plugins'

// --- Types ---

interface DesignerCanvasProps {
  template: ProductTemplate
  initialJson?: Record<string, unknown> | null
  onSelectionChange?: (obj: unknown | null) => void
  onCanvasModified?: () => void
  onSaveRequested?: () => void
  className?: string
}

// --- Component ---

const DesignerCanvasInner = forwardRef<DesignerCanvasRef, DesignerCanvasProps>(
  function DesignerCanvasInner(
    { template, initialJson, onSelectionChange, onCanvasModified, onSaveRequested, className },
    ref
  ) {
    const canvasElRef = useRef<HTMLCanvasElement>(null)
    const editorRef = useRef<Editor | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvasRef = useRef<any>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fabricRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isDragOver, setIsDragOver] = useState(false)

    const zoom = useEditorStore((s) => s.zoom)
    const isReady = useEditorStore((s) => s.isReady)

    // --- Initialize Fabric Canvas + Editor ---

    useEffect(() => {
      let mounted = true

      async function initFabric() {
        try {
          // Load Google Fonts before initializing canvas
          loadGoogleFonts(GOOGLE_FONTS)

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

          // --- Create Editor & Register Plugins ---
          const editor = new Editor(canvas)
          editorRef.current = editor

          // Register core plugins
          await editor.use(HistoryPlugin)
          await editor.use(CopyPastePlugin)
          await editor.use(ZoomPlugin)
          await editor.use(ZonePlugin)
          await editor.use(SnapPlugin)
          await editor.use(KeyboardPlugin)
          await editor.use(ContextMenuPlugin)

          // Register Phase 4-10 plugins
          await editor.use(GroupPlugin)
          await editor.use(AlignPlugin)
          await editor.use(FlipPlugin)
          await editor.use(GridPlugin)
          await editor.use(TextPlugin)
          await editor.use(RulerPlugin)
          await editor.use(GuidelinePlugin)
          await editor.use(QRCodePlugin)
          await editor.use(BarcodePlugin)
          await editor.use(ShapePlugin)
          await editor.use(ImagePlugin)
          await editor.use(ExportPlugin)
          await editor.use(ImportPlugin)
          await editor.use(WatermarkPlugin)

          // Initialize zones
          const zonePlugin = editor.getPlugin<ZonePlugin>('ZonePlugin')
          const zones = zonePlugin.initZones(fabric, template)

          // Configure snap plugin
          const snapPlugin = editor.getPlugin<SnapPlugin>('SnapPlugin')
          snapPlugin.setZonesAndFabric(zones, fabric)

          // Configure zoom plugin
          const zoomPlugin = editor.getPlugin<ZoomPlugin>('ZoomPlugin')
          zoomPlugin.setZones(zones)
          if (containerRef.current) {
            zoomPlugin.setContainer(containerRef.current)
          }

          // --- Canvas Event Handlers ---

          // Selection events → notify React
          canvas.on('selection:created', (e: { selected?: unknown[] }) => {
            onSelectionChange?.(e.selected?.[0] ?? null)
            const store = useEditorStore.getState()
            store.setActiveObjects((e.selected ?? []) as import('fabric').FabricObject[])
          })

          canvas.on('selection:updated', (e: { selected?: unknown[] }) => {
            onSelectionChange?.(e.selected?.[0] ?? null)
            const store = useEditorStore.getState()
            store.setActiveObjects((e.selected ?? []) as import('fabric').FabricObject[])
          })

          canvas.on('selection:cleared', () => {
            onSelectionChange?.(null)
            const store = useEditorStore.getState()
            store.setActiveObjects([])
          })

          // Object modification → mark dirty
          canvas.on('object:modified', () => {
            onCanvasModified?.()
          })

          canvas.on('object:added', () => {
            const history = editor.getPlugin<HistoryPlugin>('HistoryPlugin')
            if (!history.isInProgress()) {
              onCanvasModified?.()
            }
          })

          canvas.on('object:removed', () => {
            const history = editor.getPlugin<HistoryPlugin>('HistoryPlugin')
            if (!history.isInProgress()) {
              onCanvasModified?.()
            }
          })

          canvas.on('text:changed', () => {
            onCanvasModified?.()
          })

          // Listen for save requests from KeyboardPlugin
          editor.on('canvas:save', () => {
            onSaveRequested?.()
          })

          // Listen for dirty events from plugins
          editor.on('canvas:dirty', () => {
            onCanvasModified?.()
          })

          // Load initial JSON if provided
          if (initialJson) {
            await loadCanvasJSON(canvas, initialJson)
            const history = editor.getPlugin<HistoryPlugin>('HistoryPlugin')
            history.saveState()
          }

          // Fit canvas to container
          zoomPlugin.zoomToFit()

          // Set store references
          const store = useEditorStore.getState()
          store.setEditor(editor)
          store.setIsReady(true)
          store.setCanvasDimensions({
            width: zones.bleedPx.width,
            height: zones.bleedPx.height,
          })
        } catch (err) {
          console.error('[DesignerCanvas] initFabric failed:', err)
        }
      }

      initFabric()

      return () => {
        mounted = false
        if (editorRef.current) {
          editorRef.current.destroy()
          editorRef.current = null
        }
        if (canvasRef.current) {
          canvasRef.current.dispose()
          canvasRef.current = null
        }
        const store = useEditorStore.getState()
        store.reset()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template])

    // --- Drag and Drop Image Upload ---

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
    }, [])

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)

        const files = e.dataTransfer?.files
        if (!files || files.length === 0) return

        const file = files[0]
        const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml']
        if (!validTypes.includes(file.type)) return

        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          addImageInternal(dataUrl)
        }
        reader.readAsDataURL(file)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    )

    // --- Internal helper for adding images ---

    const addImageInternal = useCallback(
      async (url: string, options?: Record<string, unknown>) => {
        const fabric = fabricRef.current
        const canvas = canvasRef.current
        const editor = editorRef.current
        if (!fabric || !canvas || !editor) return null

        const zonePlugin = editor.getPlugin<ZonePlugin>('ZonePlugin')
        const zones = zonePlugin.getZones()
        if (!zones) return null

        const history = editor.getPlugin<HistoryPlugin>('HistoryPlugin')
        history.saveState()

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

            const maxDim = 300
            const imgWidth = fabricImage.width || 1
            const imgHeight = fabricImage.height || 1
            const scaleFactor = Math.min(maxDim / imgWidth, maxDim / imgHeight, 1)
            fabricImage.scale(scaleFactor)

            canvas.add(fabricImage)
            canvas.setActiveObject(fabricImage)
            canvas.requestRenderAll()
            onCanvasModified?.()
            resolve(fabricImage)
          }
          imgElement.onerror = () => resolve(null)
          imgElement.src = url
        })
      },
      [onCanvasModified]
    )

    // --- Imperative handle (backward-compatible) ---

    useImperativeHandle(
      ref,
      () => ({
        getCanvas: () => canvasRef.current,
        getEditor: () => editorRef.current,
        addText: (options?: Record<string, unknown>) => {
          const fabric = fabricRef.current
          const canvas = canvasRef.current
          const editor = editorRef.current
          if (!fabric || !canvas || !editor) return

          const zonePlugin = editor.getPlugin<ZonePlugin>('ZonePlugin')
          const zones = zonePlugin.getZones()
          if (!zones) return

          const history = editor.getPlugin<HistoryPlugin>('HistoryPlugin')
          history.saveState()

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
        addImage: addImageInternal,
        addShape: (type: 'rect' | 'circle' | 'line', options?: Record<string, unknown>) => {
          const fabric = fabricRef.current
          const canvas = canvasRef.current
          const editor = editorRef.current
          if (!fabric || !canvas || !editor) return

          const zonePlugin = editor.getPlugin<ZonePlugin>('ZonePlugin')
          const zones = zonePlugin.getZones()
          if (!zones) return

          const history = editor.getPlugin<HistoryPlugin>('HistoryPlugin')
          history.saveState()

          const centerX = zones.safePx.left + zones.safePx.width / 2
          const centerY = zones.safePx.top + zones.safePx.height / 2

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let shape: any

          switch (type) {
            case 'rect':
              shape = new fabric.Rect({
                left: centerX, top: centerY,
                originX: 'center', originY: 'center',
                width: 120, height: 80,
                fill: '#3b82f6', stroke: '#1d4ed8', strokeWidth: 2,
                rx: 0, ry: 0,
                ...options,
              })
              break
            case 'circle':
              shape = new fabric.Circle({
                left: centerX, top: centerY,
                originX: 'center', originY: 'center',
                radius: 50,
                fill: '#22c55e', stroke: '#15803d', strokeWidth: 2,
                ...options,
              })
              break
            case 'line':
              shape = new fabric.Line(
                [centerX - 60, centerY, centerX + 60, centerY],
                { stroke: '#000000', strokeWidth: 3, ...options }
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
        undo: () => {
          const history = editorRef.current?.getPlugin<HistoryPlugin>('HistoryPlugin')
          history?.undo()
        },
        redo: () => {
          const history = editorRef.current?.getPlugin<HistoryPlugin>('HistoryPlugin')
          history?.redo()
        },
        saveJSON: () => {
          if (!canvasRef.current) return {}
          return getCanvasJSON(canvasRef.current)
        },
        loadJSON: async (json: Record<string, unknown>) => {
          if (!canvasRef.current) return
          await loadCanvasJSON(canvasRef.current, json)
          const history = editorRef.current?.getPlugin<HistoryPlugin>('HistoryPlugin')
          history?.saveState()
        },
        exportImage: (format: string = 'png') => {
          if (!canvasRef.current) return ''
          return canvasRef.current.toDataURL({
            format,
            quality: 1,
            multiplier: 1,
          })
        },
        zoomIn: () => {
          const zoomPlugin = editorRef.current?.getPlugin<ZoomPlugin>('ZoomPlugin')
          zoomPlugin?.zoomIn()
        },
        zoomOut: () => {
          const zoomPlugin = editorRef.current?.getPlugin<ZoomPlugin>('ZoomPlugin')
          zoomPlugin?.zoomOut()
        },
        zoomFit: () => {
          const zoomPlugin = editorRef.current?.getPlugin<ZoomPlugin>('ZoomPlugin')
          zoomPlugin?.zoomToFit()
        },
        deleteSelected: () => {
          const copyPaste = editorRef.current?.getPlugin<CopyPastePlugin>('CopyPastePlugin')
          copyPaste?.deleteSelected()
        },
      }),
      [addImageInternal, onCanvasModified]
    )

    return (
      <div
        ref={containerRef}
        className={cn(
          'relative flex-1 overflow-hidden bg-muted/50',
          isDragOver && 'ring-2 ring-primary ring-inset bg-primary/5',
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Zoom controls */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              const zoomPlugin = editorRef.current?.getPlugin<ZoomPlugin>('ZoomPlugin')
              zoomPlugin?.zoomOut()
            }}
            title="Zoom Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              const zoomPlugin = editorRef.current?.getPlugin<ZoomPlugin>('ZoomPlugin')
              zoomPlugin?.zoomIn()
            }}
            title="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              const zoomPlugin = editorRef.current?.getPlugin<ZoomPlugin>('ZoomPlugin')
              zoomPlugin?.zoomToFit()
            }}
            title="Fit to Screen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          </button>
        </div>

        {/* Drag-and-drop overlay */}
        {isDragOver && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-primary/10">
            <div className="rounded-lg border-2 border-dashed border-primary bg-background/90 px-6 py-4 text-sm font-medium text-primary">
              Drop image here
            </div>
          </div>
        )}

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
