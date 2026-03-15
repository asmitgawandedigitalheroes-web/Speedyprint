/**
 * FlipPlugin — Flip objects horizontally/vertically.
 */

import type { Canvas as FabricCanvas } from 'fabric'
import type { IPluginTempl, IEditor, IContextMenuItem } from '../types'

export class FlipPlugin implements IPluginTempl {
  pluginName = 'FlipPlugin'
  canvas: FabricCanvas
  editor: IEditor

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Flip the selected object horizontally.
   */
  flipHorizontal(): void {
    const active = this.canvas.getActiveObject()
    if (!active) return

    if (this.editor.hasPlugin('HistoryPlugin')) {
      this.editor.getPlugin<{ saveState: () => void }>('HistoryPlugin').saveState()
    }

    active.set('flipX', !active.flipX)
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  /**
   * Flip the selected object vertically.
   */
  flipVertical(): void {
    const active = this.canvas.getActiveObject()
    if (!active) return

    if (this.editor.hasPlugin('HistoryPlugin')) {
      this.editor.getPlugin<{ saveState: () => void }>('HistoryPlugin').saveState()
    }

    active.set('flipY', !active.flipY)
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  getContextMenuItems(): IContextMenuItem[] {
    const active = this.canvas.getActiveObject()
    if (!active) return []

    return [
      {
        label: 'Flip Horizontal',
        action: () => this.flipHorizontal(),
        group: 'transform',
      },
      {
        label: 'Flip Vertical',
        action: () => this.flipVertical(),
        group: 'transform',
      },
    ]
  }
}
