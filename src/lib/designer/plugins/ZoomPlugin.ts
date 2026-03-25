/**
 * ZoomPlugin — Centered zoom controls for the canvas (pan disabled).
 * The design area stays centered in the viewport at all times.
 */

import { Point, type Canvas as FabricCanvas } from 'fabric'
import type { CanvasZones } from '../canvas-utils'
import { useEditorStore } from '../store'
import type { IPluginTempl, IEditor, IShortcut } from '../types'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.1

export class ZoomPlugin implements IPluginTempl {
  pluginName = 'ZoomPlugin'
  canvas: FabricCanvas
  editor: IEditor

  private zones: CanvasZones | null = null

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  setup(): void {
    // Mouse wheel zoom — always centered on the design, not the mouse pointer
    this.canvas.on('mouse:wheel', this._onWheelCentered as unknown as (e: unknown) => void)

    // Space key disabled — no pan mode
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)

    // Mouse position tracking for status bar
    this.canvas.on('mouse:move', this._onMouseTrack as unknown as (e: unknown) => void)
  }

  destroy(): void {
    this.canvas.off('mouse:wheel', this._onWheelCentered as unknown as (e: unknown) => void)
    this.canvas.off('mouse:move', this._onMouseTrack as unknown as (e: unknown) => void)
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
  }

  /**
   * Set the zones reference (needed for centered zoom calculations).
   */
  setZones(zones: CanvasZones): void {
    this.zones = zones
    // Initial centering of the design
    this.zoomToFit()
  }

  // --- Public API ---

  /**
   * Zoom in by one step, keeping the design centered in the viewport.
   */
  zoomIn(): void {
    const newZoom = Math.min(this.canvas.getZoom() + ZOOM_STEP, MAX_ZOOM)
    this._applyZoomCentered(newZoom)
    this._updateZoom(newZoom)
  }

  /**
   * Zoom out by one step, keeping the design centered in the viewport.
   */
  zoomOut(): void {
    const newZoom = Math.max(this.canvas.getZoom() - ZOOM_STEP, MIN_ZOOM)
    this._applyZoomCentered(newZoom)
    this._updateZoom(newZoom)
  }

  /**
   * Set zoom to a specific level, keeping the design centered in the viewport.
   */
  setZoom(level: number): void {
    const clampedZoom = Math.min(Math.max(level, MIN_ZOOM), MAX_ZOOM)
    this._applyZoomCentered(clampedZoom)
    this._updateZoom(clampedZoom)
  }

  /**
   * Fit the canvas to the container.
   * The canvas HTML element IS the viewport (sized to match the container),
   * so we use canvas.width/height directly to compute the fit zoom.
   */
  zoomToFit(): void {
    const zones = this.zones
    if (!zones) return

    // canvas.width/height are the CSS-pixel dimensions of the canvas element,
    // which are kept in sync with the container via ResizeObserver.
    const vpW = this.canvas.width
    const vpH = this.canvas.height

    if (!vpW || !vpH || vpW <= 0 || vpH <= 0) return

    const designW = zones.bleedPx.width
    const designH = zones.bleedPx.height

    const padding = 40
    const scaleX = (vpW - padding) / designW
    const scaleY = (vpH - padding) / designH
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), MIN_ZOOM), MAX_ZOOM)

    const offsetX = (vpW - designW * newZoom) / 2
    const offsetY = (vpH - designH * newZoom) / 2

    this.canvas.setViewportTransform([newZoom, 0, 0, newZoom, offsetX, offsetY])
    this._updateZoom(newZoom)
  }

  /**
   * Reset to centered view.
   */
  resetPan(): void {
    this.zoomToFit()
  }

  /**
   * Get current zoom level.
   */
  getZoom(): number {
    return this.canvas.getZoom()
  }

  getShortcuts(): IShortcut[] {
    return [
      {
        keys: 'ctrl+=',
        label: 'Zoom In',
        action: () => this.zoomIn(),
        group: 'View',
      },
      {
        keys: 'ctrl+-',
        label: 'Zoom Out',
        action: () => this.zoomOut(),
        group: 'View',
      },
      {
        keys: 'ctrl+0',
        label: 'Fit to Screen',
        action: () => this.zoomToFit(),
        group: 'View',
      },
    ]
  }

  // --- Event handlers ---

  private _onWheelCentered = (opt: { e: WheelEvent }): void => {
    const evt = opt.e
    evt.preventDefault()
    evt.stopPropagation()

    const delta = evt.deltaY
    let newZoom = this.canvas.getZoom()
    newZoom *= 0.999 ** delta
    newZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM)

    // Always apply zoom centered on the design (not the mouse pointer)
    this._applyZoomCentered(newZoom)
    this._updateZoom(newZoom)
  }

  private _onMouseTrack = (opt: { e: MouseEvent }): void => {
    const evt = opt.e
    const store = useEditorStore.getState()
    store.setMousePosition({ x: evt.offsetX, y: evt.offsetY })
  }

  private _onKeyDown = (e: KeyboardEvent): void => {
    // Space key disabled - no pan mode
    if (e.code === 'Space') {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }
      e.preventDefault()
    }
  }

  private _onKeyUp = (e: KeyboardEvent): void => {
    // Space key disabled - no pan mode
    if (e.code === 'Space') {
      // No-op: space key doesn't enable panning
    }
  }

  // --- Private ---

  /**
   * Apply zoom while keeping the design centered in the viewport.
   * Used by zoomIn/zoomOut/setZoom buttons so the design never drifts off-screen.
   */
  private _applyZoomCentered(zoom: number): void {
    const vpW = this.canvas.width
    const vpH = this.canvas.height
    if (!vpW || !vpH) return

    if (this.zones) {
      const designW = this.zones.bleedPx.width
      const designH = this.zones.bleedPx.height
      const offsetX = (vpW - designW * zoom) / 2
      const offsetY = (vpH - designH * zoom) / 2
      this.canvas.setViewportTransform([zoom, 0, 0, zoom, offsetX, offsetY])
    } else {
      // Fallback: zoom to canvas center
      const cx = vpW / 2
      const cy = vpH / 2
      this.canvas.zoomToPoint(new Point(cx, cy), zoom)
    }
  }

  private _updateZoom(zoom: number): void {
    const store = useEditorStore.getState()
    store.setZoom(zoom)
    this.editor.emit('canvas:zoom:changed', zoom)
  }
}
