'use client'

import { useEffect, useState, useCallback } from 'react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { setBackground, getBackgroundColor, toggleLock } from '@/lib/editor/fabricUtils'
import { Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface ObjProps {
  selectable: boolean
  left: number; top: number; angle: number
  scaledW: number; scaledH: number
  rawW: number; rawH: number; scaleX: number; scaleY: number
  fill: string; stroke: string; strokeWidth: number
  opacity: number
  shadowColor: string; shadowBlur: number; shadowOffsetX: number; shadowOffsetY: number
  text: string; fontSize: number; fontFamily: string; fontWeight: string
  fontStyle: string; underline: boolean; linethrough: boolean
  textAlign: string; lineHeight: number; charSpacing: number
  overflowBehavior: 'truncate' | 'shrink' | 'stretch'
  minFontSize: number; maxFontSize: number; multiline: boolean
}

/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────── */
const FONT_OPTIONS = [
  'Inter', 'Poppins', 'Arial', 'Helvetica', 'Georgia',
  'Courier New', 'Times New Roman', 'Verdana', 'Impact',
  'Trebuchet MS', 'Tahoma', 'Comic Sans MS',
]

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#E30613', '#FF6B35', '#F59E0B',
  '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
  '#1E293B', '#059669', '#DC2626', '#D97706', '#4F46E5',
]

