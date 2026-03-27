'use client'

import { useRef, useCallback } from 'react'
import {
  Square,
  Circle,
  Triangle,
  Minus,
  Star,
  Upload,
} from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import {
  addRect,
  addCircle,
  addTriangle,
  addLine,
  addStar,
  addImage,
} from '@/lib/editor/fabricUtils'

interface ShapeItem {
  id: string
  label: string
  icon: React.ReactNode
  action: (canvas: import('fabric').Canvas) => void
  color: string
}

const SHAPES: ShapeItem[] = [
  { id: 'rect', label: 'Rectangle', icon: <Square size={22} />, action: addRect, color: '#4F46E5' },
  { id: 'circle', label: 'Circle', icon: <Circle size={22} />, action: addCircle, color: '#059669' },
  { id: 'triangle', label: 'Triangle', icon: <Triangle size={22} />, action: addTriangle, color: '#DC2626' },
  { id: 'line', label: 'Line', icon: <Minus size={22} />, action: addLine, color: '#9AA0AB' },
  { id: 'star', label: 'Star', icon: <Star size={22} />, action: addStar, color: '#F59E0B' },
]

export default function AddPanel() {
  const canvas = useEditorStore((s) => s.canvas)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && canvas) addImage(canvas, file)
      e.target.value = ''
    },
    [canvas]
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2">
        <h2 className="text-sm font-semibold text-ed-text">Add Elements</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 editor-scrollbar">
        <p className="editor-section-title">Image</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-5 mb-4 border-2 border-dashed border-ed-border rounded-lg hover:border-ed-accent/40 hover:bg-ed-accent/5 transition-all group"
        >
          <Upload size={18} className="text-ed-text-dim group-hover:text-ed-accent" />
          <span className="text-xs text-ed-text-dim group-hover:text-ed-accent font-medium">
            Upload Image
          </span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        <p className="editor-section-title">Shapes</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {SHAPES.map((shape) => (
            <button
              key={shape.id}
              onClick={() => canvas && shape.action(canvas)}
              className="flex flex-col items-center gap-1.5 py-3 px-2 bg-ed-bg border border-ed-border rounded-lg hover:border-ed-border-light hover:bg-ed-surface-hover transition-all group"
            >
              <div className="group-hover:scale-110 transition-transform" style={{ color: shape.color }}>
                {shape.icon}
              </div>
              <span className="text-[10px] text-ed-text-dim font-medium">{shape.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-ed-accent/5 border border-ed-accent/15 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-ed-accent mb-1">Quick Tips</p>
          <ul className="text-[10px] text-ed-text-dim space-y-0.5">
            <li>Drag to move objects on canvas</li>
            <li>Use corner handles to resize</li>
            <li>Press Delete to remove selected</li>
            <li>Ctrl+Z to undo, Ctrl+Y to redo</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
