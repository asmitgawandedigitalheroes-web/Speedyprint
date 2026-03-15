/**
 * WatermarkPlugin — Preview watermark overlay (DRAFT/PROOF).
 * Visible in preview mode, removed on final export.
 */

import { IText, type Canvas as FabricCanvas } from 'fabric'
import type { IPluginTempl, IEditor } from '../types'

const WATERMARK_NAME = '__watermark'

interface WatermarkOptions {
  text?: string
  opacity?: number
  angle?: number
  fontSize?: number
  color?: string
  tiling?: boolean
}

export class WatermarkPlugin implements IPluginTempl {
  pluginName = 'WatermarkPlugin'
  canvas: FabricCanvas
  editor: IEditor

  private visible = false
  private options: WatermarkOptions = {
    text: 'DRAFT',
    opacity: 0.15,
    angle: -30,
    fontSize: 72,
    color: '#000000',
    tiling: false,
  }

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Show the watermark overlay.
   */
  showWatermark(options?: WatermarkOptions): void {
    this.removeWatermark()
    this.visible = true

    if (options) {
      this.options = { ...this.options, ...options }
    }

    const { text, opacity, angle, fontSize, color, tiling } = this.options
    const canvasWidth = this.canvas.getWidth()
    const canvasHeight = this.canvas.getHeight()

    if (tiling) {
      // Create tiled watermarks
      const spacingX = 300
      const spacingY = 200

      for (let x = 0; x < canvasWidth + spacingX; x += spacingX) {
        for (let y = 0; y < canvasHeight + spacingY; y += spacingY) {
          this._addWatermarkText(text!, x, y, fontSize!, color!, opacity!, angle!)
        }
      }
    } else {
      // Single centered watermark
      this._addWatermarkText(
        text!,
        canvasWidth / 2,
        canvasHeight / 2,
        fontSize!,
        color!,
        opacity!,
        angle!
      )
    }

    this.canvas.requestRenderAll()
  }

  /**
   * Remove the watermark overlay.
   */
  removeWatermark(): void {
    this.visible = false
    const watermarks = this.canvas
      .getObjects()
      .filter((obj) => (obj as unknown as { name?: string }).name === WATERMARK_NAME)

    watermarks.forEach((obj) => this.canvas.remove(obj))
    this.canvas.requestRenderAll()
  }

  /**
   * Toggle watermark visibility.
   */
  toggleWatermark(): void {
    if (this.visible) {
      this.removeWatermark()
    } else {
      this.showWatermark()
    }
  }

  /**
   * Set watermark options.
   */
  setOptions(options: WatermarkOptions): void {
    this.options = { ...this.options, ...options }
    if (this.visible) {
      this.showWatermark()
    }
  }

  /**
   * Check if watermark is visible.
   */
  isVisible(): boolean {
    return this.visible
  }

  // --- Private ---

  private _addWatermarkText(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color: string,
    opacity: number,
    angle: number
  ): void {
    const watermark = new IText(text, {
      left: x,
      top: y,
      originX: 'center',
      originY: 'center',
      fontSize,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: color,
      opacity,
      angle,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    })

    ;(watermark as unknown as { name: string }).name = WATERMARK_NAME

    this.canvas.add(watermark)
    // Bring to front (above all design objects)
    this.canvas.bringObjectToFront(watermark)
  }
}
