/**
 * SnapPlugin — Object snapping to zone edges, center lines, and guidelines.
 * Wraps existing constraints.ts logic into a plugin.
 */

import type { Canvas as FabricCanvas } from 'fabric'
import type { CanvasZones } from '../canvas-utils'
import {
  enforceConstraints,
  enforceScaleConstraints,
  clearAlignmentGuides,
  destroyGuideLines,
  initGuideLines,
  type LockedZonePx,
} from '../constraints'
import type { IPluginTempl, IEditor } from '../types'

export class SnapPlugin implements IPluginTempl {
  pluginName = 'SnapPlugin'
  canvas: FabricCanvas
  editor: IEditor

  private enabled = true
  private zones: CanvasZones | null = null
  private lockedZones: LockedZonePx[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private fabricModule: any = null

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  setup(): void {
    this.canvas.on('object:moving', this._onMoving as unknown as (e: unknown) => void)
    this.canvas.on('object:scaling', this._onScaling as unknown as (e: unknown) => void)
    this.canvas.on('object:modified', this._onModified)
  }

  destroy(): void {
    this.canvas.off('object:moving', this._onMoving as unknown as (e: unknown) => void)
    this.canvas.off('object:scaling', this._onScaling as unknown as (e: unknown) => void)
    this.canvas.off('object:modified', this._onModified)
    // Remove pre-allocated guide lines and free the cache entry
    destroyGuideLines(this.canvas)
  }

  /**
   * Set the zones and fabric module references.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setZonesAndFabric(zones: CanvasZones, fabricModule: any): void {
    this.zones = zones
    this.fabricModule = fabricModule
    // Eagerly pre-create guide lines so the first drag never triggers canvas.add()
    initGuideLines(fabricModule, this.canvas)
  }

  /**
   * Set template-defined locked zones for element-level enforcement.
   */
  setLockedZones(zones: LockedZonePx[]): void {
    this.lockedZones = zones
  }

  /**
   * Enable snapping.
   */
  enableSnap(): void {
    this.enabled = true
  }

  /**
   * Disable snapping.
   */
  disableSnap(): void {
    this.enabled = false
    clearAlignmentGuides(this.canvas)
  }

  /**
   * Toggle snapping.
   */
  toggleSnap(): void {
    if (this.enabled) {
      this.disableSnap()
    } else {
      this.enableSnap()
    }
  }

  /**
   * Check if snapping is enabled.
   */
  isEnabled(): boolean {
    return this.enabled
  }

  // --- Event handlers ---

  private _onMoving = (e: { target?: unknown }): void => {
    if (!this.enabled || !this.zones || !this.fabricModule) return
    enforceConstraints(this.fabricModule, this.canvas, this.zones, e, this.lockedZones)
  }

  private _onScaling = (e: { target?: unknown }): void => {
    if (!this.zones) return
    enforceScaleConstraints(this.zones, e)
  }

  private _onModified = (): void => {
    clearAlignmentGuides(this.canvas)
  }
}
