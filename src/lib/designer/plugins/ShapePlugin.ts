/**
 * ShapePlugin — Extended shapes (triangle, polygon, star, arrow, rounded rect, free-draw).
 */

import {
  Rect,
  Circle,
  Triangle,
  Polygon,
  Line,
  PencilBrush,
  type Canvas as FabricCanvas,
} from 'fabric'
import { useEditorStore } from '../store'
import { getSafeZoneCenter } from '../canvas-utils'
import type { IPluginTempl, IEditor } from '../types'

type ShapeType = 'rect' | 'circle' | 'triangle' | 'line' | 'polygon' | 'star' | 'arrow' | 'rounded-rect'

export class ShapePlugin implements IPluginTempl {
  pluginName = 'ShapePlugin'
  canvas: FabricCanvas
  editor: IEditor

  private brush: PencilBrush | null = null

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Add a shape to the canvas.
   */
  addShape(type: ShapeType, options?: Record<string, unknown>): void {
    this._saveHistory()

    const zones = this._getZones()
    const { x: centerX, y: centerY } = getSafeZoneCenter(this.canvas, zones)

    const defaults = {
      left: centerX,
      top: centerY,
      originX: 'center' as const,
      originY: 'center' as const,
      fill: '#3b82f6',
      stroke: '#1d4ed8',
      strokeWidth: 2,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let shape: any

    switch (type) {
      case 'rect':
        shape = new Rect({ ...defaults, width: 120, height: 80, ...options })
        break

      case 'rounded-rect':
        shape = new Rect({ ...defaults, width: 120, height: 80, rx: 12, ry: 12, ...options })
        break

      case 'circle':
        shape = new Circle({
          ...defaults, radius: 50, fill: '#22c55e', stroke: '#15803d', ...options,
        })
        break

      case 'triangle':
        shape = new Triangle({
          ...defaults, width: 100, height: 100, fill: '#f97316', stroke: '#ea580c', ...options,
        })
        break

      case 'line':
        shape = new Line(
          [centerX - 60, centerY, centerX + 60, centerY],
          { stroke: '#000000', strokeWidth: 3, ...options }
        )
        break

      case 'polygon': {
        const sides = (options?.sides as number) || 6
        const radius = (options?.radius as number) || 60
        const points = this._regularPolygonPoints(sides, radius)
        shape = new Polygon(points, {
          ...defaults, fill: '#a855f7', stroke: '#7c3aed', ...options,
        })
        break
      }

      case 'star': {
        const outerR = (options?.outerRadius as number) || 60
        const innerR = (options?.innerRadius as number) || 30
        const starPoints = (options?.points as number) || 5
        const pts = this._starPoints(starPoints, outerR, innerR)
        shape = new Polygon(pts, {
          ...defaults, fill: '#eab308', stroke: '#ca8a04', ...options,
        })
        break
      }

      case 'arrow': {
        const arrowPoints = [
          { x: 0, y: -15 },
          { x: 40, y: -15 },
          { x: 40, y: -30 },
          { x: 70, y: 0 },
          { x: 40, y: 30 },
          { x: 40, y: 15 },
          { x: 0, y: 15 },
        ]
        shape = new Polygon(arrowPoints, {
          ...defaults, fill: '#ef4444', stroke: '#dc2626', ...options,
        })
        break
      }
    }

    if (shape) {
      this.canvas.add(shape)
      this.canvas.setActiveObject(shape)
      this.canvas.requestRenderAll()
      this.editor.emit('canvas:dirty')
    }
  }

  /**
   * Enable free-draw (pencil) mode.
   */
  enableFreeDraw(color: string = '#000000', width: number = 3): void {
    this.brush = new PencilBrush(this.canvas)
    this.brush.color = color
    this.brush.width = width
    this.canvas.freeDrawingBrush = this.brush
    this.canvas.isDrawingMode = true
    useEditorStore.getState().setSelectMode('free-draw')
  }

  /**
   * Disable free-draw mode.
   */
  disableFreeDraw(): void {
    this.canvas.isDrawingMode = false
    useEditorStore.getState().setSelectMode('default')
  }

  /**
   * Toggle free-draw mode.
   */
  toggleFreeDraw(): void {
    if (this.canvas.isDrawingMode) {
      this.disableFreeDraw()
    } else {
      this.enableFreeDraw()
    }
  }

  /**
   * Set free-draw brush properties.
   */
  setBrush(options: { color?: string; width?: number }): void {
    if (this.brush) {
      if (options.color) this.brush.color = options.color
      if (options.width) this.brush.width = options.width
    }
  }

  // --- Private ---

  private _regularPolygonPoints(sides: number, radius: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = []
    const angle = (2 * Math.PI) / sides
    for (let i = 0; i < sides; i++) {
      points.push({
        x: radius * Math.cos(i * angle - Math.PI / 2),
        y: radius * Math.sin(i * angle - Math.PI / 2),
      })
    }
    return points
  }

  private _starPoints(points: number, outerR: number, innerR: number): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = []
    const angle = Math.PI / points
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outerR : innerR
      pts.push({
        x: r * Math.cos(i * angle - Math.PI / 2),
        y: r * Math.sin(i * angle - Math.PI / 2),
      })
    }
    return pts
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
