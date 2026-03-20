/**
 * ZonePlugin — Print zone management (bleed, trim, safe zone).
 * Supports movable artboard with lock/unlock.
 */

import type { Canvas as FabricCanvas } from 'fabric'
import type { ProductTemplate } from '@/types'
import {
  computeZones,
  createZoneRect,
  isZoneGuide,
  mmToPixels,
  getDisplayScale,
  type CanvasZones,
} from '../canvas-utils'
import type { LockedZonePx } from '../constraints'
import type { IPluginTempl, IEditor } from '../types'

export class ZonePlugin implements IPluginTempl {
  pluginName = 'ZonePlugin'
  canvas: FabricCanvas
  editor: IEditor

  private baseZones: CanvasZones | null = null
  private offsetX = 0
  private offsetY = 0
  private zonesVisible = true
  private locked = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private fabricModule: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private zoneObjects: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private artboardHandle: any = null
  /** Base locked zones (no offset applied) — pixel coords relative to canvas origin */
  private baseLockedZones: LockedZonePx[] = []
  /** Visual locked zone rects on the canvas */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private lockedZoneObjects: any[] = []

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Clean up event listeners.
   */
  destroy(): void {
    this.canvas.off('object:moving', this._onHandleMoving)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.canvas as any).off('object:moved', this._onHandleMoved)
  }

  /**
   * Initialize zones for a given template.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initZones(fabricModule: any, template: ProductTemplate): CanvasZones {
    this.fabricModule = fabricModule
    this.baseZones = computeZones(template)
    this.offsetX = 0
    this.offsetY = 0

    const zones = this.baseZones
    const f = fabricModule

    // White background for the print area
    const printBg = new f.Rect({
      left: zones.trimPx.left,
      top: zones.trimPx.top,
      width: zones.trimPx.width,
      height: zones.trimPx.height,
      fill: '#ffffff',
      stroke: 'transparent',
      selectable: false,
      evented: false,
      excludeFromExport: true,
      name: '__print_bg',
    })

    // Bleed area (red dashed)
    const bleedRect = createZoneRect(f, {
      left: zones.bleedPx.left,
      top: zones.bleedPx.top,
      width: zones.bleedPx.width,
      height: zones.bleedPx.height,
      stroke: '#ef4444',
      strokeDashArray: [8, 4],
      name: '__bleed_zone',
    })

    // Trim line (solid black)
    const trimRect = createZoneRect(f, {
      left: zones.trimPx.left,
      top: zones.trimPx.top,
      width: zones.trimPx.width,
      height: zones.trimPx.height,
      stroke: '#000000',
      name: '__trim_zone',
    })

    // Safe zone (green dashed)
    const safeRect = createZoneRect(f, {
      left: zones.safePx.left,
      top: zones.safePx.top,
      width: zones.safePx.width,
      height: zones.safePx.height,
      stroke: '#22c55e',
      strokeDashArray: [6, 3],
      name: '__safe_zone',
    })

    // Invisible drag handle covering the entire bleed zone — used to move the artboard
    const handle = new f.Rect({
      left: zones.bleedPx.left,
      top: zones.bleedPx.top,
      width: zones.bleedPx.width,
      height: zones.bleedPx.height,
      fill: 'transparent',
      stroke: 'transparent',
      selectable: true,    // movable by default
      evented: true,
      excludeFromExport: true,
      name: '__artboard_handle',
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      hasControls: false,
      hasBorders: true,
      borderColor: '#6366f1',
      borderScaleFactor: 2,
      hoverCursor: 'move',
      moveCursor: 'grabbing',
    })

    this.zoneObjects = [printBg, bleedRect, trimRect, safeRect]
    this.artboardHandle = handle

    this.canvas.add(printBg)
    this.canvas.add(bleedRect)
    this.canvas.add(trimRect)
    this.canvas.add(safeRect)
    this.canvas.add(handle)
    this.canvas.sendObjectToBack(printBg)

    // --- Parse and render template-defined locked zones ---
    this._initLockedZones(fabricModule, template, zones)

    // Move all zone objects together when the handle is dragged
    this.canvas.on('object:moving', this._onHandleMoving)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.canvas as any).on('object:moved', this._onHandleMoved)

    // Tell ZoomPlugin about the zones
    if (this.editor.hasPlugin('ZoomPlugin')) {
      const zoomPlugin = this.editor.getPlugin<{ setZones: (z: CanvasZones) => void }>('ZoomPlugin')
      zoomPlugin.setZones(this.getZones()!)
    }

    return this.getZones()!
  }

  /**
   * Get zones adjusted for current artboard position (offset).
   */
  getZones(): CanvasZones | null {
    if (!this.baseZones) return null
    const ox = this.offsetX
    const oy = this.offsetY
    return {
      bleedPx: {
        left: this.baseZones.bleedPx.left + ox,
        top: this.baseZones.bleedPx.top + oy,
        width: this.baseZones.bleedPx.width,
        height: this.baseZones.bleedPx.height,
      },
      trimPx: {
        left: this.baseZones.trimPx.left + ox,
        top: this.baseZones.trimPx.top + oy,
        width: this.baseZones.trimPx.width,
        height: this.baseZones.trimPx.height,
      },
      safePx: {
        left: this.baseZones.safePx.left + ox,
        top: this.baseZones.safePx.top + oy,
        width: this.baseZones.safePx.width,
        height: this.baseZones.safePx.height,
      },
    }
  }

  /**
   * Lock the artboard — prevents dragging.
   */
  lockArtboard(): void {
    this.locked = true
    if (this.artboardHandle) {
      this.artboardHandle.set({ selectable: false, evented: false })
      this.canvas.discardActiveObject()
      this.canvas.requestRenderAll()
    }
    this.editor.emit('artboard:locked')
  }

  /**
   * Unlock the artboard — allows dragging to reposition.
   */
  unlockArtboard(): void {
    this.locked = false
    if (this.artboardHandle) {
      this.artboardHandle.set({ selectable: true, evented: true })
      this.canvas.requestRenderAll()
    }
    this.editor.emit('artboard:unlocked')
  }

  /**
   * Toggle artboard lock state.
   */
  toggleArtboardLock(): void {
    if (this.locked) {
      this.unlockArtboard()
    } else {
      this.lockArtboard()
    }
  }

  isArtboardLocked(): boolean {
    return this.locked
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
        (obj) => {
          const name = (obj as unknown as { name?: string }).name
          return isZoneGuide(obj as { name?: string }) ||
            name === '__print_bg' ||
            name === '__artboard_handle'
        }
      )
  }

  showZones(): void {
    this.zonesVisible = true
    this.getZoneObjects().forEach((obj) => {
      (obj as { visible: boolean }).visible = true
    })
    this.canvas.requestRenderAll()
  }

  hideZones(): void {
    this.zonesVisible = false
    this.getZoneObjects().forEach((obj) => {
      const name = (obj as { name?: string }).name
      if (name !== '__print_bg' && name !== '__artboard_handle') {
        (obj as { visible: boolean }).visible = false
      }
    })
    this.canvas.requestRenderAll()
  }

  toggleZones(): void {
    if (this.zonesVisible) {
      this.hideZones()
    } else {
      this.showZones()
    }
  }

  areZonesVisible(): boolean {
    return this.zonesVisible
  }

  /**
   * Get locked zones adjusted for current artboard offset.
   * These are passed to SnapPlugin for element-level constraint enforcement.
   */
  getLockedZones(): LockedZonePx[] {
    return this.baseLockedZones.map((z) => ({
      ...z,
      left: z.left + this.offsetX,
      top: z.top + this.offsetY,
    }))
  }

  // --- Private ---

  /**
   * Parse `template_json.locked_zones`, convert mm → canvas px, create visual overlays.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _initLockedZones(fabricModule: any, template: ProductTemplate, zones: CanvasZones): void {
    const tj = template.template_json as Record<string, unknown> | null | undefined
    if (!tj || !Array.isArray(tj.locked_zones) || tj.locked_zones.length === 0) {
      this.baseLockedZones = []
      this.lockedZoneObjects = []
      return
    }

    const dpi = template.dpi || 300
    const scale = getDisplayScale(dpi)

    this.baseLockedZones = []
    this.lockedZoneObjects = []

    for (const raw of tj.locked_zones as Array<Record<string, unknown>>) {
      const xMm = Number(raw.x_mm ?? 0)
      const yMm = Number(raw.y_mm ?? 0)
      const wMm = Number(raw.width_mm ?? 0)
      const hMm = Number(raw.height_mm ?? 0)
      const label = String(raw.label ?? raw.key ?? 'Locked')

      if (wMm <= 0 || hMm <= 0) continue

      // Convert mm offset from trim-area origin to canvas pixels
      const xPx = zones.trimPx.left + mmToPixels(xMm, dpi) * scale
      const yPx = zones.trimPx.top  + mmToPixels(yMm, dpi) * scale
      const wPx = mmToPixels(wMm, dpi) * scale
      const hPx = mmToPixels(hMm, dpi) * scale

      this.baseLockedZones.push({ left: xPx, top: yPx, width: wPx, height: hPx, label })

      // Visual overlay: semi-transparent red fill with dashed border
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const overlay = new (fabricModule as any).Rect({
        left: xPx,
        top: yPx,
        width: wPx,
        height: hPx,
        fill: 'rgba(239,68,68,0.15)',
        stroke: '#ef4444',
        strokeWidth: 1,
        strokeDashArray: [4, 3],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: '__locked_zone',
      })

      // Label text centered on the zone
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = new (fabricModule as any).Text(label, {
        left: xPx + wPx / 2,
        top: yPx + hPx / 2,
        originX: 'center',
        originY: 'center',
        fontSize: Math.max(10, Math.min(14, hPx / 3)),
        fill: '#ef4444',
        fontFamily: 'sans-serif',
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: '__locked_zone',
      })

      this.canvas.add(overlay)
      this.canvas.add(text)
      this.lockedZoneObjects.push(overlay, text)
    }
  }

  private _onHandleMoving = (e: { target: unknown }): void => {
    const handle = this.artboardHandle
    if (!handle || e.target !== handle || !this.baseZones) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = handle as any
    const dx = h.left - (this.baseZones.bleedPx.left + this.offsetX)
    const dy = h.top - (this.baseZones.bleedPx.top + this.offsetY)

    this.offsetX += dx
    this.offsetY += dy

    // Move all zone rects by the same delta (including locked zone overlays)
    this.zoneObjects.forEach((obj) => {
      obj.set({ left: obj.left + dx, top: obj.top + dy })
    })
    this.lockedZoneObjects.forEach((obj) => {
      obj.set({ left: obj.left + dx, top: obj.top + dy })
    })

    this.canvas.requestRenderAll()

    // Notify ZoomPlugin of new zone positions
    if (this.editor.hasPlugin('ZoomPlugin')) {
      const zoomPlugin = this.editor.getPlugin<{ setZones: (z: CanvasZones) => void }>('ZoomPlugin')
      zoomPlugin.setZones(this.getZones()!)
    }
  }

  private _onHandleMoved = (e: { target: unknown }): void => {
    if (e.target !== this.artboardHandle) return
    this.editor.emit('canvas:dirty')
  }
}
