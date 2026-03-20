/**
 * QRCodePlugin — Generate and add QR codes to the canvas.
 */

import { FabricImage, type Canvas as FabricCanvas } from 'fabric'
import type { IPluginTempl, IEditor } from '../types'
import { getSafeZoneCenter } from '../canvas-utils'

interface QROptions {
  size?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  foreground?: string
  background?: string
}

export class QRCodePlugin implements IPluginTempl {
  pluginName = 'QRCodePlugin'
  canvas: FabricCanvas
  editor: IEditor

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Add a QR code to the canvas.
   */
  async addQRCode(data: string, options: QROptions = {}): Promise<void> {
    const {
      size = 200,
      errorCorrectionLevel = 'M',
      foreground = '#000000',
      background = '#ffffff',
    } = options

    try {
      // Dynamic import qrcode (browser-compatible)
      const QRCode = await import('qrcode')

      const dataUrl = await QRCode.toDataURL(data, {
        width: size,
        errorCorrectionLevel,
        color: {
          dark: foreground,
          light: background,
        },
        margin: 1,
      })

      this._saveHistory()

      const zones = this._getZones()
      const imgElement = new Image()
      imgElement.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        imgElement.onload = () => resolve()
        imgElement.onerror = () => reject(new Error('Failed to load QR image'))
        imgElement.src = dataUrl
      })

      const { x: qrCenterX, y: qrCenterY } = getSafeZoneCenter(this.canvas, zones)
      const fabricImage = new FabricImage(imgElement, {
        left: qrCenterX,
        top: qrCenterY,
        originX: 'center',
        originY: 'center',
      })

      // Store QR data as custom property for re-generation
      ;(fabricImage as unknown as Record<string, unknown>).__qrData = data
      ;(fabricImage as unknown as Record<string, unknown>).__qrOptions = options
      ;(fabricImage as unknown as Record<string, unknown>).name = '__qr_code'

      this.canvas.add(fabricImage)
      this.canvas.setActiveObject(fabricImage)
      this.canvas.requestRenderAll()
      this.editor.emit('canvas:dirty')
    } catch (err) {
      console.error('[QRCodePlugin] Failed to generate QR code:', err)
    }
  }

  /**
   * Update the QR code data of the selected QR code object.
   */
  async updateQRCode(newData: string): Promise<void> {
    const active = this.canvas.getActiveObject()
    if (!active || (active as unknown as Record<string, unknown>).name !== '__qr_code') return

    const options = ((active as unknown as Record<string, unknown>).__qrOptions || {}) as QROptions
    const left = active.left
    const top = active.top

    this.canvas.remove(active)
    await this.addQRCode(newData, { ...options })

    // Position the new QR code at the same location
    const newActive = this.canvas.getActiveObject()
    if (newActive) {
      newActive.set({ left, top })
      this.canvas.requestRenderAll()
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
