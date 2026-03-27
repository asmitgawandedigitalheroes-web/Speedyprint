'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Image as ImageIcon,
  MousePointer,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  ChevronDown,
  ChevronRight,
  Type,
} from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { setBackground, getBackgroundColor } from '@/lib/editor/fabricUtils'
import type { Shadow as FabricShadow } from 'fabric'

const RECOMMENDED_COLORS = [
  '#FF6B6B', '#2DD4A8', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#88D8B0', '#F0E68C', '#9B59B6', '#87CEEB',
  '#F0A500', '#5B2C6F', '#BB8FCE', '#FF69B4', '#FFCC02',
  '#E07C4F', '#009B77', '#00CED1', '#2E86DE', '#7D3C98',
]

const FONT_OPTIONS = [
  'Inter, sans-serif',
  'Poppins, sans-serif',
  'Arial, sans-serif',
  'Georgia, serif',
  'Courier New, monospace',
  'Times New Roman, serif',
  'Verdana, sans-serif',
  'Impact, sans-serif',
  'Helvetica, sans-serif',
  'Trebuchet MS, sans-serif',
  'Comic Sans MS, cursive',
  'Palatino, serif',
  'Garamond, serif',
  'Lucida Console, monospace',
]

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <label className="text-[11px] text-ed-text-dim w-14 flex-shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function SectionHeader({
  title,
  expanded,
  onToggle,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 w-full py-1 group"
    >
      {expanded ? (
        <ChevronDown size={12} className="text-ed-text-dim" />
      ) : (
        <ChevronRight size={12} className="text-ed-text-dim" />
      )}
      <p className="editor-section-title mb-0">{title}</p>
    </button>
  )
}

function IconBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md border transition-colors ${
        active
          ? 'bg-ed-accent/15 border-ed-accent/30 text-ed-accent'
          : 'border-ed-border text-ed-text-dim hover:bg-ed-surface-hover hover:text-ed-text-muted'
      }`}
    >
      {children}
    </button>
  )
}

export default function Sidebar() {
  const canvas = useEditorStore((s) => s.canvas)
  const activeObject = useEditorStore((s) => s.activeObject)

  const [bgColor, setBgColor] = useState('#ffffff')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Position & Transform
  const [left, setLeft] = useState(0)
  const [top, setTop] = useState(0)
  const [angle, setAngle] = useState(0)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [scaleX, setScaleX] = useState(1)
  const [scaleY, setScaleY] = useState(1)
  const [isLocked, setIsLocked] = useState(false)

  // Appearance
  const [fill, setFill] = useState('#000000')
  const [stroke, setStroke] = useState('')
  const [strokeWidth, setStrokeWidth] = useState(0)
  const [opacity, setOpacity] = useState(1)
  const [rx, setRx] = useState(0)

  // Shadow
  const [shadowColor, setShadowColor] = useState('#000000')
  const [shadowBlur, setShadowBlur] = useState(0)
  const [shadowOffsetX, setShadowOffsetX] = useState(0)
  const [shadowOffsetY, setShadowOffsetY] = useState(0)

  // Text
  const [textContent, setTextContent] = useState('')
  const [textColor, setTextColor] = useState('#000000')
  const [fontSize, setFontSize] = useState(24)
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif')
  const [fontWeight, setFontWeight] = useState('normal')
  const [fontStyle, setFontStyle] = useState('normal')
  const [textAlign, setTextAlign] = useState('left')
  const [underline, setUnderline] = useState(false)
  const [linethrough, setLinethrough] = useState(false)
  const [lineHeight, setLineHeight] = useState(1.16)
  const [charSpacing, setCharSpacing] = useState(0)

  // SVG group colors
  const [svgColors, setSvgColors] = useState<string[]>([])

  // Collapsible sections
  const [sections, setSections] = useState({
    position: true,
    size: true,
    appearance: true,
    text: true,
    textStyle: true,
    shadow: false,
    svgColors: true,
    actions: true,
  })

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  useEffect(() => {
    if (canvas) setBgColor(getBackgroundColor(canvas))
  }, [canvas])

  // Preview generation
  useEffect(() => {
    if (!canvas) return
    const timer = setTimeout(() => {
      try {
        setPreviewUrl(canvas.toDataURL({ format: 'png', multiplier: 0.25 }))
      } catch { /* ignore */ }
    }, 500)
    return () => clearTimeout(timer)
  }, [canvas, activeObject])

  useEffect(() => {
    if (!canvas) return
    const refresh = () => {
      try {
        setPreviewUrl(canvas.toDataURL({ format: 'png', multiplier: 0.25 }))
      } catch { /* ignore */ }
    }
    canvas.on('object:modified', refresh)
    canvas.on('object:added', refresh)
    canvas.on('object:removed', refresh)
    return () => {
      canvas.off('object:modified', refresh)
      canvas.off('object:added', refresh)
      canvas.off('object:removed', refresh)
    }
  }, [canvas])

  // Sync properties from active object
  useEffect(() => {
    if (!activeObject) return
    const obj = activeObject as unknown as Record<string, unknown>

    setFill((obj.fill as string) ?? '#000000')
    setStroke((obj.stroke as string) ?? '')
    setStrokeWidth((obj.strokeWidth as number) ?? 0)
    setOpacity((obj.opacity as number) ?? 1)
    setLeft(Math.round((obj.left as number) ?? 0))
    setTop(Math.round((obj.top as number) ?? 0))
    setAngle(Math.round((obj.angle as number) ?? 0))
    setWidth(Math.round((obj.width as number) ?? 0))
    setHeight(Math.round((obj.height as number) ?? 0))
    setScaleX((obj.scaleX as number) ?? 1)
    setScaleY((obj.scaleY as number) ?? 1)
    setRx((obj.rx as number) ?? 0)
    setIsLocked(!(obj.selectable as boolean ?? true))

    // Shadow
    const shadow = obj.shadow as FabricShadow | null
    if (shadow && typeof shadow === 'object') {
      setShadowColor((shadow.color as string) ?? '#000000')
      setShadowBlur((shadow.blur as number) ?? 0)
      setShadowOffsetX((shadow.offsetX as number) ?? 0)
      setShadowOffsetY((shadow.offsetY as number) ?? 0)
    } else {
      setShadowColor('#000000')
      setShadowBlur(0)
      setShadowOffsetX(0)
      setShadowOffsetY(0)
    }

    // Text props
    setFontSize((obj.fontSize as number) ?? 24)
    setFontFamily((obj.fontFamily as string) ?? 'Inter, sans-serif')
    setFontWeight(String((obj.fontWeight as string | number) ?? 'normal'))
    setFontStyle((obj.fontStyle as string) ?? 'normal')
    setTextAlign((obj.textAlign as string) ?? 'left')
    setUnderline((obj.underline as boolean) ?? false)
    setLinethrough((obj.linethrough as boolean) ?? false)
    setLineHeight((obj.lineHeight as number) ?? 1.16)
    setCharSpacing((obj.charSpacing as number) ?? 0)
    setTextContent((obj.text as string) ?? '')
    setTextColor((obj.fill as string) ?? '#000000')

    // Extract colors from SVG groups
    if (activeObject.type === 'group') {
      const colors = new Set<string>()
      const group = activeObject as unknown as { getObjects: () => Array<Record<string, unknown>> }
      if (typeof group.getObjects === 'function') {
        group.getObjects().forEach((child) => {
          const childFill = child.fill as string
          if (childFill && typeof childFill === 'string' && childFill !== 'none' && childFill !== 'transparent') {
            colors.add(childFill.toUpperCase())
          }
        })
      }
      setSvgColors(Array.from(colors))
    } else {
      setSvgColors([])
    }
  }, [activeObject])

  const updateProp = useCallback(
    (key: string, value: unknown) => {
      if (!activeObject || !canvas) return
      activeObject.set(key as keyof typeof activeObject, value as never)

      // For SVG groups, propagate fill/stroke to child objects
      if ((key === 'fill' || key === 'stroke' || key === 'strokeWidth') &&
          typeof (activeObject as unknown as { getObjects?: () => unknown[] }).getObjects === 'function') {
        const group = activeObject as unknown as {
          getObjects: () => Array<{ set: (k: string, v: unknown) => void; fill?: string; stroke?: string; dirty?: boolean }>
          dirty?: boolean
          set: (k: string, v: unknown) => void
        }
        group.getObjects().forEach((child) => {
          if (key === 'fill') {
            const childFill = child.fill as string | undefined
            const childStroke = child.stroke as string | undefined
            const hasFill = childFill && childFill !== 'none' && childFill !== 'transparent'
            const hasStroke = childStroke && childStroke !== 'none' && childStroke !== 'transparent'
            if (hasFill) child.set('fill', value)
            if (!hasFill && hasStroke) child.set('stroke', value)
          } else {
            child.set(key, value)
          }
          child.dirty = true
        })
        // Force group cache invalidation
        group.dirty = true
        group.set('dirty', true)
      }

      activeObject.setCoords()
      canvas.requestRenderAll()
    },
    [activeObject, canvas]
  )

  const updateShadow = useCallback(
    (updates: { color?: string; blur?: number; offsetX?: number; offsetY?: number }) => {
      if (!activeObject || !canvas) return
      const { Shadow } = require('fabric')
      const current = (activeObject as unknown as Record<string, unknown>).shadow as FabricShadow | null
      const newShadow = new Shadow({
        color: updates.color ?? shadowColor,
        blur: updates.blur ?? shadowBlur,
        offsetX: updates.offsetX ?? shadowOffsetX,
        offsetY: updates.offsetY ?? shadowOffsetY,
      })
      activeObject.set('shadow' as keyof typeof activeObject, newShadow as never)
      canvas.renderAll()
      if (updates.color !== undefined) setShadowColor(updates.color)
      if (updates.blur !== undefined) setShadowBlur(updates.blur)
      if (updates.offsetX !== undefined) setShadowOffsetX(updates.offsetX)
      if (updates.offsetY !== undefined) setShadowOffsetY(updates.offsetY)
    },
    [activeObject, canvas, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY]
  )

  const handleBgChange = useCallback(
    (color: string) => {
      setBgColor(color)
      if (canvas) setBackground(canvas, color)
    },
    [canvas]
  )

  const handleFlipH = useCallback(() => {
    if (!activeObject || !canvas) return
    const current = (activeObject as unknown as Record<string, unknown>).flipX as boolean
    activeObject.set('flipX' as keyof typeof activeObject, !current as never)
    canvas.renderAll()
  }, [activeObject, canvas])

  const handleFlipV = useCallback(() => {
    if (!activeObject || !canvas) return
    const current = (activeObject as unknown as Record<string, unknown>).flipY as boolean
    activeObject.set('flipY' as keyof typeof activeObject, !current as never)
    canvas.renderAll()
  }, [activeObject, canvas])

  const handleLockToggle = useCallback(() => {
    if (!activeObject || !canvas) return
    const newLocked = !isLocked
    activeObject.set('selectable' as keyof typeof activeObject, !newLocked as never)
    activeObject.set('evented' as keyof typeof activeObject, !newLocked as never)
    activeObject.set('hasControls' as keyof typeof activeObject, !newLocked as never)
    setIsLocked(newLocked)
    canvas.renderAll()
  }, [activeObject, canvas, isLocked])

  const handleDuplicate = useCallback(() => {
    if (!activeObject || !canvas) return
    activeObject.clone().then((cloned: typeof activeObject) => {
      const obj = cloned as unknown as Record<string, unknown>
      cloned.set('left' as keyof typeof cloned, ((obj.left as number) + 20) as never)
      cloned.set('top' as keyof typeof cloned, ((obj.top as number) + 20) as never)
      canvas.add(cloned)
      canvas.setActiveObject(cloned)
      canvas.renderAll()
    })
  }, [activeObject, canvas])

  const handleDelete = useCallback(() => {
    if (!activeObject || !canvas) return
    canvas.remove(activeObject)
    canvas.discardActiveObject()
    canvas.renderAll()
  }, [activeObject, canvas])

  const handleSvgColorChange = useCallback(
    (oldColor: string, newColor: string) => {
      if (!activeObject || !canvas || activeObject.type !== 'group') return
      const group = activeObject as unknown as { getObjects: () => Array<Record<string, unknown>> }
      if (typeof group.getObjects === 'function') {
        group.getObjects().forEach((child) => {
          const childFill = child.fill as string
          if (childFill && childFill.toUpperCase() === oldColor.toUpperCase()) {
            ;(child as unknown as { set: (key: string, val: unknown) => void }).set('fill', newColor)
          }
        })
      }
      canvas.renderAll()
      // Update tracked colors
      setSvgColors((prev) =>
        prev.map((c) => (c.toUpperCase() === oldColor.toUpperCase() ? newColor.toUpperCase() : c))
      )
    },
    [activeObject, canvas]
  )

  const handleTextContentChange = useCallback(
    (text: string) => {
      if (!activeObject || !canvas) return
      setTextContent(text)
      activeObject.set('text' as keyof typeof activeObject, text as never)
      canvas.renderAll()
    },
    [activeObject, canvas]
  )

  const isTextObject =
    activeObject?.type === 'text' ||
    activeObject?.type === 'i-text' ||
    activeObject?.type === 'textbox'

  const isRectObject = activeObject?.type === 'rect'
  const isGroupObject = activeObject?.type === 'group'

  const inputClass = 'w-full editor-input'
  const selectClass = 'w-full editor-input appearance-none'

  return (
    <div className="w-72 bg-ed-surface border-l border-ed-border flex flex-col h-full overflow-y-auto editor-scrollbar">

      {/* Preview */}
      <div className="px-3 pt-3 pb-2 border-b border-ed-border">
        <h3 className="text-[11px] font-semibold text-ed-text-muted uppercase tracking-wider mb-2">Preview</h3>
        <div className="w-full aspect-[4/3] bg-ed-bg border border-ed-border rounded-lg flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            <img src={previewUrl} alt="Design Preview" className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-ed-text-dim">
              <ImageIcon size={24} />
              <span className="text-[10px]">Design Preview</span>
            </div>
          )}
        </div>
      </div>

      {/* Background Color */}
      <div className="px-3 py-2.5 border-b border-ed-border">
        <h3 className="text-[11px] font-semibold text-ed-text-muted uppercase tracking-wider mb-2">Background</h3>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={bgColor}
            onChange={(e) => handleBgChange(e.target.value)}
            className="w-8 h-8 rounded-md border border-ed-border cursor-pointer bg-transparent p-0.5"
          />
          <input
            type="text"
            value={bgColor.toUpperCase()}
            onChange={(e) => handleBgChange(e.target.value)}
            className="flex-1 editor-input font-mono uppercase"
          />
        </div>
      </div>

      {/* Quick Colors */}
      <div className="px-3 py-2.5 border-b border-ed-border">
        <h3 className="text-[11px] font-semibold text-ed-text-muted uppercase tracking-wider mb-2">Colors</h3>
        <div className="grid grid-cols-10 gap-1.5">
          {RECOMMENDED_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => {
                if (activeObject) {
                  if (isTextObject) {
                    updateProp('fill', color)
                    setTextColor(color)
                    setFill(color)
                  } else {
                    updateProp('fill', color)
                    setFill(color)
                  }
                } else {
                  handleBgChange(color)
                }
              }}
              className="w-6 h-6 rounded-full border border-ed-border hover:scale-125 hover:border-ed-text-dim transition-all"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Element Properties */}
      <div className="px-3 py-2.5 flex-1">
        {!activeObject ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MousePointer size={28} className="text-ed-text-dim mb-2 opacity-40" />
            <p className="text-xs text-ed-text-dim">Select an element to edit</p>
          </div>
        ) : (
          <div className="space-y-2">

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-1 pb-2 border-b border-ed-border">
              <IconBtn onClick={handleDuplicate} title="Duplicate (Ctrl+D)">
                <Copy size={14} />
              </IconBtn>
              <IconBtn onClick={handleFlipH} title="Flip Horizontal">
                <FlipHorizontal size={14} />
              </IconBtn>
              <IconBtn onClick={handleFlipV} title="Flip Vertical">
                <FlipVertical size={14} />
              </IconBtn>
              <IconBtn active={isLocked} onClick={handleLockToggle} title={isLocked ? 'Unlock' : 'Lock'}>
                {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
              </IconBtn>
              <div className="flex-1" />
              <IconBtn onClick={handleDelete} title="Delete">
                <Trash2 size={14} className="text-red-400" />
              </IconBtn>
            </div>

            {/* Position */}
            <div>
              <SectionHeader title="Position" expanded={sections.position} onToggle={() => toggleSection('position')} />
              {sections.position && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <PropRow label="X">
                      <input type="number" value={left} onChange={(e) => { setLeft(Number(e.target.value)); updateProp('left', Number(e.target.value)) }} className={inputClass} />
                    </PropRow>
                    <PropRow label="Y">
                      <input type="number" value={top} onChange={(e) => { setTop(Number(e.target.value)); updateProp('top', Number(e.target.value)) }} className={inputClass} />
                    </PropRow>
                  </div>
                  <PropRow label="Rotate">
                    <input type="number" value={angle} onChange={(e) => { setAngle(Number(e.target.value)); updateProp('angle', Number(e.target.value)) }} className={inputClass} min={0} max={360} />
                  </PropRow>
                </>
              )}
            </div>

            {/* Size */}
            <div>
              <SectionHeader title="Size" expanded={sections.size} onToggle={() => toggleSection('size')} />
              {sections.size && (
                <div className="grid grid-cols-2 gap-2">
                  <PropRow label="W">
                    <input
                      type="number"
                      value={Math.round(width * scaleX)}
                      onChange={(e) => {
                        const newW = Number(e.target.value)
                        const newScale = newW / width
                        setScaleX(newScale)
                        updateProp('scaleX', newScale)
                      }}
                      className={inputClass}
                      min={1}
                    />
                  </PropRow>
                  <PropRow label="H">
                    <input
                      type="number"
                      value={Math.round(height * scaleY)}
                      onChange={(e) => {
                        const newH = Number(e.target.value)
                        const newScale = newH / height
                        setScaleY(newScale)
                        updateProp('scaleY', newScale)
                      }}
                      className={inputClass}
                      min={1}
                    />
                  </PropRow>
                </div>
              )}
            </div>

            {/* Text Content (for text objects) */}
            {isTextObject && (
              <div>
                <SectionHeader title="Text Content" expanded={sections.text} onToggle={() => toggleSection('text')} />
                {sections.text && (
                  <>
                    <textarea
                      value={textContent}
                      onChange={(e) => handleTextContentChange(e.target.value)}
                      rows={3}
                      className="w-full editor-input resize-none mt-1"
                      placeholder="Enter text..."
                    />
                    {/* Text Color */}
                    <PropRow label="Color">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={typeof textColor === 'string' ? textColor : '#000000'}
                          onChange={(e) => { setTextColor(e.target.value); setFill(e.target.value); updateProp('fill', e.target.value) }}
                          className="w-6 h-6 rounded border border-ed-border cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={typeof textColor === 'string' ? textColor : ''}
                          onChange={(e) => { setTextColor(e.target.value); setFill(e.target.value); updateProp('fill', e.target.value) }}
                          className="flex-1 editor-input font-mono"
                        />
                      </div>
                    </PropRow>
                  </>
                )}
              </div>
            )}

            {/* Text Styling (for text objects) */}
            {isTextObject && (
              <div>
                <SectionHeader title="Text Style" expanded={sections.textStyle} onToggle={() => toggleSection('textStyle')} />
                {sections.textStyle && (
                  <>
                    <PropRow label="Font">
                      <select value={fontFamily} onChange={(e) => { setFontFamily(e.target.value); updateProp('fontFamily', e.target.value) }} className={selectClass}>
                        {FONT_OPTIONS.map((f) => (<option key={f} value={f}>{f.split(',')[0]}</option>))}
                      </select>
                    </PropRow>
                    <PropRow label="Size">
                      <input type="number" value={fontSize} onChange={(e) => { setFontSize(Number(e.target.value)); updateProp('fontSize', Number(e.target.value)) }} className={inputClass} min={8} max={400} />
                    </PropRow>
                    {/* Style buttons: Bold, Italic, Underline, Strikethrough */}
                    <div className="flex items-center gap-1 py-1">
                      <label className="text-[11px] text-ed-text-dim w-14 flex-shrink-0">Style</label>
                      <div className="flex gap-1">
                        <IconBtn
                          active={fontWeight === 'bold' || fontWeight === '700'}
                          onClick={() => {
                            const newVal = fontWeight === 'bold' || fontWeight === '700' ? 'normal' : 'bold'
                            setFontWeight(newVal)
                            updateProp('fontWeight', newVal)
                          }}
                          title="Bold"
                        >
                          <Bold size={14} />
                        </IconBtn>
                        <IconBtn
                          active={fontStyle === 'italic'}
                          onClick={() => {
                            const newVal = fontStyle === 'italic' ? 'normal' : 'italic'
                            setFontStyle(newVal)
                            updateProp('fontStyle', newVal)
                          }}
                          title="Italic"
                        >
                          <Italic size={14} />
                        </IconBtn>
                        <IconBtn
                          active={underline}
                          onClick={() => {
                            setUnderline(!underline)
                            updateProp('underline', !underline)
                          }}
                          title="Underline"
                        >
                          <Underline size={14} />
                        </IconBtn>
                        <IconBtn
                          active={linethrough}
                          onClick={() => {
                            setLinethrough(!linethrough)
                            updateProp('linethrough', !linethrough)
                          }}
                          title="Strikethrough"
                        >
                          <Strikethrough size={14} />
                        </IconBtn>
                      </div>
                    </div>
                    {/* Alignment */}
                    <div className="flex items-center gap-1 py-1">
                      <label className="text-[11px] text-ed-text-dim w-14 flex-shrink-0">Align</label>
                      <div className="flex gap-1">
                        <IconBtn active={textAlign === 'left'} onClick={() => { setTextAlign('left'); updateProp('textAlign', 'left') }} title="Align Left">
                          <AlignLeft size={14} />
                        </IconBtn>
                        <IconBtn active={textAlign === 'center'} onClick={() => { setTextAlign('center'); updateProp('textAlign', 'center') }} title="Align Center">
                          <AlignCenter size={14} />
                        </IconBtn>
                        <IconBtn active={textAlign === 'right'} onClick={() => { setTextAlign('right'); updateProp('textAlign', 'right') }} title="Align Right">
                          <AlignRight size={14} />
                        </IconBtn>
                      </div>
                    </div>
                    {/* Line Height & Letter Spacing */}
                    <PropRow label="Line H">
                      <input
                        type="number"
                        value={lineHeight}
                        step={0.1}
                        min={0.5}
                        max={5}
                        onChange={(e) => { setLineHeight(Number(e.target.value)); updateProp('lineHeight', Number(e.target.value)) }}
                        className={inputClass}
                      />
                    </PropRow>
                    <PropRow label="Spacing">
                      <input
                        type="number"
                        value={charSpacing}
                        step={10}
                        min={-200}
                        max={1000}
                        onChange={(e) => { setCharSpacing(Number(e.target.value)); updateProp('charSpacing', Number(e.target.value)) }}
                        className={inputClass}
                      />
                    </PropRow>
                  </>
                )}
              </div>
            )}

            {/* SVG Group Colors */}
            {isGroupObject && svgColors.length > 0 && (
              <div>
                <SectionHeader title="Element Colors" expanded={sections.svgColors} onToggle={() => toggleSection('svgColors')} />
                {sections.svgColors && (
                  <div className="space-y-1.5 mt-1">
                    {svgColors.map((color, idx) => (
                      <div key={`${color}-${idx}`} className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => handleSvgColorChange(color, e.target.value)}
                          className="w-6 h-6 rounded border border-ed-border cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => handleSvgColorChange(color, e.target.value)}
                          className="flex-1 editor-input font-mono text-[10px]"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Appearance */}
            {!isTextObject && (
              <div>
                <SectionHeader title="Appearance" expanded={sections.appearance} onToggle={() => toggleSection('appearance')} />
                {sections.appearance && (
                  <>
                    <PropRow label="Fill">
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={typeof fill === 'string' ? fill : '#000000'} onChange={(e) => { setFill(e.target.value); updateProp('fill', e.target.value) }} className="w-6 h-6 rounded border border-ed-border cursor-pointer bg-transparent" />
                        <input type="text" value={typeof fill === 'string' ? fill : ''} onChange={(e) => { setFill(e.target.value); updateProp('fill', e.target.value) }} className="flex-1 editor-input font-mono" />
                      </div>
                    </PropRow>
                    <PropRow label="Stroke">
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={stroke || '#000000'} onChange={(e) => { setStroke(e.target.value); updateProp('stroke', e.target.value) }} className="w-6 h-6 rounded border border-ed-border cursor-pointer bg-transparent" />
                        <input type="text" value={stroke} onChange={(e) => { setStroke(e.target.value); updateProp('stroke', e.target.value) }} className="flex-1 editor-input font-mono" />
                      </div>
                    </PropRow>
                    <PropRow label="Stroke W">
                      <input
                        type="number"
                        value={strokeWidth}
                        min={0}
                        max={50}
                        onChange={(e) => { setStrokeWidth(Number(e.target.value)); updateProp('strokeWidth', Number(e.target.value)) }}
                        className={inputClass}
                      />
                    </PropRow>
                    {isRectObject && (
                      <PropRow label="Radius">
                        <input
                          type="number"
                          value={rx}
                          min={0}
                          max={200}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setRx(val)
                            updateProp('rx', val)
                            updateProp('ry', val)
                          }}
                          className={inputClass}
                        />
                      </PropRow>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Opacity (always visible for all objects) */}
            <div>
              <PropRow label="Opacity">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={opacity}
                    onChange={(e) => { setOpacity(Number(e.target.value)); updateProp('opacity', Number(e.target.value)) }}
                    className="flex-1 accent-ed-accent"
                  />
                  <span className="text-[10px] text-ed-text-dim w-8 text-right">{Math.round(opacity * 100)}%</span>
                </div>
              </PropRow>
            </div>

            {/* Shadow */}
            <div>
              <SectionHeader title="Shadow" expanded={sections.shadow} onToggle={() => toggleSection('shadow')} />
              {sections.shadow && (
                <>
                  <PropRow label="Color">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={shadowColor}
                        onChange={(e) => updateShadow({ color: e.target.value })}
                        className="w-6 h-6 rounded border border-ed-border cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={shadowColor}
                        onChange={(e) => updateShadow({ color: e.target.value })}
                        className="flex-1 editor-input font-mono"
                      />
                    </div>
                  </PropRow>
                  <PropRow label="Blur">
                    <input
                      type="number"
                      value={shadowBlur}
                      min={0}
                      max={100}
                      onChange={(e) => updateShadow({ blur: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </PropRow>
                  <div className="grid grid-cols-2 gap-2">
                    <PropRow label="Off X">
                      <input
                        type="number"
                        value={shadowOffsetX}
                        onChange={(e) => updateShadow({ offsetX: Number(e.target.value) })}
                        className={inputClass}
                      />
                    </PropRow>
                    <PropRow label="Off Y">
                      <input
                        type="number"
                        value={shadowOffsetY}
                        onChange={(e) => updateShadow({ offsetY: Number(e.target.value) })}
                        className={inputClass}
                      />
                    </PropRow>
                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
