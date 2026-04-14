'use client'

import { create } from 'zustand'
import { Point } from 'fabric'
import type { Canvas as FabricCanvas, FabricObject } from 'fabric'
import type { ProductTemplate, Design } from '@/types'

export type LeftPanelTab = 'material' | 'template' | 'text' | 'draw' | 'add' | 'my' | 'ai' | 'layers' | 'bulk' | 'complete' | null

export interface HistoryEntry {
  json: string
  timestamp: number
}

/** Computed canvas dimensions from a template (mm → px at given DPI) */
export interface CanvasDimensions {
  widthPx: number
  heightPx: number
  printWidthPx: number
  printHeightPx: number
  bleedPx: number
  safeZonePx: number
  dpi: number
}

export function computeCanvasDimensions(template: ProductTemplate): CanvasDimensions {
  const dpi = template.dpi || 300
  const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi)

  const printWidthPx = mmToPx(template.print_width_mm)
  const printHeightPx = mmToPx(template.print_height_mm)
  const bleedPx = mmToPx(template.bleed_mm || 0)
  const safeZonePx = mmToPx(template.safe_zone_mm || 0)

  return {
    widthPx: printWidthPx + bleedPx * 2,
    heightPx: printHeightPx + bleedPx * 2,
    printWidthPx,
    printHeightPx,
    bleedPx,
    safeZonePx,
    dpi,
  }
}

export interface EditorState {
  // Template & Design context
  template: ProductTemplate | null
  setTemplate: (template: ProductTemplate | null) => void
  design: Design | null
  setDesign: (design: Design | null) => void
  designId: string | null
  setDesignId: (id: string | null) => void
  designName: string
  setDesignName: (name: string) => void
  canvasDimensions: CanvasDimensions | null

  // Canvas
  canvas: FabricCanvas | null
  setCanvas: (canvas: FabricCanvas | null) => void

  // Artboard dimensions (display pixels)
  artboardWidth: number
  artboardHeight: number
  setArtboardSize: (w: number, h: number) => void

  // Active object
  activeObject: FabricObject | null
  setActiveObject: (obj: FabricObject | null) => void

  // Objects list (filtered — no artboard)
  objects: FabricObject[]
  refreshObjects: () => void

  // History
  historyStack: HistoryEntry[]
  historyIndex: number
  pushHistory: (json: string) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // Zoom
  zoom: number
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  zoomToFit: () => void

  // UI State
  leftPanel: LeftPanelTab
  setLeftPanel: (tab: LeftPanelTab) => void
  showGrid: boolean
  toggleGrid: () => void
  showPrintBoundaries: boolean
  togglePrintBoundaries: () => void

  // Restoration flag (pause history during undo/redo)
  isRestoring: boolean

  // Bulk Data
  bulkData: {
    headers: string[]
    rows: Record<string, string>[]
  } | null
  setBulkData: (data: { headers: string[]; rows: Record<string, string>[] } | null) => void

  // Loading
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Drawing
  isDrawingMode: boolean
  setDrawingMode: (enabled: boolean) => void
  brushColor: string
  setBrushColor: (color: string) => void
  brushWidth: number
  setBrushWidth: (width: number) => void

  // Save Status
  saveStatus: 'unsaved' | 'saving' | 'saved'
  setSaveStatus: (status: 'unsaved' | 'saving' | 'saved') => void
}

const MAX_HISTORY = 50
const ZOOM_STEP = 0.1
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

