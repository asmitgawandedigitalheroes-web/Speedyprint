/**
 * ImportPlugin — Import SVG, images, and saved JSON designs.
 */

import { FabricImage, loadSVGFromString, type Canvas as FabricCanvas } from 'fabric'
import { loadCanvasJSON } from '../canvas-utils'
import type { IPluginTempl, IEditor } from '../types'

export class ImportPlugin implements IPluginTempl {
  pluginName = 'ImportPlugin'
  canvas: FabricCanvas
  editor: IEditor

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Import an SVG file and add its objects to the canvas.
   */
  async importSVG(file: File): Promise<void> {
    const svgString = await file.text()
    this._saveHistory()

    try {
      const result = await loadSVGFromString(svgString)
      const objects = result.objects.filter(Boolean)

      if (objects.length === 0) return

      const zones = this._getZones()
      const centerX = zones ? zones.safePx.left + zones.safePx.width / 2 : 200
      const centerY = zones ? zones.safePx.top + zones.safePx.height / 2 : 200

      // Group the SVG objects and add to canvas
      const fabric = await import('fabric')
      const group = new fabric.Group(objects as import('fabric').FabricObject[], {
        left: centerX,
        top: centerY,
        originX: 'center',
        originY: 'center',
      })

      // Scale to fit in safe zone
      if (zones) {
        const maxW = zones.safePx.width * 0.8
        const maxH = zones.safePx.height * 0.8
        const scaleX = maxW / (group.width || 1)
        const scaleY = maxH / (group.height || 1)
        const scale = Math.min(scaleX, scaleY, 1)
        group.scale(scale)
      }

      this.canvas.add(group)
      this.canvas.setActiveObject(group)
      this.canvas.requestRenderAll()
      this.editor.emit('canvas:dirty')
    } catch (err) {
      console.error('[ImportPlugin] SVG import failed:', err)
    }
  }

  /**
   * Import an image file.
   */
  async importImage(file: File): Promise<void> {
    this._saveHistory()

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

    const zones = this._getZones()
    const imgElement = new Image()
    imgElement.crossOrigin = 'anonymous'

    await new Promise<void>((resolve) => {
      imgElement.onload = () => resolve()
      imgElement.onerror = () => resolve()
      imgElement.src = dataUrl
    })

    const fabricImage = new FabricImage(imgElement, {
      left: zones ? zones.safePx.left + zones.safePx.width / 2 : 200,
      top: zones ? zones.safePx.top + zones.safePx.height / 2 : 200,
      originX: 'center',
      originY: 'center',
    })

    // Scale to fit
    if (zones) {
      const maxW = zones.safePx.width * 0.8
      const maxH = zones.safePx.height * 0.8
      const scaleX = maxW / (fabricImage.width || 1)
      const scaleY = maxH / (fabricImage.height || 1)
      const scale = Math.min(scaleX, scaleY, 1)
      fabricImage.scale(scale)
    } else {
      const maxDim = 300
      const scaleFactor = Math.min(
        maxDim / (fabricImage.width || 1),
        maxDim / (fabricImage.height || 1),
        1
      )
      fabricImage.scale(scaleFactor)
    }

    this.canvas.add(fabricImage)
    this.canvas.setActiveObject(fabricImage)
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  /**
   * Import a saved design JSON file.
   */
  async importJSON(file: File): Promise<void> {
    try {
      const text = await file.text()
      const json = JSON.parse(text)

      this._saveHistory()
      await loadCanvasJSON(this.canvas, json)
      this.canvas.requestRenderAll()
      this.editor.emit('canvas:dirty')
    } catch (err) {
      console.error('[ImportPlugin] JSON import failed:', err)
    }
  }

  /**
   * Import a file — auto-detect type.
   */
  async importFile(file: File): Promise<void> {
    const type = file.type
    const name = file.name.toLowerCase()

    if (type === 'image/svg+xml' || name.endsWith('.svg')) {
      await this.importSVG(file)
    } else if (type.startsWith('image/')) {
      await this.importImage(file)
    } else if (type === 'application/json' || name.endsWith('.json')) {
      await this.importJSON(file)
    } else {
      console.warn('[ImportPlugin] Unsupported file type:', type)
    }
  }

  // --- Private ---

  private _saveHistory(): void {
    if (this.editor.hasPlugin('HistoryPlugin')) {
      this.editor.getPlugin<{ saveState: () => void }>('HistoryPlugin').saveState()
    }
  }

  private _getZones() {
    if (this.editor.hasPlugin('ZonePlugin')) {
      return this.editor.getPlugin<{ getZones: () => import('../canvas-utils').CanvasZones | null }>('ZonePlugin').getZones()
    }
    return null
  }
}
