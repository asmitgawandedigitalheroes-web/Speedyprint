/**
 * Zustand store for the design canvas editor state.
 * Provides reactive state that React components can subscribe to,
 * while the Editor + plugins handle the actual canvas operations.
 */

import { create } from 'zustand'
import type { FabricObject } from 'fabric'
import type { IEditor, IContextMenuItem, SelectMode } from './types'

export interface EditorState {
  // Core references
  editor: IEditor | null
  // Selection
  activeObjects: FabricObject[]
  // Canvas state
  selectMode: SelectMode
  zoom: number
  canUndo: boolean
  canRedo: boolean
  isDirty: boolean
  isReady: boolean
  // Context menu
  contextMenu: {
    x: number
    y: number
    items: IContextMenuItem[]
  } | null
  // Mouse position (for status bar)
  mousePosition: { x: number; y: number } | null
  // Canvas dimensions (for status bar)
  canvasDimensions: { width: number; height: number } | null
  // Panels
  showRulers: boolean
  showGrid: boolean
  showLeftPanel: boolean
  showRightPanel: boolean
}

export interface EditorActions {
  // Core
  setEditor: (editor: IEditor | null) => void
  // Selection
  setActiveObjects: (objs: FabricObject[]) => void
  // Canvas state
  setSelectMode: (mode: SelectMode) => void
  setZoom: (zoom: number) => void
  setCanUndo: (canUndo: boolean) => void
  setCanRedo: (canRedo: boolean) => void
  setIsDirty: (dirty: boolean) => void
  setIsReady: (ready: boolean) => void
  // Context menu
  setContextMenu: (menu: EditorState['contextMenu']) => void
  closeContextMenu: () => void
  // Mouse
  setMousePosition: (pos: { x: number; y: number } | null) => void
  // Canvas dimensions
  setCanvasDimensions: (dims: { width: number; height: number } | null) => void
  // Panels
  toggleRulers: () => void
  toggleGrid: () => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  // Reset
  reset: () => void
}

const initialState: EditorState = {
  editor: null,
  activeObjects: [],
  selectMode: 'default',
  zoom: 1,
  canUndo: false,
  canRedo: false,
  isDirty: false,
  isReady: false,
  contextMenu: null,
  mousePosition: null,
  canvasDimensions: null,
  showRulers: false,
  showGrid: false,
  showLeftPanel: true,
  showRightPanel: true,
}

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  ...initialState,

  // Core
  setEditor: (editor) => set({ editor }),

  // Selection
  setActiveObjects: (objs) => set({ activeObjects: objs }),

  // Canvas state
  setSelectMode: (mode) => set({ selectMode: mode }),
  setZoom: (zoom) => set({ zoom }),
  setCanUndo: (canUndo) => set({ canUndo }),
  setCanRedo: (canRedo) => set({ canRedo }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setIsReady: (ready) => set({ isReady: ready }),

  // Context menu
  setContextMenu: (menu) => set({ contextMenu: menu }),
  closeContextMenu: () => set({ contextMenu: null }),

  // Mouse
  setMousePosition: (pos) => set({ mousePosition: pos }),

  // Canvas dimensions
  setCanvasDimensions: (dims) => set({ canvasDimensions: dims }),

  // Panels
  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleLeftPanel: () => set((s) => ({ showLeftPanel: !s.showLeftPanel })),
  toggleRightPanel: () => set((s) => ({ showRightPanel: !s.showRightPanel })),

  // Reset
  reset: () => set(initialState),
}))