export const useEditorStore = create<EditorState>((set, get) => ({
  // Template & Design context
  template: null,
  setTemplate: (template) =>
    set({
      template,
      canvasDimensions: template ? computeCanvasDimensions(template) : null,
    }),
  design: null,
  setDesign: (design) => set({ design }),
  designId: null,
  setDesignId: (id) => set({ designId: id }),
  designName: 'Untitled Design',
  setDesignName: (name) => set({ designName: name }),
  canvasDimensions: null,

  // Canvas
  canvas: null,
  setCanvas: (canvas) => set({ canvas }),

  // Artboard
  artboardWidth: 800,
  artboardHeight: 600,
  setArtboardSize: (w, h) => set({ artboardWidth: w, artboardHeight: h }),

  // Active object
  activeObject: null,
  setActiveObject: (obj) => set({ activeObject: obj }),

  // Objects — filter out artboard rect
  objects: [],
  refreshObjects: () => {
    const { canvas } = get()
    if (!canvas) return
    const objs = canvas
      .getObjects()
      .filter((o) => {
        const meta = o as unknown as Record<string, unknown>
        return !meta.isArtboard && !meta.isGuide
      })
      .slice()
    set({ objects: objs })
  },

  // History
  historyStack: [],
  historyIndex: -1,
  pushHistory: (json: string) => {
    const { historyStack, historyIndex } = get()
    const newStack = historyStack.slice(0, historyIndex + 1)
    newStack.push({ json, timestamp: Date.now() })
    if (newStack.length > MAX_HISTORY) {
      newStack.shift()
    }
    set({
      historyStack: newStack,
      historyIndex: newStack.length - 1,
    })
  },
  undo: () => {
    const { canvas, historyStack, historyIndex } = get()
    if (!canvas || historyIndex <= 0) return
    const newIndex = historyIndex - 1
    const entry = historyStack[newIndex]
    if (!entry) return
    set({ isRestoring: true })
    canvas.loadFromJSON(JSON.parse(entry.json)).then(() => {
      // The artboard is always the first object — re-mark and re-lock it after JSON restore
      // selectable/evented may not survive loadFromJSON, so explicitly reset them
      const objs = canvas.getObjects()
      if (objs.length > 0) {
        const artboard = objs[0]
        ;(artboard as unknown as Record<string, unknown>).isArtboard = true
        artboard.set({ selectable: false, evented: false })
      }
      canvas.renderAll()
      set({ historyIndex: newIndex, isRestoring: false })
      get().refreshObjects()
      get().setActiveObject(null)
    })
  },
  redo: () => {
    const { canvas, historyStack, historyIndex } = get()
    if (!canvas || historyIndex >= historyStack.length - 1) return
    const newIndex = historyIndex + 1
    const entry = historyStack[newIndex]
    if (!entry) return
    set({ isRestoring: true })
    canvas.loadFromJSON(JSON.parse(entry.json)).then(() => {
      // The artboard is always the first object — re-mark and re-lock it after JSON restore
      // selectable/evented may not survive loadFromJSON, so explicitly reset them
      const objs = canvas.getObjects()
      if (objs.length > 0) {
        const artboard = objs[0]
        ;(artboard as unknown as Record<string, unknown>).isArtboard = true
        artboard.set({ selectable: false, evented: false })
      }
      canvas.renderAll()
      set({ historyIndex: newIndex, isRestoring: false })
      get().refreshObjects()
      get().setActiveObject(null)
    })
  },
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().historyStack.length - 1,

  // Zoom — always re-centers artboard using setCenterFromObject approach
  zoom: 1,
  setZoom: (zoom) => {
    const { canvas } = get()
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
    if (canvas) {
      const artboard = canvas.getObjects().find(
        (o) => (o as unknown as Record<string, unknown>).isArtboard
      )
      if (artboard) {
        // setCenterFromObject: position artboard center at viewport center
        const objCenter = artboard.getCenterPoint()
        const vpt = canvas.viewportTransform
        if (vpt) {
          vpt[0] = clamped
          vpt[3] = clamped
          vpt[4] = (canvas.getWidth() / 2) - (objCenter.x * clamped)
          vpt[5] = (canvas.getHeight() / 2) - (objCenter.y * clamped)
          canvas.setViewportTransform(vpt)
        }
      } else {
        // Fallback: zoom from viewport center
        const center = new Point(canvas.getWidth() / 2, canvas.getHeight() / 2)
        canvas.zoomToPoint(center, clamped)
      }
    }
    set({ zoom: clamped })
  },
  zoomIn: () => {
    const { zoom } = get()
    const newZoom = Math.round((zoom + ZOOM_STEP) * 100) / 100
    get().setZoom(newZoom)
  },
  zoomOut: () => {
    const { zoom } = get()
    const newZoom = Math.round((zoom - ZOOM_STEP) * 100) / 100
    get().setZoom(newZoom)
  },
  zoomToFit: () => {
    const { canvas, artboardWidth, artboardHeight } = get()
    if (!canvas) return
    const containerW = canvas.getWidth()
    const containerH = canvas.getHeight()

    const padding = 0.85
    const fitZoom = Math.min(
      (containerW * padding) / artboardWidth,
      (containerH * padding) / artboardHeight
    )

    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitZoom))
    get().setZoom(clamped)
  },

  // UI
  leftPanel: null,
  setLeftPanel: (tab) => set({ leftPanel: tab }),
  showGrid: false,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  showPrintBoundaries: true,
  togglePrintBoundaries: () => set((s) => ({ showPrintBoundaries: !s.showPrintBoundaries })),

  // Restoration flag
  isRestoring: false,

  // Bulk Data
  bulkData: null,
  setBulkData: (data) => set({ bulkData: data }),

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Drawing
  isDrawingMode: false,
  setDrawingMode: (enabled) => {
    const { canvas } = get()
    if (canvas) {
      canvas.isDrawingMode = enabled
      // If we enable drawing mode, we should discard active selection
      if (enabled) {
        canvas.discardActiveObject()
        canvas.requestRenderAll()
      }
    }
    set({ isDrawingMode: enabled })
  },
  brushColor: '#000000',
  setBrushColor: (color) => {
    const { canvas } = get()
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color
    }
    set({ brushColor: color })
  },
  brushWidth: 5,
  setBrushWidth: (width) => {
    const { canvas } = get()
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = width
    }
    set({ brushWidth: width })
  },

  // Save Status
  saveStatus: 'saved',
  setSaveStatus: (status) => set({ saveStatus: status }),
}))
