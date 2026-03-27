'use client'

import { useCallback } from 'react'
import {
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
} from 'lucide-react'
import type { FabricObject } from 'fabric'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import {
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
} from '@/lib/editor/fabricUtils'

function getObjectLabel(obj: FabricObject): string {
  const type = obj.type ?? 'object'
  if (type === 'text' || type === 'i-text' || type === 'textbox') {
    const text = (obj as unknown as { text: string }).text
    return text?.slice(0, 20) || 'Text'
  }
  if (type === 'image') return 'Image'
  if (type === 'rect') return 'Rectangle'
  if (type === 'circle') return 'Circle'
  if (type === 'triangle') return 'Triangle'
  if (type === 'line') return 'Line'
  if (type === 'polygon') return 'Star / Polygon'
  if (type === 'group') return 'Group'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export default function LayersPanel() {
  const canvas = useEditorStore((s) => s.canvas)
  const objects = useEditorStore((s) => s.objects)
  const activeObject = useEditorStore((s) => s.activeObject)
  const refreshObjects = useEditorStore((s) => s.refreshObjects)

  const handleSelect = useCallback(
    (obj: FabricObject) => {
      if (!canvas) return
      canvas.setActiveObject(obj)
      canvas.renderAll()
    },
    [canvas]
  )

  const handleToggleVisible = useCallback(
    (obj: FabricObject) => {
      obj.set('visible', !obj.visible)
      canvas?.renderAll()
      refreshObjects()
    },
    [canvas, refreshObjects]
  )

  const handleToggleLock = useCallback(
    (obj: FabricObject) => {
      const locked = !obj.selectable
      obj.set({
        selectable: !locked ? false : true,
        evented: !locked ? false : true,
        lockMovementX: !locked,
        lockMovementY: !locked,
        lockRotation: !locked,
        lockScalingX: !locked,
        lockScalingY: !locked,
      })
      canvas?.renderAll()
      refreshObjects()
    },
    [canvas, refreshObjects]
  )

  const handleDelete = useCallback(
    (obj: FabricObject) => {
      if (!canvas) return
      canvas.remove(obj)
      canvas.discardActiveObject()
      canvas.renderAll()
    },
    [canvas]
  )

  const reversedObjects = [...objects].reverse()
  const layerBtn = 'p-1 rounded hover:bg-ed-surface-hover text-ed-text-dim hover:text-ed-text-muted transition-colors'

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-ed-border">
        <h3 className="text-sm font-semibold text-ed-text">Layers</h3>
      </div>

      {activeObject && canvas && (
        <div className="flex gap-0.5 px-3 py-1.5 border-b border-ed-border">
          <button onClick={() => { bringToFront(canvas); refreshObjects() }} title="Bring to Front" className={layerBtn}>
            <ChevronsUp size={14} />
          </button>
          <button onClick={() => { bringForward(canvas); refreshObjects() }} title="Bring Forward" className={layerBtn}>
            <ArrowUp size={14} />
          </button>
          <button onClick={() => { sendBackward(canvas); refreshObjects() }} title="Send Backward" className={layerBtn}>
            <ArrowDown size={14} />
          </button>
          <button onClick={() => { sendToBack(canvas); refreshObjects() }} title="Send to Back" className={layerBtn}>
            <ChevronsDown size={14} />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto editor-scrollbar">
        {reversedObjects.length === 0 && (
          <p className="text-xs text-ed-text-dim px-3 py-4 text-center">No objects on canvas</p>
        )}
        {reversedObjects.map((obj, idx) => {
          const isActive = obj === activeObject
          return (
            <div
              key={idx}
              onClick={() => handleSelect(obj)}
              className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer border-b border-ed-border/50 text-sm transition-colors ${
                isActive ? 'bg-ed-accent/10 text-ed-accent' : 'text-ed-text-muted hover:bg-ed-surface-hover'
              }`}
            >
              <span className="flex-1 truncate text-xs">{getObjectLabel(obj)}</span>
              <button onClick={(e) => { e.stopPropagation(); handleToggleVisible(obj) }} className="p-0.5 hover:text-ed-text transition-colors" title={obj.visible !== false ? 'Hide' : 'Show'}>
                {obj.visible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleToggleLock(obj) }} className="p-0.5 hover:text-ed-text transition-colors" title={obj.selectable !== false ? 'Lock' : 'Unlock'}>
                {obj.selectable !== false ? <Unlock size={12} /> : <Lock size={12} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(obj) }} className="p-0.5 hover:text-red-400 transition-colors" title="Delete">
                <Trash2 size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
