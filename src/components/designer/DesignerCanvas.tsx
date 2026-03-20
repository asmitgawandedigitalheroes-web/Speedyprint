'use client'

// Top-level import is safe: this file is only loaded via next/dynamic with ssr:false,
// so it never executes on the server. This eliminates the async gap from
// `await import('fabric')` that caused React Strict Mode to cancel initialization.
import * as fabric from 'fabric'

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
import { getCanvasJSON, loadCanvasJSON, getSafeZoneCenter, hideZoneGuides, showZoneGuides } from '@/lib/designer/canvas-utils'
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
    const [initError, setInitError] = useState<string | null>(null)
    const [artboardLocked, setArtboardLocked] = useState(false)

    const zoom = useEditorStore((s) => s.zoom)
    const isReady = useEditorStore((s) => s.isReady)

    // --- Initialize Fabric Canvas + Editor ---

    // Reset store on every mount so Fast Refresh doesn't leave stale isReady=true
    // with no actual canvas underneath.
    useEffect(() => {
      useEditorStore.getState().reset()
    }, [])

    useEffect(() => {
      let mounted = true
      let containerRo: ResizeObserver | null = null

      async function initFabric() {
        try {
          if (!mounted || !canvasElRef.current) return

          // Load Google Fonts before initializing canvas
          loadGoogleFonts(GOOGLE_FONTS)

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

          // Guard: React Strict Mode cleanup may have fired and disposed the canvas
          // during the awaits above. Abort before touching the now-invalid canvas.
          if (!mounted) return

          // Initialize zones
          const zonePlugin = editor.getPlugin<ZonePlugin>('ZonePlugin')
          const zones = zonePlugin.initZones(fabric, template)

          // Configure snap plugin
          const snapPlugin = editor.getPlugin<SnapPlugin>('SnapPlugin')
          snapPlugin.setZonesAndFabric(zones, fabric)
          snapPlugin.setLockedZones(zonePlugin.getLockedZones())

          // Configure zoom plugin
          const zoomPlugin = editor.getPlugin<ZoomPlugin>('ZoomPlugin')
          zoomPlugin.setZones(zones)
          if (containerRef.current) {
            zoomPlugin.setContainer(containerRef.current)
          }

          // Resize canvas HTML element to fill the container so the viewport
          // transform can zoom/pan the design content within the full viewport.
          // initializeCanvas() sets canvas to design dimensions (e.g. 393×204) —
          // we override that here so the canvas IS the viewport.
          if (containerRef.current) {
            const { clientWidth: cw, clientHeight: ch } = containerRef.current
            if (cw > 0 && ch > 0) {
              canvas.setDimensions({ width: cw, height: ch })
              // Fit immediately — canvas dimensions are now correct
              zoomPlugin.zoomToFit()
            }
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

          // Guard: if this effect run was superseded (e.g. React Strict Mode double-invoke
          // ran the cleanup, disposing the canvas), abort before touching shared store.
          if (!mounted) return

          // Set store references first so toolbar becomes active
          const store = useEditorStore.getState()
          store.setEditor(editor)
          store.setIsReady(true)

          // Second fit after React re-renders and browser paints the final layout.
          // Handles cases where the container size wasn't fully settled at init time.
          requestAnimationFrame(() => {
            if (!mounted) return
            if (containerRef.current) {
              const { clientWidth: cw, clientHeight: ch } = containerRef.current
              if (cw > 0 && ch > 0) {
                canvas.setDimensions({ width: cw, height: ch })
                zoomPlugin.zoomToFit()
              }
            }
          })

          // Use ResizeObserver to keep canvas HTML dimensions synced with the container
          // and call zoomToFit whenever the container resizes (initial load + panel toggles).
          if (containerRef.current) {
            containerRo = new ResizeObserver((entries) => {
              const entry = entries[0]
              if (!entry || !mounted) return
              const { width, height } = entry.contentRect
              if (width > 0 && height > 0) {
                canvas.setDimensions({ width, height })
                zoomPlugin.zoomToFit()
              }
            })
            containerRo.observe(containerRef.current)
          }
          store.setCanvasDimensions({
            width: zones.bleedPx.width,
            height: zones.bleedPx.height,
          })
        } catch (err) {
          console.error('[DesignerCanvas] initFabric failed:', err)
          if (mounted) {
            setInitError(err instanceof Error ? err.message : String(err))
          }
        }
      }

      initFabric()

      return () => {
        mounted = false
        containerRo?.disconnect()
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
      async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)

        const files = e.dataTransfer?.files
        if (!files || files.length === 0) return

        const file = files[0]
        const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf']
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        const validExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf']
        if (!validTypes.includes(file.type) && !validExts.includes(ext)) return

        // PDFs: route through ImportPlugin (renders first page as canvas image)
        const isPdf = file.type === 'application/pdf' || ext === '.pdf'
        if (isPdf) {
          const editor = editorRef.current
          if (!editor) return
          const plugin = editor.getPlugin<{ importFile: (f: File) => Promise<void> }>('ImportPlugin')
          if (plugin) await plugin.importFile(file)
          return
        }

        // Images: use smartUpload (local for small files, CDN for large)
        const { smartUpload } = await import('@/lib/upload')
        const url = await smartUpload(file)
        addImageInternal(url)
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
            const { x: imgCx, y: imgCy } = getSafeZoneCenter(canvas, zones)
            const fabricImage = new fabric.FabricImage(imgElement, {
              left: imgCx,
              top: imgCy,
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

          const { x: cx, y: cy } = getSafeZoneCenter(canvas, zones)

          const text = new fabric.IText('Edit this text', {
            left: cx,
            top: cy,
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

          const { x: centerX, y: centerY } = getSafeZoneCenter(canvas, zones)

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
          // Hide zone guides so they don't appear in exports
          const hidden = hideZoneGuides(canvasRef.current)
          const dataUrl = canvasRef.current.toDataURL({
            format,
            quality: 1,
            multiplier: 1,
          })
          showZoneGuides(hidden)
          canvasRef.current.renderAll()
          return dataUrl
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
        {/* Artboard lock/unlock button */}
        <div className="absolute top-3 left-3 z-10">
          <button
            type="button"
            title={artboardLocked ? 'Unlock artboard to move it' : 'Lock artboard in place'}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors',
              artboardLocked
                ? 'bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                : 'bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100'
            )}
            onClick={() => {
              const editor = editorRef.current
              if (!editor) return
              const zonePlugin = editor.getPlugin<ZonePlugin>('ZonePlugin')
              zonePlugin.toggleArtboardLock()
              setArtboardLocked(zonePlugin.isArtboardLocked())
            }}
          >
            {artboardLocked ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Locked
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                Unlocked — drag to move
              </>
            )}
          </button>
        </div>

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

        {/* Canvas error */}
        {initError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/90">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/50 bg-background p-6 text-center max-w-md">
              <span className="text-sm font-semibold text-destructive">Canvas failed to initialize</span>
              <span className="text-xs text-muted-foreground break-all">{initError}</span>
              <button
                className="text-xs underline text-primary"
                onClick={() => { setInitError(null); window.location.reload() }}
              >
                Reload page
              </button>
            </div>
          </div>
        )}

        {/* Canvas status */}
        {!isReady && !initError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">Initializing canvas...</span>
            </div>
          </div>
        )}

        {/* Canvas element — fills container; viewport transform handles zoom/pan */}
        <canvas ref={canvasElRef} />
      </div>
    )
  }
)

DesignerCanvasInner.displayName = 'DesignerCanvasInner'

export { DesignerCanvasInner }
export type { DesignerCanvasProps }
