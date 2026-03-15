/**
 * KeyboardPlugin — Centralized keyboard shortcut handler.
 * Collects shortcuts from all plugins and dispatches them.
 * Ported from DesignerCanvas.tsx keyboard handler.
 */

import type { Canvas as FabricCanvas, FabricObject } from 'fabric'
import type { IPluginTempl, IEditor, IShortcut } from '../types'

export class KeyboardPlugin implements IPluginTempl {
  pluginName = 'KeyboardPlugin'
  canvas: FabricCanvas
  editor: IEditor

  private extraShortcuts: IShortcut[] = []

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  setup(): void {
    window.addEventListener('keydown', this._onKeyDown)
  }

  destroy(): void {
    window.removeEventListener('keydown', this._onKeyDown)
  }

  /**
   * Register additional shortcuts dynamically (outside of plugin system).
   */
  registerShortcut(shortcut: IShortcut): void {
    this.extraShortcuts.push(shortcut)
  }

  /**
   * Get all registered shortcuts (from plugins + extra).
   */
  getAllShortcuts(): IShortcut[] {
    return [...this.editor.getShortcuts(), ...this.extraShortcuts]
  }

  // --- Event handler ---

  private _onKeyDown = (e: KeyboardEvent): void => {
    // Don't intercept when typing in input fields
    const target = e.target as HTMLElement
    const isTyping =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable

    // Check if user is editing text on canvas
    const activeObj = this.canvas.getActiveObject() as FabricObject & { isEditing?: boolean }
    const isEditingText = activeObj?.isEditing === true

    // Build the key combo string
    const combo = this._buildCombo(e)

    // Find matching shortcut
    const allShortcuts = this.getAllShortcuts()
    const matched = allShortcuts.find((s) => this._normalizeKeys(s.keys) === combo)

    if (!matched) {
      // Handle arrow key nudge (not a registered shortcut but built-in behavior)
      if (!isTyping && !isEditingText) {
        this._handleArrowNudge(e)
      }
      // Handle Escape
      if (e.key === 'Escape' && !isTyping) {
        e.preventDefault()
        this.canvas.discardActiveObject()
        this.canvas.requestRenderAll()
        this.editor.emit('canvas:selection:cleared')
      }
      // Handle save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        this.editor.emit('canvas:save')
      }
      return
    }

    // Skip if typing in inputs (unless shortcut allows it)
    if (isTyping && !matched.allowInTextEdit) return

    // Skip clipboard/selection shortcuts when editing text on canvas
    if (isEditingText && !matched.allowInTextEdit) {
      // Allow undo/redo even in text edit mode
      if (combo !== 'ctrl+z' && combo !== 'ctrl+y') return
    }

    e.preventDefault()
    matched.action()
  }

  /**
   * Handle arrow key nudging of selected objects.
   */
  private _handleArrowNudge(e: KeyboardEvent): void {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return

    const active = this.canvas.getActiveObject()
    if (!active) return

    e.preventDefault()

    const step = e.shiftKey ? 10 : 1

    switch (e.key) {
      case 'ArrowUp':
        active.set('top', (active.top || 0) - step)
        break
      case 'ArrowDown':
        active.set('top', (active.top || 0) + step)
        break
      case 'ArrowLeft':
        active.set('left', (active.left || 0) - step)
        break
      case 'ArrowRight':
        active.set('left', (active.left || 0) + step)
        break
    }

    active.setCoords()
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  /**
   * Build a normalized key combo string from a keyboard event.
   * Example: Ctrl+Shift+G → "ctrl+shift+g"
   */
  private _buildCombo(e: KeyboardEvent): string {
    const parts: string[] = []
    if (e.ctrlKey || e.metaKey) parts.push('ctrl')
    if (e.shiftKey) parts.push('shift')
    if (e.altKey) parts.push('alt')

    const key = e.key.toLowerCase()
    // Avoid adding ctrl/shift/alt as standalone keys
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      parts.push(key)
    }

    return parts.join('+')
  }

  /**
   * Normalize a shortcut keys string for comparison.
   */
  private _normalizeKeys(keys: string): string {
    return keys
      .toLowerCase()
      .split('+')
      .map((k) => k.trim())
      .sort((a, b) => {
        // Ensure modifier keys come first in consistent order
        const order: Record<string, number> = { ctrl: 0, shift: 1, alt: 2 }
        const aOrder = order[a] ?? 3
        const bOrder = order[b] ?? 3
        return aOrder - bOrder
      })
      .join('+')
  }
}
