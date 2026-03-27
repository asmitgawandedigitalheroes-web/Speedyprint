'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Copy,
  Trash2,
  Layers,
  Layers2,
  FlipHorizontal2,
  FlipVertical2,
  Lock,
  AlignCenter,
  Type,
} from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import {
  duplicateSelected,
  deleteSelected,
  bringForward,
  sendBackward,
  flipHorizontal,
  flipVertical,
  centerOnArtboard,
  toggleLock,
} from '@/lib/editor/fabricUtils'

interface ToolbarPos {
  x: number
  y: number
}

export default function FloatingToolbar() {
  const canvas = useEditorStore((s) => s.canvas)
  const activeObject = useEditorStore((s) => s.activeObject)
  const [pos, setPos] = useState<ToolbarPos | null>(null)

  const updatePosition = useCallback(() => {
    if (!canvas || !activeObject) {
      setPos(null)
      return
    }

    const bound = activeObject.getBoundingRect()
    const vpt = canvas.viewportTransform
    if (!vpt) return

    // Transform object coords to screen coords
    const screenX = bound.left * vpt[0] + vpt[4]
    const screenY = bound.top * vpt[3] + vpt[5]
    const screenW = bound.width * vpt[0]

    setPos({
      x: screenX + screenW / 2,
      y: screenY - 48,
    })
  }, [canvas, activeObject])

  useEffect(() => {
    updatePosition()
  }, [updatePosition])

  useEffect(() => {
    if (!canvas) return
    const handler = () => updatePosition()
    canvas.on('object:moving', handler)
    canvas.on('object:scaling', handler)
    canvas.on('object:rotating', handler)
    canvas.on('object:modified', handler)
    return () => {
      canvas.off('object:moving', handler)
      canvas.off('object:scaling', handler)
      canvas.off('object:rotating', handler)
      canvas.off('object:modified', handler)
    }
  }, [canvas, updatePosition])

  if (!pos || !canvas || !activeObject) return null

  const isText =
    activeObject.type === 'text' ||
    activeObject.type === 'i-text' ||
    activeObject.type === 'textbox'

  const isMobile = useIsMobile()

  const btnClass = `p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors ${
    isMobile ? 'p-2.5' : 'p-1.5'
  }`
  const iconSize = isMobile ? 20 : 16

  return (
    <div
      className="absolute z-30 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-lg px-1 py-0.5"
      style={{
        left: pos.x,
        top: Math.max(4, pos.y),
        transform: 'translateX(-50%)',
        pointerEvents: 'auto',
      }}
    >
      <button onClick={() => duplicateSelected(canvas)} title="Duplicate" className={btnClass}>
        <Copy size={iconSize} />
      </button>
      <button onClick={() => deleteSelected(canvas)} title="Delete (DEL)" className={btnClass}>
        <Trash2 size={iconSize} />
      </button>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      <button onClick={() => bringForward(canvas)} title="Bring Forward" className={btnClass}>
        <Layers size={iconSize} />
      </button>
      <button onClick={() => sendBackward(canvas)} title="Send Backward" className={btnClass}>
        <Layers2 size={iconSize} />
      </button>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      <button onClick={() => flipHorizontal(canvas)} title="Flip Horizontal" className={btnClass}>
        <FlipHorizontal2 size={iconSize} />
      </button>
      <button onClick={() => flipVertical(canvas)} title="Flip Vertical" className={btnClass}>
        <FlipVertical2 size={iconSize} />
      </button>

      {isText && (
        <>
          <div className="w-px h-5 bg-gray-200 mx-0.5" />
          <button
            onClick={() => {
              canvas.setActiveObject(activeObject)
              ;(activeObject as unknown as { enterEditing: () => void }).enterEditing?.()
              canvas.renderAll()
            }}
            title="Edit Text"
            className={btnClass}
          >
            <Type size={iconSize} />
          </button>
        </>
      )}

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      <button onClick={() => centerOnArtboard(canvas)} title="Center on Artboard" className={btnClass}>
        <AlignCenter size={iconSize} />
      </button>
      <button onClick={() => toggleLock(canvas)} title="Lock/Unlock" className={btnClass}>
        <Lock size={iconSize} />
      </button>
    </div>
  )
}
