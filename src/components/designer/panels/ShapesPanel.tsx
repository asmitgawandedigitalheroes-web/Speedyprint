'use client'

/**
 * ShapesPanel — Grid of shape thumbnails for adding to the canvas.
 */

import {
  Square,
  Circle,
  Triangle,
  Minus,
  Pentagon,
  Star,
  ArrowRight,
  RectangleHorizontal,
  Pencil,
} from 'lucide-react'
import { useEditorStore } from '@/lib/designer/store'

interface ShapeItem {
  type: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  options?: Record<string, unknown>
}

const SHAPES: ShapeItem[] = [
  { type: 'rect', label: 'Rectangle', icon: Square },
  { type: 'circle', label: 'Circle', icon: Circle },
  { type: 'triangle', label: 'Triangle', icon: Triangle },
  { type: 'line', label: 'Line', icon: Minus },
  { type: 'polygon', label: 'Pentagon', icon: Pentagon, options: { sides: 5 } },
  { type: 'polygon', label: 'Hexagon', icon: Pentagon, options: { sides: 6 } },
  { type: 'star', label: 'Star', icon: Star },
  { type: 'arrow', label: 'Arrow', icon: ArrowRight },
  { type: 'rounded-rect', label: 'Rounded Rect', icon: RectangleHorizontal },
]

export function ShapesPanel() {
  const editor = useEditorStore((s) => s.editor)
  const selectMode = useEditorStore((s) => s.selectMode)
  const setSelectMode = useEditorStore((s) => s.setSelectMode)

  const handleAddShape = (shape: ShapeItem) => {
    if (!editor) return
    const plugin = editor.getPlugin<{
      addShape: (type: string, options?: Record<string, unknown>) => void
    }>('ShapePlugin')
    if (plugin) {
      plugin.addShape(shape.type, shape.options)
    }
  }

  const handleToggleFreeDraw = () => {
    if (!editor) return
    const plugin = editor.getPlugin<{
      enableFreeDraw: (options?: Record<string, unknown>) => void
      disableFreeDraw: () => void
    }>('ShapePlugin')
    if (!plugin) return

    if (selectMode === 'free-draw') {
      plugin.disableFreeDraw()
      setSelectMode('default')
    } else {
      plugin.enableFreeDraw()
      setSelectMode('free-draw')
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-gray-700">Shapes</div>

      {/* Shape grid */}
      <div className="grid grid-cols-3 gap-2">
        {SHAPES.map((shape, i) => {
          const Icon = shape.icon
          return (
            <button
              key={`${shape.type}-${i}`}
              onClick={() => handleAddShape(shape)}
              className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 p-3 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              title={shape.label}
            >
              <Icon className="h-6 w-6 text-gray-600" />
              <span className="text-[10px] text-gray-500">{shape.label}</span>
            </button>
          )
        })}
      </div>

      {/* Free Draw */}
      <div className="border-t pt-3">
        <button
          onClick={handleToggleFreeDraw}
          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            selectMode === 'free-draw'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Pencil className="h-4 w-4" />
          {selectMode === 'free-draw' ? 'Exit Free Draw' : 'Free Draw'}
        </button>
      </div>
    </div>
  )
}
