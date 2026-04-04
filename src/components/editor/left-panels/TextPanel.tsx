'use client'

import { useCallback } from 'react'
import { Type, Heading1, Heading2 } from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { addText } from '@/lib/editor/fabricUtils'

interface TextPreset {
  id: string
  label: string
  text: string
  fontSize: number
  fill: string
  fontWeight?: string
  icon: React.ReactNode
}

const TEXT_PRESETS: TextPreset[] = [
  { id: 'heading', label: 'Add Heading', text: 'Heading', fontSize: 48, fill: '#1E293B', fontWeight: 'bold', icon: <Heading1 size={18} /> },
  { id: 'subheading', label: 'Add Subheading', text: 'Subheading', fontSize: 32, fill: '#334155', fontWeight: '600', icon: <Heading2 size={18} /> },
  { id: 'body', label: 'Add Body Text', text: 'Body text goes here', fontSize: 18, fill: '#475569', icon: <Type size={18} /> },
  { id: 'caption', label: 'Add Caption', text: 'Caption text', fontSize: 12, fill: '#64748B', icon: <Type size={14} /> },
]

const STYLED_TEXTS = [
  { id: 'brand-title', label: 'Brand Title', text: 'BRAND', fontSize: 56, fill: '#E30613', fontWeight: 'bold' },
  { id: 'elegant', label: 'Elegant', text: 'Elegant', fontSize: 40, fill: '#8B5CF6', fontFamily: 'Georgia, serif', fontStyle: 'italic' },
  { id: 'bold-impact', label: 'Bold Impact', text: 'IMPACT', fontSize: 52, fill: '#1E293B', fontFamily: 'Impact, sans-serif' },
  { id: 'subtle', label: 'Subtle', text: 'subtle', fontSize: 28, fill: '#94A3B8', fontWeight: '300', fontStyle: 'italic' },
  { id: 'gold-label', label: 'Gold Label', text: 'PREMIUM', fontSize: 36, fill: '#D97706', fontFamily: 'Poppins, sans-serif', fontWeight: '600' },
  { id: 'white-on-dark', label: 'Light Text', text: 'LIGHT', fontSize: 36, fill: '#FFFFFF', fontWeight: '500', stroke: '#000000', strokeWidth: 0.5 },
]

export default function TextPanel() {
  const canvas = useEditorStore((s) => s.canvas)

  const handleAddPreset = useCallback(
    (preset: TextPreset) => {
      if (!canvas) return
      addText(canvas, { 
        text: preset.text, 
        fontSize: preset.fontSize, 
        fill: preset.fill,
        fontWeight: preset.fontWeight,
      })
    },
    [canvas]
  )

  const handleAddStyled = useCallback(
    (item: typeof STYLED_TEXTS[0]) => {
      if (!canvas) return
      addText(canvas, { 
        text: item.text, 
        fontSize: item.fontSize, 
        fill: item.fill,
        fontFamily: (item as any).fontFamily,
        fontWeight: (item as any).fontWeight,
        fontStyle: (item as any).fontStyle,
        stroke: (item as any).stroke,
        strokeWidth: (item as any).strokeWidth,
      })
    },
    [canvas]
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2">
        <h2 className="text-sm font-semibold text-ed-text">Text</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 editor-scrollbar">
        <p className="editor-section-title">Quick Add</p>
        <div className="space-y-1.5 mb-4">
          {TEXT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleAddPreset(preset)}
              className="w-full flex items-center gap-3 px-3 py-2 bg-ed-bg border border-ed-border rounded-lg hover:border-ed-border-light hover:bg-ed-surface-hover transition-all group"
            >
              <div className="text-ed-text-dim group-hover:text-ed-accent transition-colors">
                {preset.icon}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-ed-text-muted group-hover:text-ed-text">{preset.label}</p>
                <p className="text-[10px] text-ed-text-dim">{preset.fontSize}px</p>
              </div>
            </button>
          ))}
        </div>

        <p className="editor-section-title">Styled Text</p>
        <div className="grid grid-cols-2 gap-2">
          {STYLED_TEXTS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleAddStyled(item)}
              className="bg-ed-bg border border-ed-border rounded-lg p-3 hover:border-ed-border-light hover:bg-ed-surface-hover transition-all flex items-center justify-center h-14"
              style={{
                backgroundColor: item.fill === '#FFFFFF' ? '#1E293B' : undefined,
              }}
            >
              <span
                className="truncate"
                style={{
                  color: item.fill,
                  fontSize: Math.min(item.fontSize * 0.35, 18),
                  fontFamily: (item as any).fontFamily,
                  fontWeight: (item as any).fontWeight ?? 'semibold',
                  fontStyle: (item as any).fontStyle,
                }}
              >
                {item.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
