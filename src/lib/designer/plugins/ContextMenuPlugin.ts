/**
 * ContextMenuPlugin — Right-click context menu for the canvas.
 * Collects menu items from all registered plugins and shows a context menu.
 */

import type { Canvas as FabricCanvas } from 'fabric'
import { useEditorStore } from '../store'
import type { IPluginTempl, IEditor, IContextMenuItem } from '../types'

export class ContextMenuPlugin implements IPluginTempl {
  pluginName = 'ContextMenuPlugin'
  canvas: FabricCanvas
  editor: IEditor

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  setup(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.canvas.on('mouse:down', this._onMouseDown as any)
  }

  destroy(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.canvas.off('mouse:down', this._onMouseDown as any)
  }

  /**
   * Get all context menu items from all plugins + built-in items.
   */
  getMenuItems(): IContextMenuItem[] {
    // Collect from editor (which collects from all plugins)
    const items = this.editor.getContextMenuItems()

    // Add built-in layer order items
    const active = this.canvas.getActiveObject()
    if (active) {
      items.push(
        { label: '', action: () => {}, separator: true, group: 'layer' },
        {
          label: 'Bring to Front',
          action: () => {
            this.canvas.bringObjectToFront(active)
            this.canvas.requestRenderAll()
            this.editor.emit('canvas:dirty')
          },
          group: 'layer',
        },
        {
          label: 'Send to Back',
          action: () => {
            this.canvas.sendObjectToBack(active)
            this.canvas.requestRenderAll()
            this.editor.emit('canvas:dirty')
          },
          group: 'layer',
        },
        {
          label: 'Bring Forward',
          action: () => {
            this.canvas.bringObjectForward(active)
            this.canvas.requestRenderAll()
            this.editor.emit('canvas:dirty')
          },
          group: 'layer',
        },
        {
          label: 'Send Backward',
          action: () => {
            this.canvas.sendObjectBackwards(active)
            this.canvas.requestRenderAll()
            this.editor.emit('canvas:dirty')
          },
          group: 'layer',
        },
        { label: '', action: () => {}, separator: true, group: 'lock' },
        {
          label: active.lockMovementX ? 'Unlock' : 'Lock',
          action: () => {
            const locked = !active.lockMovementX
            active.set({
              lockMovementX: locked,
              lockMovementY: locked,
              lockRotation: locked,
              lockScalingX: locked,
              lockScalingY: locked,
              hasControls: !locked,
            })
            this.canvas.requestRenderAll()
          },
          group: 'lock',
        }
      )
    }

    return items
  }

  // --- Event handlers ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _onMouseDown = (opt: any): void => {
    const evt = opt.e as MouseEvent
    if (evt.button !== 2) return // Only right-click

    evt.preventDefault()
    evt.stopPropagation()

    const items = this.getMenuItems()
    if (items.length === 0) return

    const store = useEditorStore.getState()
    store.setContextMenu({
      x: evt.clientX,
      y: evt.clientY,
      items,
    })
  }
}
