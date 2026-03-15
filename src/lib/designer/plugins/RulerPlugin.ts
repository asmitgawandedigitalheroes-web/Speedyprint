/**
 * RulerPlugin — Horizontal and vertical rulers with dynamic scale.
 * Syncs with zoom/pan; drawn on separate <canvas> elements.
 */

import type { Canvas as FabricCanvas } from 'fabric'
import type { IPluginTempl, IEditor } from '../types'

interface RulerOptions {
  /** Ruler thickness in pixels */
  size?: number
  /** Background color */
  bgColor?: string
  /** Text color */
  textColor?: string
  /** Tick color */
  tickColor?: string
  /** Units: 'mm' or 'px' */
  unit?: 'mm' | 'px'
  /** Pixels per mm (based on DPI) */
  pxPerMm?: number
}

const DEFAULTS: Required<RulerOptions> = {
  size: 24,
  bgColor: '#f8f9fa',
  textColor: '#6b7280',
  tickColor: '#d1d5db',
  unit: 'mm',
  pxPerMm: 3.7795275591,
}

export class RulerPlugin implements IPluginTempl {
  pluginName = 'RulerPlugin'
  canvas: FabricCanvas
  editor: IEditor

  private options: Required<RulerOptions>
  private hCanvas: HTMLCanvasElement | null = null
  private vCanvas: HTMLCanvasElement | null = null
  private hCtx: CanvasRenderingContext2D | null = null
  private vCtx: CanvasRenderingContext2D | null = null
  private visible = true
  private _boundRedraw: () => void

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
    this.options = { ...DEFAULTS }
    this._boundRedraw = this._redraw.bind(this)
  }

  setup(): void {
    // Listen for zoom/pan changes to redraw rulers
    this.canvas.on('after:render', this._boundRedraw)
  }

  destroy(): void {
    this.canvas.off('after:render', this._boundRedraw)
  }

  /**
   * Attach external ruler canvas elements.
   */
  attachCanvases(horizontal: HTMLCanvasElement, vertical: HTMLCanvasElement): void {
    this.hCanvas = horizontal
    this.vCanvas = vertical
    this.hCtx = horizontal.getContext('2d')
    this.vCtx = vertical.getContext('2d')
    this._redraw()
  }

  /**
   * Detach ruler canvases.
   */
  detachCanvases(): void {
    this.hCanvas = null
    this.vCanvas = null
    this.hCtx = null
    this.vCtx = null
  }

  /**
   * Toggle ruler visibility.
   */
  toggleRulers(): void {
    this.visible = !this.visible
    if (this.visible) {
      this._redraw()
    } else {
      this._clear()
    }
    this.editor.emit('rulers:toggle', this.visible)
  }

  /**
   * Set ruler unit.
   */
  setUnit(unit: 'mm' | 'px'): void {
    this.options.unit = unit
    this._redraw()
  }

  /**
   * Get current unit.
   */
  getUnit(): 'mm' | 'px' {
    return this.options.unit
  }

  /**
   * Check visibility.
   */
  isVisible(): boolean {
    return this.visible
  }

  /**
   * Force a redraw.
   */
  refresh(): void {
    this._redraw()
  }

  // --- Private ---

  private _clear(): void {
    if (this.hCtx && this.hCanvas) {
      this.hCtx.clearRect(0, 0, this.hCanvas.width, this.hCanvas.height)
    }
    if (this.vCtx && this.vCanvas) {
      this.vCtx.clearRect(0, 0, this.vCanvas.width, this.vCanvas.height)
    }
  }

  private _redraw(): void {
    if (!this.visible) return
    this._drawHorizontal()
    this._drawVertical()
  }

  private _drawHorizontal(): void {
    const ctx = this.hCtx
    const canvas = this.hCanvas
    if (!ctx || !canvas) return

    const { size, bgColor, textColor, tickColor, unit, pxPerMm } = this.options
    const width = canvas.width
    const height = size

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    // Bottom border
    ctx.strokeStyle = tickColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, height - 0.5)
    ctx.lineTo(width, height - 0.5)
    ctx.stroke()

    // Get zoom and pan
    const vpt = this.canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
    const zoom = vpt[0]
    const panX = vpt[4]

    // Calculate step size
    const { step, subStep } = this._getSteps(zoom, unit, pxPerMm)
    const stepPx = step * zoom * (unit === 'mm' ? pxPerMm : 1)
    const subStepPx = subStep * zoom * (unit === 'mm' ? pxPerMm : 1)

    // Drawing offset
    const startValue = -panX / (zoom * (unit === 'mm' ? pxPerMm : 1))
    const endValue = (width - panX) / (zoom * (unit === 'mm' ? pxPerMm : 1))

    const firstStep = Math.floor(startValue / step) * step
    const firstSub = Math.floor(startValue / subStep) * subStep

    ctx.fillStyle = textColor
    ctx.font = '10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'

    // Draw sub-ticks
    ctx.strokeStyle = tickColor
    ctx.lineWidth = 0.5
    for (let val = firstSub; val <= endValue; val += subStep) {
      const x = val * (unit === 'mm' ? pxPerMm : 1) * zoom + panX
      if (x < 0 || x > width) continue

      ctx.beginPath()
      ctx.moveTo(Math.round(x) + 0.5, height - 4)
      ctx.lineTo(Math.round(x) + 0.5, height)
      ctx.stroke()
    }

    // Draw major ticks + labels
    ctx.strokeStyle = tickColor
    ctx.lineWidth = 1
    for (let val = firstStep; val <= endValue; val += step) {
      const x = val * (unit === 'mm' ? pxPerMm : 1) * zoom + panX
      if (x < 0 || x > width) continue

      ctx.beginPath()
      ctx.moveTo(Math.round(x) + 0.5, height - 8)
      ctx.lineTo(Math.round(x) + 0.5, height)
      ctx.stroke()

      // Label
      const label = Math.round(val).toString()
      if (stepPx > 20) {
        ctx.fillText(label, x, height - 10)
      }
    }
  }

  private _drawVertical(): void {
    const ctx = this.vCtx
    const canvas = this.vCanvas
    if (!ctx || !canvas) return

    const { size, bgColor, textColor, tickColor, unit, pxPerMm } = this.options
    const width = size
    const height = canvas.height

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    // Right border
    ctx.strokeStyle = tickColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(width - 0.5, 0)
    ctx.lineTo(width - 0.5, height)
    ctx.stroke()

    // Get zoom and pan
    const vpt = this.canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
    const zoom = vpt[0]
    const panY = vpt[5]

    // Calculate step size
    const { step, subStep } = this._getSteps(zoom, unit, pxPerMm)
    const stepPx = step * zoom * (unit === 'mm' ? pxPerMm : 1)

    // Drawing offset
    const startValue = -panY / (zoom * (unit === 'mm' ? pxPerMm : 1))
    const endValue = (height - panY) / (zoom * (unit === 'mm' ? pxPerMm : 1))

    const firstStep = Math.floor(startValue / step) * step
    const firstSub = Math.floor(startValue / subStep) * subStep
    const { subStep: subStepVal } = this._getSteps(zoom, unit, pxPerMm)

    ctx.fillStyle = textColor
    ctx.font = '10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'

    // Draw sub-ticks
    ctx.strokeStyle = tickColor
    ctx.lineWidth = 0.5
    for (let val = firstSub; val <= endValue; val += subStepVal) {
      const y = val * (unit === 'mm' ? pxPerMm : 1) * zoom + panY
      if (y < 0 || y > height) continue

      ctx.beginPath()
      ctx.moveTo(width - 4, Math.round(y) + 0.5)
      ctx.lineTo(width, Math.round(y) + 0.5)
      ctx.stroke()
    }

    // Draw major ticks + labels
    ctx.strokeStyle = tickColor
    ctx.lineWidth = 1
    for (let val = firstStep; val <= endValue; val += step) {
      const y = val * (unit === 'mm' ? pxPerMm : 1) * zoom + panY
      if (y < 0 || y > height) continue

      ctx.beginPath()
      ctx.moveTo(width - 8, Math.round(y) + 0.5)
      ctx.lineTo(width, Math.round(y) + 0.5)
      ctx.stroke()

      // Label (rotated)
      if (stepPx > 20) {
        ctx.save()
        ctx.translate(width - 12, y)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(Math.round(val).toString(), 0, 0)
        ctx.restore()
      }
    }
  }

  /**
   * Calculate appropriate step sizes based on zoom level.
   */
  private _getSteps(zoom: number, unit: 'mm' | 'px', pxPerMm: number): { step: number; subStep: number } {
    const pixelsPerUnit = unit === 'mm' ? pxPerMm : 1
    const effectiveScale = zoom * pixelsPerUnit

    // Choose step size so labels don't overlap (minimum ~40px between labels)
    const minLabelSpacePx = 40
    const candidates = unit === 'mm'
      ? [1, 2, 5, 10, 20, 50, 100, 200, 500]
      : [1, 5, 10, 25, 50, 100, 250, 500, 1000]

    let step = candidates[candidates.length - 1]
    for (const c of candidates) {
      if (c * effectiveScale >= minLabelSpacePx) {
        step = c
        break
      }
    }

    // Sub-step is step/5 or step/2
    const subStep = step >= 10 ? step / 5 : step / 2

    return { step, subStep }
  }
}
