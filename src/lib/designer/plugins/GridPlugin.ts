/**
 * GridPlugin — Grid overlay on the canvas.
 */

import { Line, type Canvas as FabricCanvas } from 'fabric'
import { useEditorStore } from '../store'
import type { IPluginTempl, IEditor, GridOptions } from '../types'

const DEFAULT_GRID: GridOptions = {
  enabled: false,
  spacing: 20,
  style: 'lines',
  snapToGrid: false,
  color: '#cccccc',
  opacity: 0.3,
}

const GRID_LINE_NAME = '__grid_line'

export class GridPlugin implements IPluginTempl {
  pluginName = 'GridPlugin'
  canvas: FabricCanvas
  editor: IEditor

  private options: GridOptions = { ...DEFAULT_GRID }

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Toggle grid visibility.
   */
  toggleGrid(): void {
    this.options.enabled = !this.options.enabled
    useEditorStore.getState().toggleGrid()

    if (this.options.enabled) {
      this._drawGrid()
    } else {
      this._clearGrid()
    }
  }

  /**
   * Set grid spacing.
   */
  setSpacing(spacing: number): void {
    this.options.spacing = spacing
    if (this.options.enabled) {
      this._clearGrid()
      this._drawGrid()
    }
  }

  /**
   * Toggle snap-to-grid.
   */
  toggleSnapToGrid(): void {
    this.options.snapToGrid = !this.options.snapToGrid
  }

  /**
   * Check if snap-to-grid is enabled.
   */
  isSnapToGrid(): boolean {
    return this.options.snapToGrid
  }

  /**
   * Get current grid options.
   */
  getOptions(): GridOptions {
    return { ...this.options }
  }

  // --- Private ---

  private _drawGrid(): void {
    this._clearGrid()

    const width = this.canvas.getWidth()
    const height = this.canvas.getHeight()
    const spacing = this.options.spacing

    // Vertical lines
    for (let x = spacing; x < width; x += spacing) {
      const line = new Line([x, 0, x, height], {
        stroke: this.options.color,
        strokeWidth: 0.5,
        opacity: this.options.opacity,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: GRID_LINE_NAME,
      } as Record<string, unknown>)
      this.canvas.add(line)
      this.canvas.sendObjectToBack(line)
    }

    // Horizontal lines
    for (let y = spacing; y < height; y += spacing) {
      const line = new Line([0, y, width, y], {
        stroke: this.options.color,
        strokeWidth: 0.5,
        opacity: this.options.opacity,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: GRID_LINE_NAME,
      } as Record<string, unknown>)
      this.canvas.add(line)
      this.canvas.sendObjectToBack(line)
    }

    this.canvas.requestRenderAll()
  }

  private _clearGrid(): void {
    const gridObjects = this.canvas
      .getObjects()
      .filter((obj) => (obj as unknown as { name?: string }).name === GRID_LINE_NAME)

    gridObjects.forEach((obj) => this.canvas.remove(obj))
    this.canvas.requestRenderAll()
  }
}
