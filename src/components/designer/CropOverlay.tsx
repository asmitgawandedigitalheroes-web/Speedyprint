'use client'

/**
 * CropOverlay — Image crop tool with draggable rectangle and apply/cancel.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Check, X, Lock, Unlock } from 'lucide-react'
import { FabricImage, Rect as FabricRect } from 'fabric'
import { useEditorStore } from '@/lib/designer/store'

interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

interface CropOverlayProps {
  open: boolean
  onClose: () => void
}

export function CropOverlay({ open, onClose }: CropOverlayProps) {
  const editor = useEditorStore((s) => s.editor)
  const activeObjects = useEditorStore((s) => s.activeObjects)
  const [lockAspect, setLockAspect] = useState(false)
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 100, height: 100 })
  const originalImageRef = useRef<{ left: number; top: number; width: number; height: number; scaleX: number; scaleY: number } | null>(null)

  const activeImage = activeObjects.length === 1 && activeObjects[0] instanceof FabricImage
    ? activeObjects[0]
    : null

  // Initialize crop rect from image bounds
  useEffect(() => {
    if (!activeImage || !open) return

    const left = activeImage.left || 0
    const top = activeImage.top || 0
    const w = (activeImage.width || 100) * (activeImage.scaleX || 1)
    const h = (activeImage.height || 100) * (activeImage.scaleY || 1)

    originalImageRef.current = {
      left,
      top,
      width: activeImage.width || 100,
      height: activeImage.height || 100,
      scaleX: activeImage.scaleX || 1,
      scaleY: activeImage.scaleY || 1,
    }

    setCropRect({
      x: left,
      y: top,
      width: w,
      height: h,
    })
  }, [activeImage, open])

  const handleApply = useCallback(() => {
    if (!activeImage || !editor) return

    // Save history
    if (editor.hasPlugin('HistoryPlugin')) {
      editor.getPlugin<{ saveState: () => void }>('HistoryPlugin').saveState()
    }

    const orig = originalImageRef.current
    if (!orig) return

    // Calculate clip path relative to the image
    const scaleX = orig.scaleX
    const scaleY = orig.scaleY

    const clipX = (cropRect.x - (activeImage.left || 0)) / scaleX
    const clipY = (cropRect.y - (activeImage.top || 0)) / scaleY
    const clipW = cropRect.width / scaleX
    const clipH = cropRect.height / scaleY

    // Apply clipPath
    const clipRect = new FabricRect({
      left: clipX,
      top: clipY,
      width: clipW,
      height: clipH,
      absolutePositioned: false,
    })

    activeImage.clipPath = clipRect
    activeImage.dirty = true

    const canvas = editor.canvas
    canvas.requestRenderAll()
    editor.emit('canvas:dirty')

    onClose()
  }, [activeImage, editor, cropRect, onClose])

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  if (!open || !activeImage) return null

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Controls bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-xl border">
        <span className="text-sm font-medium text-gray-700 mr-2">Crop Image</span>

        <button
          onClick={() => setLockAspect(!lockAspect)}
          className={`rounded p-1.5 transition-colors ${
            lockAspect ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'
          }`}
          title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
        >
          {lockAspect ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </button>

        <div className="h-5 w-px bg-gray-200" />

        {/* Dimension inputs */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-gray-500">W:</span>
          <input
            type="number"
            value={Math.round(cropRect.width)}
            onChange={(e) => {
              const w = Number(e.target.value) || 1
              setCropRect((prev) => ({
                ...prev,
                width: w,
                height: lockAspect ? w * (prev.height / prev.width) : prev.height,
              }))
            }}
            className="w-16 rounded border px-1.5 py-0.5 text-xs"
          />
          <span className="text-gray-500 ml-1">H:</span>
          <input
            type="number"
            value={Math.round(cropRect.height)}
            onChange={(e) => {
              const h = Number(e.target.value) || 1
              setCropRect((prev) => ({
                ...prev,
                height: h,
                width: lockAspect ? h * (prev.width / prev.height) : prev.width,
              }))
            }}
            className="w-16 rounded border px-1.5 py-0.5 text-xs"
          />
        </div>

        <div className="h-5 w-px bg-gray-200" />

        <button
          onClick={handleCancel}
          className="flex items-center gap-1 rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="flex items-center gap-1 rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
        >
          <Check className="h-4 w-4" />
          Apply
        </button>
      </div>
    </div>
  )
}
