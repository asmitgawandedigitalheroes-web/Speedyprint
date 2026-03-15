/**
 * HistoryPlugin — Undo/redo state management for the canvas.
 * Ported from DesignerCanvas.tsx lines ~65-131.
 */

import type { Canvas as FabricCanvas } from 'fabric'
import { getCanvasJSON, loadCanvasJSON, isZoneGuide } from '../canvas-utils'
import { useEditorStore } from '../store'
import type { IPluginTempl, IEditor, IShortcut } from '../types'

const MAX_HISTORY = 50

export class HistoryPlugin implements IPluginTempl {
  pluginName = 'HistoryPlugin'
  canvas: FabricCanvas
  editor: IEditor

  private undoStack: string[] = []
  private redoStack: string[] = []
  private isUndoRedo = false
  private isEnabled = true

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  setup(): void {
    // Listen to canvas events that should trigger state saves
    this.canvas.on('object:modified', this._onModified)
    this.canvas.on('object:added', this._onAdded)
    this.canvas.on('object:removed', this._onRemoved)

    // Save initial state
    this.saveState()
  }

  destroy(): void {
    this.canvas.off('object:modified', this._onModified)
    this.canvas.off('object:added', this._onAdded)
    this.canvas.off('object:removed', this._onRemoved)
    this.undoStack = []
    this.redoStack = []
  }

  // --- Event handlers ---

  private _onModified = (): void => {
    if (!this.isUndoRedo) {
      this.saveState()
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _onAdded = (e: any): void => {
    if (!this.isUndoRedo && e.target && !isZoneGuide(e.target) && e.target.name !== '__print_bg') {
      // Don't save state for zone guides being re-added
      this.saveState()
    }
  }

  private _onRemoved = (): void => {
    if (!this.isUndoRedo) {
      this.saveState()
    }
  }

  // --- Public API ---

  /**
   * Save current canvas state to the undo stack.
   */
  saveState(): void {
    if (this.isUndoRedo || !this.isEnabled) return

    const json = JSON.stringify(getCanvasJSON(this.canvas))

    // Avoid duplicate consecutive states
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === json) {
      return
    }

    this.undoStack.push(json)
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift()
    }

    // Clear redo stack on new action
    this.redoStack = []
    this._updateStoreState()
  }

  /**
   * Undo the last action.
   */
  async undo(): Promise<void> {
    if (this.undoStack.length === 0) return

    this.isUndoRedo = true

    try {
      // Save current state to redo stack
      const currentState = JSON.stringify(getCanvasJSON(this.canvas))
      this.redoStack.push(currentState)

      // Restore previous state
      const prevState = this.undoStack.pop()!
      const json = JSON.parse(prevState)
      await loadCanvasJSON(this.canvas, json)
      this.canvas.renderAll()
    } finally {
      this.isUndoRedo = false
      this._updateStoreState()
      this.editor.emit('history:changed', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
      })
    }
  }

  /**
   * Redo the last undone action.
   */
  async redo(): Promise<void> {
    if (this.redoStack.length === 0) return

    this.isUndoRedo = true

    try {
      // Save current state to undo stack
      const currentState = JSON.stringify(getCanvasJSON(this.canvas))
      this.undoStack.push(currentState)

      // Restore next state
      const nextState = this.redoStack.pop()!
      const json = JSON.parse(nextState)
      await loadCanvasJSON(this.canvas, json)
      this.canvas.renderAll()
    } finally {
      this.isUndoRedo = false
      this._updateStoreState()
      this.editor.emit('history:changed', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
      })
    }
  }

  /**
   * Whether undo is available.
   */
  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * Whether redo is available.
   */
  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * Check if an undo/redo operation is currently in progress.
   */
  isInProgress(): boolean {
    return this.isUndoRedo
  }

  /**
   * Temporarily disable history recording (e.g., during bulk operations).
   */
  disable(): void {
    this.isEnabled = false
  }

  /**
   * Re-enable history recording.
   */
  enable(): void {
    this.isEnabled = true
  }

  /**
   * Clear all history.
   */
  clear(): void {
    this.undoStack = []
    this.redoStack = []
    this._updateStoreState()
  }

  getShortcuts(): IShortcut[] {
    return [
      {
        keys: 'ctrl+z',
        label: 'Undo',
        action: () => this.undo(),
        group: 'History',
      },
      {
        keys: 'ctrl+y',
        label: 'Redo',
        action: () => this.redo(),
        group: 'History',
      },
    ]
  }

  // --- Private ---

  private _updateStoreState(): void {
    const store = useEditorStore.getState()
    store.setCanUndo(this.canUndo())
    store.setCanRedo(this.canRedo())
  }
}
