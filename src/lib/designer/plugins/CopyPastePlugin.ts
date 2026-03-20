/**
 * CopyPastePlugin — Clipboard operations for canvas objects.
 * Ported from DesignerCanvas.tsx copy/paste/selectAll logic.
 */

import { ActiveSelection, type Canvas as FabricCanvas, type FabricObject } from 'fabric'
import { isInternalObject } from '../canvas-utils'
import type { IPluginTempl, IEditor, IShortcut, IContextMenuItem } from '../types'

const PASTE_OFFSET = 20

export class CopyPastePlugin implements IPluginTempl {
  pluginName = 'CopyPastePlugin'
  canvas: FabricCanvas
  editor: IEditor

  private clipboard: FabricObject | null = null
  private pasteCount = 0

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Copy the currently selected object(s) to the internal clipboard.
   */
  async copy(): Promise<void> {
    const active = this.canvas.getActiveObject()
    if (!active) return

    try {
      const cloned = await active.clone()
      this.clipboard = cloned
      this.pasteCount = 0
    } catch (err) {
      console.error('[CopyPastePlugin] Clone failed:', err)
    }
  }

  /**
   * Paste from the internal clipboard onto the canvas.
   */
  async paste(): Promise<void> {
    if (!this.clipboard) return

    // Save state before paste
    if (this.editor.hasPlugin('HistoryPlugin')) {
      const history = this.editor.getPlugin<{ saveState: () => void }>('HistoryPlugin')
      history.saveState()
    }

    try {
      this.pasteCount++
      const offset = PASTE_OFFSET * this.pasteCount
      const cloned = await this.clipboard.clone()

      this.canvas.discardActiveObject()

      // Handle ActiveSelection (multiple objects)
      if ((cloned as unknown as { type: string }).type === 'activeSelection') {
        const selection = cloned as unknown as ActiveSelection
        const objects = selection.getObjects()
        selection.canvas = this.canvas as unknown as undefined
        objects.forEach((obj: FabricObject) => {
          obj.set({
            left: (obj.left || 0) + offset,
            top: (obj.top || 0) + offset,
            evented: true,
          })
          this.canvas.add(obj)
        })
      } else {
        cloned.set({
          left: (cloned.left || 0) + offset,
          top: (cloned.top || 0) + offset,
          evented: true,
        })
        this.canvas.add(cloned)
        this.canvas.setActiveObject(cloned)
      }

      this.canvas.requestRenderAll()
      this.editor.emit('canvas:dirty')
    } catch (err) {
      console.error('[CopyPastePlugin] Paste failed:', err)
    }
  }

  /**
   * Cut the selected object(s) — copy then delete.
   */
  async cut(): Promise<void> {
    await this.copy()
    this._deleteSelected()
  }

  /**
   * Select all non-zone, selectable objects on the canvas.
   */
  selectAll(): void {
    const objects = this.canvas
      .getObjects()
      .filter(
        (obj: FabricObject) =>
          !isInternalObject(obj as { name?: string }) &&
          obj.selectable !== false
      )

    if (objects.length === 0) return

    this.canvas.discardActiveObject()
    const selection = new ActiveSelection(objects, { canvas: this.canvas })
    this.canvas.setActiveObject(selection)
    this.canvas.requestRenderAll()
  }

  /**
   * Delete the currently selected object(s).
   */
  deleteSelected(): void {
    this._deleteSelected()
  }

  getShortcuts(): IShortcut[] {
    return [
      {
        keys: 'ctrl+c',
        label: 'Copy',
        action: () => this.copy(),
        group: 'Clipboard',
      },
      {
        keys: 'ctrl+v',
        label: 'Paste',
        action: () => this.paste(),
        group: 'Clipboard',
      },
      {
        keys: 'ctrl+x',
        label: 'Cut',
        action: () => this.cut(),
        group: 'Clipboard',
      },
      {
        keys: 'ctrl+a',
        label: 'Select All',
        action: () => this.selectAll(),
        group: 'Selection',
      },
      {
        keys: 'delete',
        label: 'Delete',
        action: () => this.deleteSelected(),
        group: 'Edit',
      },
      {
        keys: 'backspace',
        label: 'Delete',
        action: () => this.deleteSelected(),
        group: 'Edit',
      },
    ]
  }

  getContextMenuItems(): IContextMenuItem[] {
    const active = this.canvas.getActiveObject()
    return [
      {
        label: 'Copy',
        shortcut: 'Ctrl+C',
        action: () => this.copy(),
        disabled: !active,
        group: 'clipboard',
      },
      {
        label: 'Paste',
        shortcut: 'Ctrl+V',
        action: () => this.paste(),
        disabled: !this.clipboard,
        group: 'clipboard',
      },
      {
        label: 'Cut',
        shortcut: 'Ctrl+X',
        action: () => this.cut(),
        disabled: !active,
        group: 'clipboard',
      },
      {
        label: 'Delete',
        shortcut: 'Del',
        action: () => this.deleteSelected(),
        disabled: !active,
        group: 'clipboard',
      },
      { label: '', action: () => {}, separator: true, group: 'clipboard' },
      {
        label: 'Select All',
        shortcut: 'Ctrl+A',
        action: () => this.selectAll(),
        group: 'selection',
      },
    ]
  }

  // --- Private ---

  private _deleteSelected(): void {
    const activeObjects = this.canvas.getActiveObjects()
    if (activeObjects.length === 0) return

    // Save state before delete
    if (this.editor.hasPlugin('HistoryPlugin')) {
      const history = this.editor.getPlugin<{ saveState: () => void }>('HistoryPlugin')
      history.saveState()
    }

    activeObjects.forEach((obj) => {
      if (!isInternalObject(obj as { name?: string })) {
        this.canvas.remove(obj)
      }
    })

    this.canvas.discardActiveObject()
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
    this.editor.emit('canvas:selection:cleared')
  }
}
