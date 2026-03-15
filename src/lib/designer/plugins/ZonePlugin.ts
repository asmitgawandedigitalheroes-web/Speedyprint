/**
 * ZonePlugin — Print zone management (bleed, trim, safe zone).
 * Wraps existing canvas-utils.ts zone logic into a plugin.
 */

import type { Canvas as FabricCanvas } from 'fabric'
import type { ProductTemplate } from '@/types'
import {
  computeZones,
  initializeCanvas,
  isZoneGuide,
  type CanvasZones,
} from '../canvas-utils'
import type { IPluginTempl, IEditor } from '../types'

export class ZonePlugin implements IPluginTempl {
  pluginName = 'ZonePlugin'
  canvas: FabricCanvas
  editor: IEditor

  private zones: CanvasZones | null = null
  private zonesVisible = true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private fabricModule: any = null

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Initialize zones for a given template.
   * Must pass in the fabric module (from dynamic import).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initZones(fabricModule: any, template: ProductTemplate): CanvasZones {
    this.fabricModule = fabricModule
    this.zones = initializeCanvas(fabricModule, this.canvas, template)

    // Tell ZoomPlugin about the zones
    if (this.editor.hasPlugin('ZoomPlugin')) {
      const zoomPlugin = this.editor.getPlugin<{ setZones: (z: CanvasZones) => void }>('ZoomPlugin')
      zoomPlugin.setZones(this.zones)
    }

    return this.zones
  }

  /**
   * Get the current zones.
   */
  getZones(): CanvasZones | null {
    return this.zones
  }

  /**
   * Re-compute zones (e.g., when template changes).
   */
  recomputeZones(template: ProductTemplate): CanvasZones {
    return computeZones(template)
  }

  /**
   * Get all zone guide objects on the canvas.
   */
  getZoneObjects(): unknown[] {
    return this.canvas
      .getObjects()
      .filter(
        (obj) =>
          isZoneGuide(obj as { name?: string }) ||
          (obj as unknown as { name?: string }).name === '__print_bg'
      )
  }

  /**
   * Show zone guide overlays.
   */
  showZones(): void {
    this.zonesVisible = true
    this.getZoneObjects().forEach((obj) => {
      (obj as { visible: boolean }).visible = true
    })
    this.canvas.requestRenderAll()
  }

  /**
   * Hide zone guide overlays (but keep them for constraint enforcement).
   */
  hideZones(): void {
    this.zonesVisible = false
    this.getZoneObjects().forEach((obj) => {
      // Keep print_bg visible (it's the white background)
      if ((obj as { name?: string }).name !== '__print_bg') {
        (obj as { visible: boolean }).visible = false
      }
    })
    this.canvas.requestRenderAll()
  }

  /**
   * Toggle zone visibility.
   */
  toggleZones(): void {
    if (this.zonesVisible) {
      this.hideZones()
    } else {
      this.showZones()
    }
  }

  /**
   * Check if zones are currently visible.
   */
  areZonesVisible(): boolean {
    return this.zonesVisible
  }
}
