'use client'

import { useEffect, useState } from 'react'
import { useEditorStore } from '@/lib/editor/useEditorStore'

interface CursorInfo { x: number; y: number }
interface SelectionInfo { width: number; height: number }

function pxToMm(px: number, dpi: number): number {
  return (px / dpi) * 25.4
}

export default function StatusBar() {
  const canvas = useEditorStore((s) => s.canvas)
  const activeObject = useEditorStore((s) => s.activeObject)
  const canvasDimensions = useEditorStore((s) => s.canvasDimensions)
  const template = useEditorStore((s) => s.template)
  const artboardWidth = useEditorStore((s) => s.artboardWidth)
  const zoom = useEditorStore((s) => s.zoom)
  const objects = useEditorStore((s) => s.objects)

  const [cursor, setCursor] = useState<CursorInfo>({ x: 0, y: 0 })
  const [selection, setSelection] = useState<SelectionInfo | null>(null)

  // Compute display DPI: artboardWidth (px) / total width (mm) * 25.4
  const totalWidthMm = (template?.print_width_mm ?? 210) + (template?.bleed_mm ?? 0) * 2
  const displayDpi = (artboardWidth / totalWidthMm) * 25.4
  
  const dpi = displayDpi || 96

  useEffect(() => {
    if (!canvas) return
    const handleMouseMove = (opt: unknown) => {
      const event = opt as { e: MouseEvent | TouchEvent }
      if ('clientX' in event.e) {
        const pointer = canvas.getScenePoint(event.e as MouseEvent)
        setCursor({ x: pointer.x, y: pointer.y })
      }
    }
    canvas.on('mouse:move', handleMouseMove as never)
    // Also update selection to show relative coordinates
    const handleSelection = () => {
      if (!activeObject) { setSelection(null); return }
      const bound = activeObject.getBoundingRect()
      // Find artboard for relative positioning if needed, but getBoundingRect is already absolute.
      // However, we want to know its width/height in mm.
      setSelection({ width: bound.width, height: bound.height })
    }
    canvas.on('selection:created', handleSelection)
    canvas.on('selection:updated', handleSelection)
    canvas.on('selection:cleared', () => setSelection(null))
    
    return () => { 
      canvas.off('mouse:move', handleMouseMove as never)
      canvas.off('selection:created', handleSelection)
      canvas.off('selection:updated', handleSelection)
      canvas.off('selection:cleared', () => setSelection(null))
    }
  }, [canvas, activeObject])

  // Get artboard offset for relative mouse coordinates
  const artboard = canvas?.getObjects().find(o => (o as any).isArtboard)
  const offsetX = artboard?.left ?? 0
  const offsetY = artboard?.top ?? 0

  const xMm = pxToMm(cursor.x, dpi).toFixed(1)
  const yMm = pxToMm(cursor.y, dpi).toFixed(1)
  const selW = selection ? pxToMm(selection.width, dpi).toFixed(0) : null
  const selH = selection ? pxToMm(selection.height, dpi).toFixed(0) : null

  return (
    <div className="h-7 bg-ed-bg border-t border-ed-border flex items-center px-3 gap-4 text-[11px] text-ed-text-dim font-mono flex-shrink-0">
      <span>
        <span className="text-ed-text-muted">{objects.length}</span> objects
      </span>

      <div className="w-px h-3.5 bg-ed-border" />

      <span>
        X: <span className="text-ed-text-muted">{xMm}mm</span>
      </span>
      <span>
        Y: <span className="text-ed-text-muted">{yMm}mm</span>
      </span>

      {selW && selH && (
        <>
          <div className="w-px h-3.5 bg-ed-border" />
          <span className="text-ed-text-muted">{selW} x {selH} mm</span>
        </>
      )}

      <div className="flex-1" />

      {template && (
        <span>{template.print_width_mm}x{template.print_height_mm}mm</span>
      )}

      <span>{Math.round(zoom * 100)}%</span>
    </div>
  )
}
