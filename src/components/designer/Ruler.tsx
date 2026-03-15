'use client'

/**
 * Ruler — Canvas-based horizontal and vertical rulers.
 * Syncs with zoom/pan via RulerPlugin.
 */

import { useRef, useEffect, useCallback } from 'react'
import { useEditorStore } from '@/lib/designer/store'

interface RulerProps {
  orientation: 'horizontal' | 'vertical'
  size?: number
}

export function Ruler({ orientation, size = 24 }: RulerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const editor = useEditorStore((s) => s.editor)
  const showRulers = useEditorStore((s) => s.showRulers)

  const attachPlugin = useCallback(() => {
    if (!editor || !canvasRef.current) return

    const plugin = editor.getPlugin<{
      attachCanvases: (h: HTMLCanvasElement, v: HTMLCanvasElement) => void
      detachCanvases: () => void
      refresh: () => void
    }>('RulerPlugin')

    if (!plugin) return

    // For now, each ruler component handles its own canvas
    // The plugin's attachCanvases method is called from the parent container
    // that owns both rulers
    plugin.refresh()
  }, [editor])

  // Resize canvas to match container
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (orientation === 'horizontal') {
          canvas.width = width
          canvas.height = size
        } else {
          canvas.width = size
          canvas.height = height
        }
        attachPlugin()
      }
    })

    resizeObserver.observe(canvas.parentElement || canvas)
    return () => resizeObserver.disconnect()
  }, [orientation, size, attachPlugin])

  if (!showRulers) return null

  return (
    <canvas
      ref={canvasRef}
      className={
        orientation === 'horizontal'
          ? 'w-full bg-gray-50 border-b border-gray-200'
          : 'h-full bg-gray-50 border-r border-gray-200'
      }
      style={
        orientation === 'horizontal'
          ? { height: size }
          : { width: size }
      }
    />
  )
}

/**
 * RulerCorner — Small square at the top-left corner where rulers meet.
 */
export function RulerCorner({ size = 24 }: { size?: number }) {
  const showRulers = useEditorStore((s) => s.showRulers)
  const editor = useEditorStore((s) => s.editor)

  const handleClick = () => {
    if (!editor) return
    const plugin = editor.getPlugin<{
      getUnit: () => 'mm' | 'px'
      setUnit: (u: 'mm' | 'px') => void
    }>('RulerPlugin')
    if (!plugin) return

    const current = plugin.getUnit()
    plugin.setUnit(current === 'mm' ? 'px' : 'mm')
  }

  if (!showRulers) return null

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center bg-gray-50 border-b border-r border-gray-200 text-[9px] font-medium text-gray-400 hover:bg-gray-100"
      style={{ width: size, height: size }}
      title="Toggle units (mm/px)"
    >
      mm
    </button>
  )
}
