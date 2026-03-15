/**
 * GuidelinePlugin — Draggable horizontal/vertical guidelines.
 * Users drag from rulers to create; double-click to remove.
 * Objects snap to guidelines (integrates with SnapPlugin).
 */

import { Line, type Canvas as FabricCanvas, type FabricObject } from 'fabric'
import type { IPluginTempl, IEditor, IContextMenuItem } from '../types'

const GUIDELINE_NAME = '__guideline'

interface Guideline {
  id: string
  orientation: 'horizontal' | 'vertical'
  position: number // canvas coordinate
  fabricObject: FabricObject
}

let guidelineCounter = 0

export class GuidelinePlugin implements IPluginTempl {
  pluginName = 'GuidelinePlugin'
  canvas: FabricCanvas
  editor: IEditor

  private guidelines: Guideline[] = []
  private guideColor = '#6366f1'
  private guideDashArray = [6, 4]

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  setup(): void {
    // Double-click on a guideline to remove it
    this.canvas.on('mouse:dblclick', (e) => {
      if (!e.target) return
      const name = (e.target as unknown as { name?: string }).name
      if (name === GUIDELINE_NAME) {
        const id = (e.target as unknown as { __guidelineId?: string }).__guidelineId
        if (id) this.removeGuideline(id)
      }
    })
  }

  /**
   * Add a horizontal guideline at a Y position.
   */
  addHorizontalGuideline(y: number): string {
    return this._addGuideline('horizontal', y)
  }

  /**
   * Add a vertical guideline at an X position.
   */
  addVerticalGuideline(x: number): string {
    return this._addGuideline('vertical', x)
  }

  /**
   * Add a guideline with specific orientation and position.
   */
  addGuideline(orientation: 'horizontal' | 'vertical', position: number): string {
    return this._addGuideline(orientation, position)
  }

  /**
   * Remove a guideline by ID.
   */
  removeGuideline(id: string): void {
    const idx = this.guidelines.findIndex((g) => g.id === id)
    if (idx < 0) return

    const guideline = this.guidelines[idx]
    this.canvas.remove(guideline.fabricObject)
    this.guidelines.splice(idx, 1)
    this.canvas.requestRenderAll()
    this.editor.emit('guideline:removed', id)
  }

  /**
   * Clear all guidelines.
   */
  clearGuidelines(): void {
    for (const g of this.guidelines) {
      this.canvas.remove(g.fabricObject)
    }
    this.guidelines = []
    this.canvas.requestRenderAll()
    this.editor.emit('guidelines:cleared')
  }

  /**
   * Get all current guidelines.
   */
  getGuidelines(): Array<{ id: string; orientation: 'horizontal' | 'vertical'; position: number }> {
    return this.guidelines.map((g) => ({
      id: g.id,
      orientation: g.orientation,
      position: g.position,
    }))
  }

  /**
   * Get guideline positions for snap integration.
   * Returns { horizontal: number[], vertical: number[] }
   */
  getSnapPositions(): { horizontal: number[]; vertical: number[] } {
    const horizontal: number[] = []
    const vertical: number[] = []

    for (const g of this.guidelines) {
      if (g.orientation === 'horizontal') {
        horizontal.push(g.position)
      } else {
        vertical.push(g.position)
      }
    }

    return { horizontal, vertical }
  }

  /**
   * Set guideline position (e.g., from drag).
   */
  setPosition(id: string, position: number): void {
    const guideline = this.guidelines.find((g) => g.id === id)
    if (!guideline) return

    guideline.position = position
    const obj = guideline.fabricObject as Line

    if (guideline.orientation === 'horizontal') {
      obj.set({ y1: position, y2: position })
    } else {
      obj.set({ x1: position, x2: position })
    }

    this.canvas.requestRenderAll()
  }

  /**
   * Set guideline color.
   */
  setColor(color: string): void {
    this.guideColor = color
    for (const g of this.guidelines) {
      g.fabricObject.set({ stroke: color })
    }
    this.canvas.requestRenderAll()
  }

  /**
   * Get context menu items.
   */
  getContextMenuItems(): IContextMenuItem[] {
    return [
      {
        label: 'Add Horizontal Guide',
        action: () => {
          const pos = this.canvas.getHeight() / 2
          this.addHorizontalGuideline(pos)
        },
        group: 'guides',
      },
      {
        label: 'Add Vertical Guide',
        action: () => {
          const pos = this.canvas.getWidth() / 2
          this.addVerticalGuideline(pos)
        },
        group: 'guides',
      },
      {
        label: 'Clear All Guides',
        action: () => this.clearGuidelines(),
        disabled: this.guidelines.length === 0,
        group: 'guides',
      },
    ]
  }

  // --- Private ---

  private _addGuideline(orientation: 'horizontal' | 'vertical', position: number): string {
    const id = `guide_${++guidelineCounter}`
    const canvasWidth = this.canvas.getWidth()
    const canvasHeight = this.canvas.getHeight()

    let line: Line
    if (orientation === 'horizontal') {
      line = new Line([0, position, canvasWidth * 3, position], {
        stroke: this.guideColor,
        strokeWidth: 1,
        strokeDashArray: this.guideDashArray,
        selectable: true,
        evented: true,
        excludeFromExport: true,
        hasControls: false,
        hasBorders: false,
        lockMovementX: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
        originX: 'left',
        originY: 'center',
        left: -canvasWidth,
        top: position,
        opacity: 0.7,
      })
    } else {
      line = new Line([position, 0, position, canvasHeight * 3], {
        stroke: this.guideColor,
        strokeWidth: 1,
        strokeDashArray: this.guideDashArray,
        selectable: true,
        evented: true,
        excludeFromExport: true,
        hasControls: false,
        hasBorders: false,
        lockMovementY: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
        originX: 'center',
        originY: 'top',
        left: position,
        top: -canvasHeight,
        opacity: 0.7,
      })
    }

    // Tag the line
    const lineAny = line as unknown as { name: string; __guidelineId: string }
    lineAny.name = GUIDELINE_NAME
    lineAny.__guidelineId = id

    // Track movement to update position
    line.on('moving', () => {
      const g = this.guidelines.find((gl) => gl.id === id)
      if (!g) return
      if (orientation === 'horizontal') {
        g.position = line.top || 0
      } else {
        g.position = line.left || 0
      }
      this.editor.emit('guideline:moved', { id, position: g.position })
    })

    this.canvas.add(line)
    this.canvas.bringObjectToFront(line)

    this.guidelines.push({
      id,
      orientation,
      position,
      fabricObject: line,
    })

    this.canvas.requestRenderAll()
    this.editor.emit('guideline:added', { id, orientation, position })

    return id
  }
}
