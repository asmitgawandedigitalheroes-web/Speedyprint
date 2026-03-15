/**
 * BarcodePlugin — Generate and add barcodes to the canvas.
 */

import { FabricImage, type Canvas as FabricCanvas } from 'fabric'
import type { IPluginTempl, IEditor } from '../types'

type BarcodeFormat = 'CODE128' | 'EAN13' | 'UPC' | 'CODE39' | 'ITF14' | 'MSI'

interface BarcodeOptions {
  format?: BarcodeFormat
  width?: number
  height?: number
  displayValue?: boolean
  foreground?: string
  background?: string
}

export class BarcodePlugin implements IPluginTempl {
  pluginName = 'BarcodePlugin'
  canvas: FabricCanvas
  editor: IEditor

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Add a barcode to the canvas.
   */
  async addBarcode(data: string, options: BarcodeOptions = {}): Promise<void> {
    const {
      format = 'CODE128',
      width = 2,
      height = 100,
      displayValue = true,
      foreground = '#000000',
      background = '#ffffff',
    } = options

    try {
      const JsBarcode = (await import('jsbarcode')).default

      // Create offscreen SVG
      const svgNS = 'http://www.w3.org/2000/svg'
      const svg = document.createElementNS(svgNS, 'svg')
      document.body.appendChild(svg)

      JsBarcode(svg, data, {
        format,
        width,
        height,
        displayValue,
        lineColor: foreground,
        background,
        margin: 10,
      })

      // Convert SVG to data URL
      const svgString = new XMLSerializer().serializeToString(svg)
      const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)))

      document.body.removeChild(svg)

      this._saveHistory()

      const zones = this._getZones()
      const imgElement = new Image()
      imgElement.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        imgElement.onload = () => resolve()
        imgElement.onerror = () => reject(new Error('Failed to load barcode image'))
        imgElement.src = dataUrl
      })

      const fabricImage = new FabricImage(imgElement, {
        left: zones ? zones.safePx.left + zones.safePx.width / 2 : 200,
        top: zones ? zones.safePx.top + zones.safePx.height / 2 : 200,
        originX: 'center',
        originY: 'center',
      })

      // Scale to reasonable size
      const maxWidth = 300
      if (fabricImage.width && fabricImage.width > maxWidth) {
        fabricImage.scale(maxWidth / fabricImage.width)
      }

      // Store barcode data as custom properties
      ;(fabricImage as unknown as Record<string, unknown>).__barcodeData = data
      ;(fabricImage as unknown as Record<string, unknown>).__barcodeFormat = format
      ;(fabricImage as unknown as Record<string, unknown>).__barcodeOptions = options
      ;(fabricImage as unknown as Record<string, unknown>).name = '__barcode'

      this.canvas.add(fabricImage)
      this.canvas.setActiveObject(fabricImage)
      this.canvas.requestRenderAll()
      this.editor.emit('canvas:dirty')
    } catch (err) {
      console.error('[BarcodePlugin] Failed to generate barcode:', err)
    }
  }

  /**
   * Get supported barcode formats.
   */
  getFormats(): { value: BarcodeFormat; label: string }[] {
    return [
      { value: 'CODE128', label: 'Code 128' },
      { value: 'EAN13', label: 'EAN-13' },
      { value: 'UPC', label: 'UPC' },
      { value: 'CODE39', label: 'Code 39' },
      { value: 'ITF14', label: 'ITF-14' },
      { value: 'MSI', label: 'MSI' },
    ]
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
