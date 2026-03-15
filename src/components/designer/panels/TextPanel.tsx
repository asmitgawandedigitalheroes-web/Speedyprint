'use client'

/**
 * TextPanel — Text presets and typography controls.
 */

import { Type, Heading1, Heading2, AlignLeft } from 'lucide-react'
import { useEditorStore } from '@/lib/designer/store'

const TEXT_PRESETS = [
  { method: 'addHeading', label: 'Heading', icon: Heading1, desc: 'Bold, 36px' },
  { method: 'addSubheading', label: 'Subheading', icon: Heading2, desc: 'Semi-bold, 24px' },
  { method: 'addBody', label: 'Body Text', icon: AlignLeft, desc: 'Regular, 16px' },
  { method: 'addCaption', label: 'Caption', icon: Type, desc: 'Light, 12px' },
]

export function TextPanel() {
  const editor = useEditorStore((s) => s.editor)

  const handleAddText = (method: string) => {
    if (!editor) return
    const plugin = editor.getPlugin<Record<string, () => void>>('TextPlugin')
    if (plugin && typeof plugin[method] === 'function') {
      plugin[method]()
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-gray-700">Text</div>

      {/* Text presets */}
      <div className="space-y-2">
        {TEXT_PRESETS.map((preset) => {
          const Icon = preset.icon
          return (
            <button
              key={preset.method}
              onClick={() => handleAddText(preset.method)}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-left hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <Icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-700">{preset.label}</div>
                <div className="text-[10px] text-gray-400">{preset.desc}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Custom text */}
      <div className="border-t pt-3">
        <button
          onClick={() => handleAddText('addText')}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add Custom Text
        </button>
      </div>
    </div>
  )
}
