'use client'

import { useEffect, useState, useCallback } from 'react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { setBackground, getBackgroundColor } from '@/lib/editor/fabricUtils'

interface ObjectProperties {
  fill: string
  stroke: string
  opacity: number
  left: number
  top: number
  width: number
  height: number
  angle: number
  fontSize: number
  fontFamily: string
  fontWeight: string
  textAlign: string
  scaleX: number
  scaleY: number
}

const FONT_OPTIONS = [
  'Inter, sans-serif',
  'Poppins, sans-serif',
  'Arial, sans-serif',
  'Georgia, serif',
  'Courier New, monospace',
  'Times New Roman, serif',
  'Verdana, sans-serif',
  'Impact, sans-serif',
]

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#E30613', '#FF2D3B', '#F59E0B',
  '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
  '#1E293B', '#4F46E5', '#059669', '#DC2626', '#D97706',
]

function PropertyRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <label className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export default function PropertiesPanel() {
  const canvas = useEditorStore((s) => s.canvas)
  const activeObject = useEditorStore((s) => s.activeObject)
  const [props, setProps] = useState<Partial<ObjectProperties>>({})
  const [bgColor, setBgColor] = useState('#ffffff')

  // Sync properties from active object
  useEffect(() => {
    if (!activeObject) {
      setProps({})
      return
    }

    const obj = activeObject as unknown as Record<string, unknown>
    setProps({
      fill: (obj.fill as string) ?? '#000000',
      stroke: (obj.stroke as string) ?? '',
      opacity: (obj.opacity as number) ?? 1,
      left: Math.round((obj.left as number) ?? 0),
      top: Math.round((obj.top as number) ?? 0),
      width: Math.round((obj.width as number) ?? 0),
      height: Math.round((obj.height as number) ?? 0),
      angle: Math.round((obj.angle as number) ?? 0),
      fontSize: (obj.fontSize as number) ?? 24,
      fontFamily: (obj.fontFamily as string) ?? 'Inter, sans-serif',
      fontWeight: String((obj.fontWeight as string | number) ?? 'normal'),
      textAlign: (obj.textAlign as string) ?? 'left',
      scaleX: (obj.scaleX as number) ?? 1,
      scaleY: (obj.scaleY as number) ?? 1,
    })
  }, [activeObject])

  // Sync bg color from artboard
  useEffect(() => {
    if (canvas) {
      setBgColor(getBackgroundColor(canvas))
    }
  }, [canvas])

  const updateProp = useCallback(
    (key: string, value: unknown) => {
      if (!activeObject || !canvas) return
      activeObject.set(key as keyof typeof activeObject, value as never)
      canvas.renderAll()
      setProps((prev) => ({ ...prev, [key]: value }))
    },
    [activeObject, canvas]
  )

  const isTextObject =
    activeObject?.type === 'text' ||
    activeObject?.type === 'i-text' ||
    activeObject?.type === 'textbox'

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Properties</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 editor-scrollbar">
        {/* Background color (always visible) */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Canvas Background</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => {
                setBgColor(e.target.value)
                if (canvas) setBackground(canvas, e.target.value)
              }}
              className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={bgColor}
              onChange={(e) => {
                setBgColor(e.target.value)
                if (canvas) setBackground(canvas, e.target.value)
              }}
              className="text-xs border border-gray-200 rounded px-2 py-1 w-20 font-mono"
            />
          </div>
        </div>

        {!activeObject && (
          <p className="text-xs text-gray-400 py-2">
            Select an object to edit its properties
          </p>
        )}

        {activeObject && (
          <>
            {/* Position */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Position</p>
              <div className="grid grid-cols-2 gap-2">
                <PropertyRow label="X">
                  <input
                    type="number"
                    value={props.left ?? 0}
                    onChange={(e) => updateProp('left', Number(e.target.value))}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                  />
                </PropertyRow>
                <PropertyRow label="Y">
                  <input
                    type="number"
                    value={props.top ?? 0}
                    onChange={(e) => updateProp('top', Number(e.target.value))}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                  />
                </PropertyRow>
              </div>
              <PropertyRow label="Rotation">
                <input
                  type="number"
                  value={props.angle ?? 0}
                  onChange={(e) => updateProp('angle', Number(e.target.value))}
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                  min={0}
                  max={360}
                />
              </PropertyRow>
            </div>

            {/* Appearance */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Appearance</p>
              <PropertyRow label="Fill">
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={typeof props.fill === 'string' ? props.fill : '#000000'}
                    onChange={(e) => updateProp('fill', e.target.value)}
                    className="w-6 h-6 rounded border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={typeof props.fill === 'string' ? props.fill : ''}
                    onChange={(e) => updateProp('fill', e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 flex-1 font-mono"
                  />
                </div>
              </PropertyRow>
              <PropertyRow label="Stroke">
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={props.stroke || '#000000'}
                    onChange={(e) => updateProp('stroke', e.target.value)}
                    className="w-6 h-6 rounded border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={props.stroke ?? ''}
                    onChange={(e) => updateProp('stroke', e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 flex-1 font-mono"
                  />
                </div>
              </PropertyRow>
              <PropertyRow label="Opacity">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={props.opacity ?? 1}
                  onChange={(e) => updateProp('opacity', Number(e.target.value))}
                  className="w-full"
                />
              </PropertyRow>

              {/* Preset colors */}
              <div className="flex flex-wrap gap-1 mt-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateProp('fill', color)}
                    className="w-5 h-5 rounded-sm border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Text properties */}
            {isTextObject && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Text</p>
                <PropertyRow label="Size">
                  <input
                    type="number"
                    value={props.fontSize ?? 24}
                    onChange={(e) => updateProp('fontSize', Number(e.target.value))}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                    min={8}
                    max={200}
                  />
                </PropertyRow>
                <PropertyRow label="Font">
                  <select
                    value={props.fontFamily ?? 'Inter, sans-serif'}
                    onChange={(e) => updateProp('fontFamily', e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f.split(',')[0]}
                      </option>
                    ))}
                  </select>
                </PropertyRow>
                <PropertyRow label="Weight">
                  <select
                    value={props.fontWeight ?? 'normal'}
                    onChange={(e) => updateProp('fontWeight', e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="100">Thin</option>
                    <option value="300">Light</option>
                    <option value="500">Medium</option>
                    <option value="700">Bold</option>
                    <option value="900">Black</option>
                  </select>
                </PropertyRow>
                <PropertyRow label="Align">
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => updateProp('textAlign', align)}
                        className={`px-2 py-0.5 text-xs rounded border ${
                          props.textAlign === align
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {align.charAt(0).toUpperCase() + align.slice(1)}
                      </button>
                    ))}
                  </div>
                </PropertyRow>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
