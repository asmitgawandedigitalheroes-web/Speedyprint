/**
 * AlignPlugin — Align and distribute selected objects.
 */

import { ActiveSelection, type Canvas as FabricCanvas, type FabricObject } from 'fabric'
import type { IPluginTempl, IEditor } from '../types'

type AlignType = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'
type DistributeType = 'horizontal' | 'vertical'

export class AlignPlugin implements IPluginTempl {
  pluginName = 'AlignPlugin'
  canvas: FabricCanvas
  editor: IEditor

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Align selected objects.
   */
  align(type: AlignType): void {
    const active = this.canvas.getActiveObject()
    if (!active) return

    if (this.editor.hasPlugin('HistoryPlugin')) {
      this.editor.getPlugin<{ saveState: () => void }>('HistoryPlugin').saveState()
    }

    if (active instanceof ActiveSelection) {
      this._alignMultiple(active.getObjects(), type)
    } else {
      this._alignSingle(active, type)
    }

    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  /**
   * Distribute selected objects evenly.
   */
  distribute(type: DistributeType): void {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return

    const objects = active.getObjects()
    if (objects.length < 3) return

    if (this.editor.hasPlugin('HistoryPlugin')) {
      this.editor.getPlugin<{ saveState: () => void }>('HistoryPlugin').saveState()
    }

    if (type === 'horizontal') {
      const sorted = [...objects].sort((a, b) => (a.left || 0) - (b.left || 0))
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      const totalWidth = (last.left || 0) - (first.left || 0)
      const step = totalWidth / (sorted.length - 1)

      sorted.forEach((obj, i) => {
        obj.set('left', (first.left || 0) + step * i)
        obj.setCoords()
      })
    } else {
      const sorted = [...objects].sort((a, b) => (a.top || 0) - (b.top || 0))
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      const totalHeight = (last.top || 0) - (first.top || 0)
      const step = totalHeight / (sorted.length - 1)

      sorted.forEach((obj, i) => {
        obj.set('top', (first.top || 0) + step * i)
        obj.setCoords()
      })
    }

    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  // --- Private ---

  private _alignSingle(obj: FabricObject, type: AlignType): void {
    // Align single object relative to canvas center
    const canvasWidth = this.canvas.getWidth()
    const canvasHeight = this.canvas.getHeight()
    const bound = obj.getBoundingRect()

    switch (type) {
      case 'left':
        obj.set('left', (obj.left || 0) - bound.left)
        break
      case 'center-h':
        obj.set('left', (obj.left || 0) + (canvasWidth / 2 - bound.left - bound.width / 2))
        break
      case 'right':
        obj.set('left', (obj.left || 0) + (canvasWidth - bound.left - bound.width))
        break
      case 'top':
        obj.set('top', (obj.top || 0) - bound.top)
        break
      case 'center-v':
        obj.set('top', (obj.top || 0) + (canvasHeight / 2 - bound.top - bound.height / 2))
        break
      case 'bottom':
        obj.set('top', (obj.top || 0) + (canvasHeight - bound.top - bound.height))
        break
    }
    obj.setCoords()
  }

  private _alignMultiple(objects: FabricObject[], type: AlignType): void {
    // Get the bounding box of all selected objects
    let minLeft = Infinity, minTop = Infinity
    let maxRight = -Infinity, maxBottom = -Infinity

    const bounds = objects.map((obj) => {
      const b = obj.getBoundingRect()
      minLeft = Math.min(minLeft, b.left)
      minTop = Math.min(minTop, b.top)
      maxRight = Math.max(maxRight, b.left + b.width)
      maxBottom = Math.max(maxBottom, b.top + b.height)
      return b
    })

    const centerX = (minLeft + maxRight) / 2
    const centerY = (minTop + maxBottom) / 2

    objects.forEach((obj, i) => {
      const b = bounds[i]
      switch (type) {
        case 'left':
          obj.set('left', (obj.left || 0) + (minLeft - b.left))
          break
        case 'center-h':
          obj.set('left', (obj.left || 0) + (centerX - b.left - b.width / 2))
          break
        case 'right':
          obj.set('left', (obj.left || 0) + (maxRight - b.left - b.width))
          break
        case 'top':
          obj.set('top', (obj.top || 0) + (minTop - b.top))
          break
        case 'center-v':
          obj.set('top', (obj.top || 0) + (centerY - b.top - b.height / 2))
          break
        case 'bottom':
          obj.set('top', (obj.top || 0) + (maxBottom - b.top - b.height))
          break
      }
      obj.setCoords()
    })
  }
}