/* ─────────────────────────────────────────────────────────────
   UI Primitives
───────────────────────────────────────────────────────────── */
function Section({
  label, children, defaultOpen = true,
}: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-ed-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-ed-text-dim hover:text-ed-text transition-colors"
      >
        {label}
        {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-ed-text-dim w-14 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function NumInput({ value, onChange, min, max, step = 1, suffix }: {
  value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; suffix?: string
}) {
  return (
    <div className="relative flex items-center">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min} max={max} step={step}
        className="editor-input w-full text-xs pr-5"
      />
      {suffix && (
        <span className="absolute right-2 text-[9px] text-ed-text-dim pointer-events-none">{suffix}</span>
      )}
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Row label={label}>
      <div className="flex items-center gap-2">
        <label
          className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded border border-ed-border"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value.startsWith('#') && value.length >= 7 ? value.slice(0, 7) : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="editor-input flex-1 font-mono text-xs"
          placeholder="#000000"
        />
      </div>
    </Row>
  )
}

function ToggleBtn({ active, onClick, children, title }: {
  active: boolean; onClick: () => void; children: React.ReactNode; title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-7 w-8 items-center justify-center rounded border text-xs font-semibold transition-all ${
        active
          ? 'border-ed-accent bg-ed-accent/10 text-ed-accent'
          : 'border-ed-border text-ed-text-dim hover:border-ed-text-dim hover:text-ed-text'
      }`}
    >
      {children}
    </button>
  )
}

function AlignIcon({ type }: { type: 'left' | 'center' | 'right' }) {
  if (type === 'left') return (
    <svg viewBox="0 0 12 10" width="12" fill="currentColor">
      <rect x="0" y="0" width="12" height="2" rx="0.5"/>
      <rect x="0" y="4" width="8" height="2" rx="0.5"/>
      <rect x="0" y="8" width="10" height="2" rx="0.5"/>
    </svg>
  )
  if (type === 'center') return (
    <svg viewBox="0 0 12 10" width="12" fill="currentColor">
      <rect x="0" y="0" width="12" height="2" rx="0.5"/>
      <rect x="2" y="4" width="8" height="2" rx="0.5"/>
      <rect x="1" y="8" width="10" height="2" rx="0.5"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 12 10" width="12" fill="currentColor">
      <rect x="0" y="0" width="12" height="2" rx="0.5"/>
      <rect x="4" y="4" width="8" height="2" rx="0.5"/>
      <rect x="2" y="8" width="10" height="2" rx="0.5"/>
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
export default function PropertiesPanel() {
  const canvas      = useEditorStore((s) => s.canvas)
  const activeObject = useEditorStore((s) => s.activeObject)
  const [props, setProps] = useState<Partial<ObjProps>>({})
  const [bgColor, setBgColor] = useState('#ffffff')
  const [tick, setTick] = useState(0)

  /* ── Read from active object ───────────────────────────── */
  useEffect(() => {
    if (!activeObject) { setProps({}); return }
    const o = activeObject as unknown as Record<string, unknown>
    const rawW = (o.width  as number) ?? 0
    const rawH = (o.height as number) ?? 0
    const sx   = (o.scaleX as number) ?? 1
    const sy   = (o.scaleY as number) ?? 1
    const sh   = o.shadow as Record<string, unknown> | null
    setProps({
      selectable:      (o.selectable as boolean) ?? true,
      left:            Math.round((o.left as number) ?? 0),
      top:             Math.round((o.top  as number) ?? 0),
      angle:           Math.round((o.angle as number) ?? 0),
      rawW, rawH, scaleX: sx, scaleY: sy,
      scaledW:         Math.round(rawW * sx),
      scaledH:         Math.round(rawH * sy),
      fill:            (o.fill        as string) ?? '#000000',
      stroke:          (o.stroke      as string) ?? '',
      strokeWidth:     (o.strokeWidth as number) ?? 0,
      opacity:         (o.opacity     as number) ?? 1,
      shadowColor:     (sh?.color    as string) ?? '#000000',
      shadowBlur:      (sh?.blur     as number) ?? 0,
      shadowOffsetX:   (sh?.offsetX  as number) ?? 0,
      shadowOffsetY:   (sh?.offsetY  as number) ?? 0,
      text:            (o.text        as string) ?? '',
      fontSize:        (o.fontSize    as number) ?? 24,
      fontFamily:      ((o.fontFamily as string) ?? 'Inter').split(',')[0].trim(),
      fontWeight:      String((o.fontWeight as string | number) ?? 'normal'),
      fontStyle:       (o.fontStyle   as string) ?? 'normal',
      underline:       (o.underline   as boolean) ?? false,
      linethrough:     (o.linethrough as boolean) ?? false,
      textAlign:       (o.textAlign   as string) ?? 'left',
      lineHeight:      (o.lineHeight  as number) ?? 1.16,
      charSpacing:     (o.charSpacing as number) ?? 0,
      overflowBehavior: ((o.overflowBehavior as string) ?? 'truncate') as 'truncate' | 'shrink' | 'stretch',
      minFontSize:     (o.minFontSize as number) ?? 8,
      maxFontSize:     (o.maxFontSize as number) ?? ((o.fontSize as number) ?? 24),
      multiline:       (o.multiline   as boolean) ?? (activeObject?.type === 'textbox'),
    })
  }, [activeObject, tick])

  /* ── Sync canvas background ────────────────────────────── */
  useEffect(() => {
    if (canvas) setBgColor(getBackgroundColor(canvas))
  }, [canvas])

  /* ── Listen for canvas events ──────────────────────────── */
  useEffect(() => {
    if (!canvas) return
    const sync = () => setTick((p) => p + 1)
    canvas.on('object:modified', sync)
    canvas.on('object:scaling', sync)
    return () => { canvas.off('object:modified', sync); canvas.off('object:scaling', sync) }
  }, [canvas])

  /* ── Helpers ───────────────────────────────────────────── */
  const update = useCallback((key: string, value: unknown) => {
    if (!activeObject || !canvas) return
    activeObject.set(key as keyof typeof activeObject, value as never)
    canvas.renderAll()
    setProps((p) => ({ ...p, [key]: value }))
  }, [activeObject, canvas])

  const updateSize = useCallback((dim: 'w' | 'h', val: number) => {
    if (!activeObject || !canvas) return
    const o    = activeObject as unknown as Record<string, unknown>
    const rawW = (o.width  as number) || 1
    const rawH = (o.height as number) || 1
    if (dim === 'w') {
      activeObject.set('scaleX' as keyof typeof activeObject, (val / rawW) as never)
      setProps((p) => ({ ...p, scaledW: val, scaleX: val / rawW }))
    } else {
      activeObject.set('scaleY' as keyof typeof activeObject, (val / rawH) as never)
      setProps((p) => ({ ...p, scaledH: val, scaleY: val / rawH }))
    }
    canvas.renderAll()
  }, [activeObject, canvas])

  const updateShadow = useCallback((key: 'color' | 'blur' | 'offsetX' | 'offsetY', value: string | number) => {
    if (!activeObject || !canvas) return
    const cur = (activeObject as unknown as Record<string, unknown>).shadow as Record<string, unknown> | null
    const next = {
      color:   (cur?.color   as string) ?? '#000000',
      blur:    (cur?.blur    as number) ?? 0,
      offsetX: (cur?.offsetX as number) ?? 0,
      offsetY: (cur?.offsetY as number) ?? 0,
      [key]: value,
    }
    activeObject.set('shadow' as keyof typeof activeObject, next as never)
    canvas.renderAll()
    setProps((p) => ({
      ...p,
      shadowColor:   next.color   as string,
      shadowBlur:    next.blur    as number,
      shadowOffsetX: next.offsetX as number,
      shadowOffsetY: next.offsetY as number,
    }))
  }, [activeObject, canvas])

  const removeShadow = useCallback(() => {
    if (!activeObject || !canvas) return
    activeObject.set('shadow' as keyof typeof activeObject, null as never)
    canvas.renderAll()
    setProps((p) => ({ ...p, shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, shadowColor: '#000000' }))
  }, [activeObject, canvas])

  const isText = activeObject?.type === 'text' || activeObject?.type === 'i-text' || activeObject?.type === 'textbox'
  const isVdp  = isText && /\{\{[^}]+\}\}/.test(props.text ?? '')
  const opacityPct = Math.round((props.opacity ?? 1) * 100)
  const hasShadow = (props.shadowBlur ?? 0) > 0 || (props.shadowOffsetX ?? 0) !== 0 || (props.shadowOffsetY ?? 0) !== 0

  return (
    <div className="flex flex-col h-full bg-ed-surface">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-ed-border shrink-0">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-ed-text">Properties</h3>
      </div>

      <div className="flex-1 overflow-y-auto editor-scrollbar">

        {/* ══ CANVAS BACKGROUND — always visible ════════════ */}
        <Section label="Canvas Background">
          <ColorRow
            label="Color"
            value={bgColor}
            onChange={(v) => { setBgColor(v); if (canvas) setBackground(canvas, v) }}
          />
        </Section>

        {/* Empty state */}
        {!activeObject && (
          <div className="px-3 py-8 text-center">
            <p className="text-[11px] text-ed-text-dim leading-relaxed">
              Click any object on the canvas<br />to edit its properties
            </p>
          </div>
        )}

        {activeObject && (
          <>
            {/* ══ LOCK ════════════════════════════════════════ */}
            <div className="border-b border-ed-border px-3 py-2">
              <button
                onClick={() => toggleLock(canvas!, activeObject)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  props.selectable === false
                    ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                    : 'border border-ed-border text-ed-text-dim hover:text-ed-text hover:bg-ed-surface-hover'
                }`}
              >
                {props.selectable === false
                  ? <><Lock size={11} /> Locked</>
                  : <><Unlock size={11} /> Unlocked</>}
              </button>
            </div>

            {/* ══ POSITION ════════════════════════════════════ */}
            <Section label="Position">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-ed-text-dim mb-1">X</p>
                  <NumInput value={props.left ?? 0} onChange={(v) => update('left', v)} suffix="px" />
                </div>
                <div>
                  <p className="text-[10px] text-ed-text-dim mb-1">Y</p>
                  <NumInput value={props.top ?? 0} onChange={(v) => update('top', v)} suffix="px" />
                </div>
              </div>
              <Row label="Rotate">
                <NumInput value={props.angle ?? 0} onChange={(v) => update('angle', v)} min={-360} max={360} suffix="°" />
              </Row>
            </Section>

            {/* ══ SIZE ════════════════════════════════════════ */}
            <Section label="Size">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-ed-text-dim mb-1">W</p>
                  <NumInput value={props.scaledW ?? 0} onChange={(v) => updateSize('w', v)} min={1} suffix="px" />
                </div>
                <div>
                  <p className="text-[10px] text-ed-text-dim mb-1">H</p>
                  <NumInput value={props.scaledH ?? 0} onChange={(v) => updateSize('h', v)} min={1} suffix="px" />
                </div>
              </div>
            </Section>

            {/* ══ TEXT CONTENT — text objects only ════════════ */}
            {isText && (
              <Section label="Text Content">
                <textarea
                  value={props.text ?? ''}
                  onChange={(e) => {
                    update('text', e.target.value)
                    setProps((p) => ({ ...p, text: e.target.value }))
                  }}
                  rows={3}
                  className="editor-input w-full text-xs resize-none leading-relaxed"
                  placeholder="Type your text…"
                />
              </Section>
            )}

            {/* ══ FILL / COLOR — all objects ══════════════════ */}
            <Section label={isText ? 'Text Color' : 'Fill Color'}>
              <ColorRow
                label="Color"
                value={typeof props.fill === 'string' ? props.fill : '#000000'}
                onChange={(v) => update('fill', v)}
              />
              {/* Preset swatches */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => update('fill', c)}
                    title={c}
                    style={{ backgroundColor: c }}
                    className={`h-5 w-5 rounded-sm border transition-all hover:scale-110 ${
                      props.fill === c ? 'border-ed-accent ring-1 ring-ed-accent scale-110' : 'border-ed-border'
                    }`}
                  />
                ))}
              </div>
            </Section>

            {/* ══ STROKE / BORDER — all objects ═══════════════ */}
            <Section label="Stroke / Border" defaultOpen={false}>
              <ColorRow
                label="Color"
                value={props.stroke || '#000000'}
                onChange={(v) => update('stroke', v)}
              />
              <Row label="Width">
                <div className="flex items-center gap-2">
                  <input
                    type="range" min={0} max={20} step={0.5}
                    value={props.strokeWidth ?? 0}
                    onChange={(e) => update('strokeWidth', Number(e.target.value))}
                    className="flex-1"
                  />
                  <NumInput
                    value={props.strokeWidth ?? 0}
                    onChange={(v) => update('strokeWidth', v)}
                    min={0} max={20} step={0.5}
                  />
                </div>
              </Row>
              {(props.strokeWidth ?? 0) > 0 && (props.strokeWidth ?? 0) < 0.25 && (
                <p className="text-[10px] text-red-500 bg-red-50 rounded px-2 py-0.5">
                  ⚠ Stroke &lt; 0.25pt may not print clearly
                </p>
              )}
            </Section>

            {/* ══ TEXT STYLE — text objects only ══════════════ */}
            {isText && (
              <Section label="Text Style">
                {/* Font family */}
                <div className="space-y-1">
                  <p className="text-[10px] text-ed-text-dim">Font</p>
                  <select
                    value={props.fontFamily ?? 'Inter'}
                    onChange={(e) => update('fontFamily', e.target.value + ', sans-serif')}
                    className="editor-input w-full text-xs"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Font size + weight in same row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-ed-text-dim mb-1">Size</p>
                    <NumInput
                      value={props.fontSize ?? 24}
                      onChange={(v) => update('fontSize', v)}
                      min={4} max={400} suffix="pt"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-ed-text-dim mb-1">Weight</p>
                    <select
                      value={props.fontWeight ?? 'normal'}
                      onChange={(e) => update('fontWeight', e.target.value)}
                      className="editor-input w-full text-xs"
                    >
                      <option value="100">Thin</option>
                      <option value="300">Light</option>
                      <option value="normal">Regular</option>
                      <option value="500">Medium</option>
                      <option value="600">SemiBold</option>
                      <option value="bold">Bold</option>
                      <option value="900">Black</option>
                    </select>
                  </div>
                </div>
                {(props.fontSize ?? 0) < 6 && (
                  <p className="text-[10px] text-red-500 bg-red-50 rounded px-2 py-0.5">⚠ Text &lt; 6pt may be hard to read</p>
                )}

                {/* Style toggle buttons: B I U S */}
                <Row label="Style">
                  <div className="flex gap-1">
                    <ToggleBtn
                      active={props.fontWeight === 'bold' || Number(props.fontWeight) >= 700}
                      onClick={() => update('fontWeight', (props.fontWeight === 'bold' || Number(props.fontWeight) >= 700) ? 'normal' : 'bold')}
                      title="Bold"
                    ><span className="font-bold text-[13px]">B</span></ToggleBtn>
                    <ToggleBtn
                      active={props.fontStyle === 'italic'}
                      onClick={() => update('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic')}
                      title="Italic"
                    ><span className="italic text-[13px]">I</span></ToggleBtn>
                    <ToggleBtn
                      active={!!props.underline}
                      onClick={() => update('underline', !props.underline)}
                      title="Underline"
                    ><span className="underline text-[13px]">U</span></ToggleBtn>
                    <ToggleBtn
                      active={!!props.linethrough}
                      onClick={() => update('linethrough', !props.linethrough)}
                      title="Strikethrough"
                    ><span className="line-through text-[13px]">S</span></ToggleBtn>
                  </div>
                </Row>

                {/* Alignment */}
                <Row label="Align">
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map((a) => (
                      <ToggleBtn key={a} active={props.textAlign === a} onClick={() => update('textAlign', a)} title={a}>
                        <AlignIcon type={a} />
                      </ToggleBtn>
                    ))}
                  </div>
                </Row>

                {/* Line height */}
                <Row label="Line H">
                  <NumInput
                    value={Math.round((props.lineHeight ?? 1.16) * 100) / 100}
                    onChange={(v) => update('lineHeight', v)}
                    min={0.5} max={5} step={0.01}
                  />
                </Row>

                {/* Letter spacing */}
                <Row label="Spacing">
                  <NumInput
                    value={props.charSpacing ?? 0}
                    onChange={(v) => update('charSpacing', v)}
                    min={-200} max={1000} step={10}
                  />
                </Row>
              </Section>
            )}

            {/* ══ OPACITY — all objects ═══════════════════════ */}
            <Section label="Opacity">
              <div className="flex items-center gap-2">
                <input
                  type="range" min={0} max={1} step={0.01}
                  value={props.opacity ?? 1}
                  onChange={(e) => update('opacity', Number(e.target.value))}
                  className="flex-1"
                />
                <div className="flex items-center gap-0.5 shrink-0">
                  <input
                    type="number"
                    value={opacityPct}
                    onChange={(e) => update('opacity', Math.min(100, Math.max(0, Number(e.target.value))) / 100)}
                    min={0} max={100}
                    className="editor-input w-12 text-center text-xs"
                  />
                  <span className="text-[10px] text-ed-text-dim">%</span>
                </div>
              </div>
            </Section>

            {/* ══ SHADOW — all objects ════════════════════════ */}
            <Section label="Shadow" defaultOpen={false}>
              <ColorRow
                label="Color"
                value={props.shadowColor ?? '#000000'}
                onChange={(v) => updateShadow('color', v)}
              />
              <Row label="Blur">
                <div className="flex items-center gap-2">
                  <input
                    type="range" min={0} max={60} step={1}
                    value={props.shadowBlur ?? 0}
                    onChange={(e) => updateShadow('blur', Number(e.target.value))}
                    className="flex-1"
                  />
                  <NumInput
                    value={props.shadowBlur ?? 0}
                    onChange={(v) => updateShadow('blur', v)}
                    min={0} max={100}
                  />
                </div>
              </Row>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-ed-text-dim mb-1">Off X</p>
                  <NumInput
                    value={props.shadowOffsetX ?? 0}
                    onChange={(v) => updateShadow('offsetX', v)}
                    min={-100} max={100}
                  />
                </div>
                <div>
                  <p className="text-[10px] text-ed-text-dim mb-1">Off Y</p>
                  <NumInput
                    value={props.shadowOffsetY ?? 0}
                    onChange={(v) => updateShadow('offsetY', v)}
                    min={-100} max={100}
                  />
                </div>
              </div>
              {hasShadow && (
                <button
                  onClick={removeShadow}
                  className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
                >
                  ✕ Remove shadow
                </button>
              )}
            </Section>

            {/* ══ VDP — only for {{variable}} text ═══════════ */}
            {isVdp && (
              <Section label="Variable Data (VDP)" defaultOpen={false}>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-[10px] text-ed-text-dim">Multi-line</span>
                  <button
                    onClick={() => update('multiline', !props.multiline)}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                      props.multiline ? 'bg-ed-accent' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      props.multiline ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <div>
                  <p className="text-[10px] text-ed-text-dim mb-1">Overflow</p>
                  <div className="flex gap-1">
                    {(['truncate', 'shrink', 'stretch'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => update('overflowBehavior', m)}
                        className={`flex-1 py-1 text-[10px] rounded border transition-all ${
                          props.overflowBehavior === m
                            ? 'bg-ed-accent/10 border-ed-accent text-ed-accent'
                            : 'border-ed-border text-ed-text-dim hover:border-ed-text-dim'
                        }`}
                      >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-ed-text-dim mb-1">Min size</p>
                    <NumInput value={props.minFontSize ?? 8} onChange={(v) => update('minFontSize', v)} min={4} max={props.fontSize ?? 200} />
                  </div>
                  <div>
                    <p className="text-[10px] text-ed-text-dim mb-1">Max size</p>
                    <NumInput value={props.maxFontSize ?? props.fontSize ?? 24} onChange={(v) => update('maxFontSize', v)} min={props.minFontSize ?? 4} max={500} />
                  </div>
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
