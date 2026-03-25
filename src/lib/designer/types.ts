/**
 * Core type definitions for the Speedy Labels Design Canvas plugin architecture.
 * Adapted from vue-fabric-editor's plugin system for React/Fabric.js v7.
 */

import type { Canvas as FabricCanvas, FabricObject } from 'fabric'

// --- Editor Interface ---

export interface IEditor {
  canvas: FabricCanvas
  /** Register a plugin with the editor */
  use(plugin: IPluginClass): Promise<void>
  /** Get a registered plugin by name */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPlugin<T = any>(name: string): T
  /** Check if a plugin is registered */
  hasPlugin(name: string): boolean
  /** Emit an event to all listeners */
  emit(event: string, ...args: unknown[]): void
  /** Subscribe to an event */
  on(event: string, handler: (...args: unknown[]) => void): void
  /** Unsubscribe from an event */
  off(event: string, handler: (...args: unknown[]) => void): void
  /** Destroy the editor and all plugins */
  destroy(): void
  /** Collect context menu items from all plugins */
  getContextMenuItems(): IContextMenuItem[]
  /** Collect keyboard shortcuts from all plugins */
  getShortcuts(): IShortcut[]
}

// --- Plugin Interfaces ---

export interface IPluginTempl {
  /** Unique plugin name (used for registration and lookup) */
  pluginName: string
  /** Reference to the Fabric canvas */
  canvas: FabricCanvas
  /** Reference to the editor */
  editor: IEditor
  /** Called after plugin is instantiated — perform async setup here */
  setup?(editor: IEditor): void | Promise<void>
  /** Called when editor is destroyed — clean up listeners, timers, etc. */
  destroy?(): void
  /** Return context menu items contributed by this plugin */
  getContextMenuItems?(): IContextMenuItem[]
  /** Return keyboard shortcuts contributed by this plugin */
  getShortcuts?(): IShortcut[]
}

export type IPluginClass = new (
  canvas: FabricCanvas,
  editor: IEditor
) => IPluginTempl

// --- Context Menu ---

export interface IContextMenuItem {
  label: string
  icon?: string // Lucide icon name
  shortcut?: string
  action: () => void
  disabled?: boolean
  separator?: boolean
  /** Group name for organizing items */
  group?: string
}

// --- Keyboard Shortcuts ---

export interface IShortcut {
  /** Key combo, e.g. 'ctrl+z', 'delete', 'shift+ctrl+g' */
  keys: string
  /** Human-readable label */
  label: string
  /** Handler function */
  action: () => void
  /** Whether shortcut should work when editing text */
  allowInTextEdit?: boolean
  /** Group name for the shortcuts help dialog */
  group?: string
}

// --- Selection ---

export type SelectMode =
  | 'default'
  | 'free-draw'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'polygon'

export interface SelectEvent {
  selected: FabricObject[]
  deselected: FabricObject[]
}

// --- Canvas Events ---

export type EditorEventMap = {
  // Selection
  'canvas:selection:created': [{ selected: FabricObject[] }]
  'canvas:selection:updated': [{ selected: FabricObject[] }]
  'canvas:selection:cleared': []
  // Object lifecycle
  'canvas:object:added': [FabricObject]
  'canvas:object:removed': [FabricObject]
  'canvas:object:modified': [FabricObject]
  // History
  'history:changed': [{ canUndo: boolean; canRedo: boolean }]
  // Zoom
  'canvas:zoom:changed': [number]
  // Mode
  'mode:changed': [SelectMode]
  // Context menu
  'contextMenu:collect': [IContextMenuItem[]]
  // Dirty state
  'canvas:dirty': []
  // Save request
  'canvas:save': []
  // Generic
  [key: string]: unknown[]
}

// --- Ruler/Guideline ---

export interface Guideline {
  id: string
  orientation: 'horizontal' | 'vertical'
  position: number
}

// --- Grid ---

export interface GridOptions {
  enabled: boolean
  spacing: number
  style: 'dots' | 'lines'
  snapToGrid: boolean
  color: string
  opacity: number
}
