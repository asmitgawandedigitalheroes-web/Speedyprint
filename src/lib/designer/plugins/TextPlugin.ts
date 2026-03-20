/**
 * TextPlugin — Enhanced text tools (headings, body, effects).
 */

import { IText, Shadow, type Canvas as FabricCanvas } from 'fabric'
import type { IPluginTempl, IEditor } from '../types'
import { getSafeZoneCenter } from '../canvas-utils'

const TEXT_PRESETS = {
  heading: { fontSize: 48, fontWeight: 'bold', fontFamily: 'Montserrat' },
  subheading: { fontSize: 32, fontWeight: '600', fontFamily: 'Poppins' },
  body: { fontSize: 16, fontWeight: 'normal', fontFamily: 'Inter' },
  caption: { fontSize: 12, fontWeight: 'normal', fontFamily: 'Inter' },
} as const

export class TextPlugin implements IPluginTempl {
  pluginName = 'TextPlugin'
  canvas: FabricCanvas
  editor: IEditor

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Add text with custom options.
   */
  addText(text: string = 'Edit this text', options?: Record<string, unknown>): void {
    this._saveHistory()

    const zones = this._getZones()
    const { x: centerX, y: centerY } = getSafeZoneCenter(this.canvas, zones)

    const itext = new IText(text, {
      left: centerX,
      top: centerY,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Inter',
      fontSize: 24,
      fill: '#000000',
      ...options,
    })

    this.canvas.add(itext)
    this.canvas.setActiveObject(itext)
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  /**
   * Add a preset heading text.
   */
  addHeading(text: string = 'Heading'): void {
    this.addText(text, TEXT_PRESETS.heading)
  }

  /**
   * Add a preset subheading text.
   */
  addSubheading(text: string = 'Subheading'): void {
    this.addText(text, TEXT_PRESETS.subheading)
  }

  /**
   * Add a preset body text.
   */
  addBody(text: string = 'Body text goes here'): void {
    this.addText(text, TEXT_PRESETS.body)
  }

  /**
   * Add a preset caption text.
   */
  addCaption(text: string = 'Caption text'): void {
    this.addText(text, TEXT_PRESETS.caption)
  }

  /**
   * Set text shadow on the active text object.
   */
  setTextShadow(options: { color?: string; blur?: number; offsetX?: number; offsetY?: number }): void {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof IText)) return

    this._saveHistory()

    const shadow = new Shadow({
      color: options.color || '#000000',
      blur: options.blur || 5,
      offsetX: options.offsetX || 2,
      offsetY: options.offsetY || 2,
    })

    active.set('shadow', shadow)
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  /**
   * Remove text shadow from the active text object.
   */
  removeTextShadow(): void {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof IText)) return

    this._saveHistory()
    active.set('shadow', null)
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  /**
   * Set text stroke (outline).
   */
  setTextStroke(color: string, width: number = 1): void {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof IText)) return

    this._saveHistory()
    active.set({ stroke: color, strokeWidth: width })
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  /**
   * Set letter spacing on the active text.
   */
  setLetterSpacing(spacing: number): void {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof IText)) return

    this._saveHistory()
    active.set('charSpacing', spacing)
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  /**
   * Set line height on the active text.
   */
  setLineHeight(height: number): void {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof IText)) return

    this._saveHistory()
    active.set('lineHeight', height)
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
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
