'use client'

import { useEditorStore } from '@/lib/designer/store'
import { pixelsToMm } from '@/lib/designer/canvas-utils'
import { cn } from '@/lib/utils'
import { Grid3X3, Ruler, Mouse } from 'lucide-react'

export function StatusBar() {
  const zoom = useEditorStore((s) => s.zoom)
  const mousePosition = useEditorStore((s) => s.mousePosition)
  const canvasDimensions = useEditorStore((s) => s.canvasDimensions)
  const activeObjects = useEditorStore((s) => s.activeObjects)
  const showRulers = useEditorStore((s) => s.showRulers)
  const showGrid = useEditorStore((s) => s.showGrid)
  const toggleRulers = useEditorStore((s) => s.toggleRulers)
  const toggleGrid = useEditorStore((s) => s.toggleGrid)
  const editor = useEditorStore((s) => s.editor)

  const objectCount = editor?.canvas
    ? editor.canvas.getObjects().filter(
        (obj) =>
          (obj as unknown as { name?: string }).name !== '__bleed_zone' &&
          (obj as unknown as { name?: string }).name !== '__trim_zone' &&
          (obj as unknown as { name?: string }).name !== '__safe_zone' &&
          (obj as unknown as { name?: string }).name !== '__print_bg' &&
          (obj as unknown as { name?: string }).name !== '__alignment_guide'
      ).length
    : 0

  return (
    <div className="flex h-8 shrink-0 items-center justify-between border-t bg-muted/50 px-3 text-xs text-muted-foreground">
      {/* Left: mouse position */}
      <div className="flex items-center gap-4">
        {mousePosition && (
          <div className="flex items-center gap-1.5">
            <Mouse className="h-3 w-3" />
            <span>
              X: {pixelsToMm(mousePosition.x).toFixed(1)}mm
            </span>
            <span>
              Y: {pixelsToMm(mousePosition.y).toFixed(1)}mm
            </span>
          </div>
        )}
        {canvasDimensions && (
          <span>
            {pixelsToMm(canvasDimensions.width).toFixed(0)} x{' '}
            {pixelsToMm(canvasDimensions.height).toFixed(0)} mm
          </span>
        )}
      </div>

      {/* Center: zoom */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={10}
          max={500}
          value={Math.round(zoom * 100)}
          onChange={(e) => {
            const newZoom = parseInt(e.target.value) / 100
            const zoomPlugin = editor?.getPlugin<{ setZoom: (z: number) => void }>('ZoomPlugin')
            zoomPlugin?.setZoom(newZoom)
          }}
          className="h-1 w-24 cursor-pointer accent-primary"
        />
        <span className="min-w-[3rem] text-center font-mono">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Right: object count + toggles */}
      <div className="flex items-center gap-3">
        <span>
          {objectCount} object{objectCount !== 1 ? 's' : ''}
          {activeObjects.length > 0 && ` (${activeObjects.length} selected)`}
        </span>
        <button
          type="button"
          onClick={toggleGrid}
          className={cn(
            'rounded p-0.5 hover:bg-accent',
            showGrid && 'bg-accent text-accent-foreground'
          )}
          title="Toggle Grid"
        >
          <Grid3X3 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={toggleRulers}
          className={cn(
            'rounded p-0.5 hover:bg-accent',
            showRulers && 'bg-accent text-accent-foreground'
          )}
          title="Toggle Rulers"
        >
          <Ruler className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
