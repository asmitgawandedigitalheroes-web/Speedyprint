import type { Canvas as FabricCanvas } from 'fabric'

/**
 * Debounced history manager for Fabric.js canvas.
 * Captures canvas state as JSON and manages undo/redo via callback.
 */
export class HistoryManager {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private debounceMs: number
  private onSave: (json: string) => void
  private isPaused = false

  constructor(onSave: (json: string) => void, debounceMs = 300) {
    this.onSave = onSave
    this.debounceMs = debounceMs
  }

  /** Capture the current canvas state (debounced) */
  capture(canvas: FabricCanvas) {
    if (this.isPaused) return
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      // @ts-ignore - include custom props so isArtboard/rawText survive undo/redo
      const json = JSON.stringify(canvas.toJSON(['isArtboard', 'rawText']))
      this.onSave(json)
    }, this.debounceMs)
  }

  /** Capture immediately without debounce */
  captureImmediate(canvas: FabricCanvas) {
    if (this.isPaused) return
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    // @ts-ignore - include custom props so isArtboard/rawText survive undo/redo
    const json = JSON.stringify(canvas.toJSON(['isArtboard', 'rawText']))
    this.onSave(json)
  }

  /** Pause history recording (e.g. during undo/redo load) */
  pause() {
    this.isPaused = true
  }

  /** Resume history recording */
  resume() {
    this.isPaused = false
  }

  /** Clean up timer */
  dispose() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
  }
}
