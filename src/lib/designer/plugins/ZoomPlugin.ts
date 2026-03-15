/**
 * ZoomPlugin — Zoom and pan controls for the canvas.
 * Ported from DesignerCanvas.tsx zoom/pan logic.
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

  private isPanning = false
  private lastPanPoint: { x: number; y: number } | null = null
  private spaceHeld = false
  private zones: CanvasZones | null = null
  private containerEl: HTMLElement | null = null

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  setup(): void {
    // Mouse wheel zoom
    this.canvas.on('mouse:wheel', this._onWheel as unknown as (e: unknown) => void)

    // Pan with middle mouse or space+drag
    this.canvas.on('mouse:down', this._onMouseDown as unknown as (e: unknown) => void)
    this.canvas.on('mouse:move', this._onMouseMove as unknown as (e: unknown) => void)
    this.canvas.on('mouse:up', this._onMouseUp)

    // Space key for pan mode
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)

    // Mouse position tracking for status bar
    this.canvas.on('mouse:move', this._onMouseTrack as unknown as (e: unknown) => void)
  }

  destroy(): void {
    this.canvas.off('mouse:wheel', this._onWheel as unknown as (e: unknown) => void)
    this.canvas.off('mouse:down', this._onMouseDown as unknown as (e: unknown) => void)
    this.canvas.off('mouse:move', this._onMouseMove as unknown as (e: unknown) => void)
    this.canvas.off('mouse:up', this._onMouseUp)
    this.canvas.off('mouse:move', this._onMouseTrack as unknown as (e: unknown) => void)
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
  }

  /**
   * Set the zones reference (needed for fitToScreen calculations).
   */
  setZones(zones: CanvasZones): void {
    this.zones = zones
  }

  /**
   * Set the container element for fitToScreen.
   */
  setContainer(el: HTMLElement): void {
    this.containerEl = el
  }

  // --- Public API ---

  /**
   * Zoom in by one step.
   */
  zoomIn(): void {
    const center = this.canvas.getCenterPoint()
    const newZoom = Math.min(this.canvas.getZoom() + ZOOM_STEP, MAX_ZOOM)
    this.canvas.zoomToPoint(center, newZoom)
    this._updateZoom(newZoom)
  }

  /**
   * Zoom out by one step.
   */
  zoomOut(): void {
    const center = this.canvas.getCenterPoint()
    const newZoom = Math.max(this.canvas.getZoom() - ZOOM_STEP, MIN_ZOOM)
    this.canvas.zoomToPoint(center, newZoom)
    this._updateZoom(newZoom)
  }

  /**
   * Set zoom to a specific level.
   */
  setZoom(level: number): void {
    const center = this.canvas.getCenterPoint()
    const clampedZoom = Math.min(Math.max(level, MIN_ZOOM), MAX_ZOOM)
    this.canvas.zoomToPoint(center, clampedZoom)
    this._updateZoom(clampedZoom)
  }

  /**
   * Fit the canvas to the container.
   */
  zoomToFit(): void {
    const zones = this.zones
    const container = this.containerEl
    if (!zones || !container) return

    const containerWidth = container.clientWidth - 40
    const containerHeight = container.clientHeight - 40

    const canvasWidth = zones.bleedPx.width
    const canvasHeight = zones.bleedPx.height

    const scaleX = containerWidth / canvasWidth
    const scaleY = containerHeight / canvasHeight
    const newZoom = Math.min(scaleX, scaleY, 1)

    const vpWidth = containerWidth
    const vpHeight = containerHeight
    const offsetX = (vpWidth - canvasWidth * newZoom) / 2
    const offsetY = (vpHeight - canvasHeight * newZoom) / 2

    this.canvas.setViewportTransform([newZoom, 0, 0, newZoom, offsetX, offsetY])
    this._updateZoom(newZoom)
  }

  /**
   * Reset pan (center the canvas).
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

  private _onWheel = (opt: { e: WheelEvent }): void => {
    const evt = opt.e
    evt.preventDefault()
    evt.stopPropagation()

    const delta = evt.deltaY
    let newZoom = this.canvas.getZoom()
    newZoom *= 0.999 ** delta
    newZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM)

    const point = new Point(evt.offsetX, evt.offsetY)
    this.canvas.zoomToPoint(point, newZoom)
    this._updateZoom(newZoom)
  }

  private _onMouseDown = (opt: { e: MouseEvent }): void => {
    const evt = opt.e
    if (evt.button === 1 || this.spaceHeld) {
      this.isPanning = true
      this.lastPanPoint = { x: evt.clientX, y: evt.clientY }
      this.canvas.selection = false
      this.canvas.defaultCursor = 'grab'
      evt.preventDefault()
      evt.stopPropagation()
    }
  }

  private _onMouseMove = (opt: { e: MouseEvent }): void => {
    if (!this.isPanning || !this.lastPanPoint) return

    const evt = opt.e
    const vpt = this.canvas.viewportTransform
    if (!vpt) return

    const dx = evt.clientX - this.lastPanPoint.x
    const dy = evt.clientY - this.lastPanPoint.y

    vpt[4] += dx
    vpt[5] += dy

    this.lastPanPoint = { x: evt.clientX, y: evt.clientY }
    this.canvas.requestRenderAll()
  }

  private _onMouseUp = (): void => {
    if (this.isPanning) {
      this.isPanning = false
      this.lastPanPoint = null
      this.canvas.selection = true
      this.canvas.defaultCursor = 'default'
      this.canvas.setViewportTransform(this.canvas.viewportTransform!)
    }
  }

  private _onMouseTrack = (opt: { e: MouseEvent }): void => {
    const evt = opt.e
    const store = useEditorStore.getState()
    store.setMousePosition({ x: evt.offsetX, y: evt.offsetY })
  }

  private _onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space' && !e.repeat) {
      this.spaceHeld = true
      this.canvas.defaultCursor = 'grab'

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
    if (e.code === 'Space') {
      this.spaceHeld = false
      if (!this.isPanning) {
        this.canvas.defaultCursor = 'default'
      }
    }
  }

  // --- Private ---

  private _updateZoom(zoom: number): void {
    const store = useEditorStore.getState()
    store.setZoom(zoom)
    this.editor.emit('canvas:zoom:changed', zoom)
  }
}
