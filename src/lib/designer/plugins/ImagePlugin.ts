/**
 * ImagePlugin — Image manipulation (add, replace, crop, filters).
 */

import { FabricImage, type Canvas as FabricCanvas, type FabricObject, filters } from 'fabric'
import type { IPluginTempl, IEditor } from '../types'
import { getSafeZoneCenter } from '../canvas-utils'

interface FilterPreset {
  name: string
  filters: Array<{ type: string; options?: Record<string, number> }>
}

const FILTER_PRESETS: FilterPreset[] = [
  { name: 'Grayscale', filters: [{ type: 'Grayscale' }] },
  { name: 'Sepia', filters: [{ type: 'Sepia' }] },
  { name: 'Vintage', filters: [{ type: 'Sepia' }, { type: 'Brightness', options: { brightness: -0.1 } }] },
  { name: 'High Contrast', filters: [{ type: 'Contrast', options: { contrast: 0.3 } }] },
  { name: 'Warm', filters: [{ type: 'Brightness', options: { brightness: 0.05 } }, { type: 'Saturation', options: { saturation: 0.2 } }] },
  { name: 'Cool', filters: [{ type: 'Brightness', options: { brightness: -0.02 } }, { type: 'Saturation', options: { saturation: -0.1 } }] },
]

export class ImagePlugin implements IPluginTempl {
  pluginName = 'ImagePlugin'
  canvas: FabricCanvas
  editor: IEditor

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Add an image from a URL.
   */
  async addImageFromURL(url: string): Promise<FabricObject | null> {
    this._saveHistory()

    const zones = this._getZones()
    try {
      const imgElement = new Image()
      imgElement.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        imgElement.onload = () => resolve()
        imgElement.onerror = () => reject(new Error('Failed to load image'))
        imgElement.src = url
      })

      const { x: imgCenterX, y: imgCenterY } = getSafeZoneCenter(this.canvas, zones)
      const fabricImage = new FabricImage(imgElement, {
        left: imgCenterX,
        top: imgCenterY,
        originX: 'center',
        originY: 'center',
      })

      // Scale to max 300px
      const maxDim = 300
      const w = fabricImage.width || 1
      const h = fabricImage.height || 1
      const scaleFactor = Math.min(maxDim / w, maxDim / h, 1)
      fabricImage.scale(scaleFactor)

      this.canvas.add(fabricImage)
      this.canvas.setActiveObject(fabricImage)
      this.canvas.requestRenderAll()
      this.editor.emit('canvas:dirty')

      return fabricImage
    } catch (err) {
      console.error('[ImagePlugin] Failed to add image:', err)
      return null
    }
  }

  /**
   * Add an image from a File object.
   */
  async addImageFromFile(file: File): Promise<FabricObject | null> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const result = await this.addImageFromURL(dataUrl)
        resolve(result)
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  }

  /**
   * Apply a brightness filter to the active image.
   */
  applyBrightness(value: number): void {
    this._applyFilter('Brightness', { brightness: value })
  }

  /**
   * Apply a contrast filter to the active image.
   */
  applyContrast(value: number): void {
    this._applyFilter('Contrast', { contrast: value })
  }

  /**
   * Apply a saturation filter to the active image.
   */
  applySaturation(value: number): void {
    this._applyFilter('Saturation', { saturation: value })
  }

  /**
   * Apply a blur filter to the active image.
   */
  applyBlur(value: number): void {
    this._applyFilter('Blur', { blur: value })
  }

  /**
   * Apply a grayscale filter to the active image.
   */
  applyGrayscale(): void {
    this._applyFilter('Grayscale', {})
  }

  /**
   * Apply a preset filter to the active image.
   */
  applyPreset(presetName: string): void {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof FabricImage)) return

    const preset = FILTER_PRESETS.find((p) => p.name === presetName)
    if (!preset) return

    this._saveHistory()

    active.filters = preset.filters.map((f) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const FilterClass = (filters as any)[f.type]
      return FilterClass ? new FilterClass(f.options || {}) : null
    }).filter(Boolean)

    active.applyFilters()
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  /**
   * Remove all filters from the active image.
   */
  clearFilters(): void {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof FabricImage)) return

    this._saveHistory()
    active.filters = []
    active.applyFilters()
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  /**
   * Get available filter presets.
   */
  getPresets(): string[] {
    return FILTER_PRESETS.map((p) => p.name)
  }

  // --- Private ---

  private _applyFilter(filterType: string, options: Record<string, number>): void {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof FabricImage)) return

    this._saveHistory()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FilterClass = (filters as any)[filterType]
    if (!FilterClass) return

    // Check if filter already exists, update it; otherwise add
    const existingIndex = active.filters?.findIndex(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f: any) => f.constructor.name === filterType || f.type === filterType
    ) ?? -1

    if (existingIndex >= 0 && active.filters) {
      active.filters[existingIndex] = new FilterClass(options)
    } else {
      if (!active.filters) active.filters = []
      active.filters.push(new FilterClass(options))
    }

    active.applyFilters()
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

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
