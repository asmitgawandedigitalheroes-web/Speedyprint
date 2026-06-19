'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface CmykColorPickerProps {
  label: string
  color: string
  onChange: (hex: string) => void
}

// ── Conversion helpers ───────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').padEnd(6, '0')
  const n = parseInt(h.slice(0, 6), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
}

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255
  const k = 1 - Math.max(R, G, B)
  if (k === 1) return [0, 0, 0, 100]
  const c = (1 - R - k) / (1 - k)
  const m = (1 - G - k) / (1 - k)
  const y = (1 - B - k) / (1 - k)
  return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)]
}

function cmykToRgb(c: number, m: number, y: number, k: number): [number, number, number] {
  const C = c / 100, M = m / 100, Y = y / 100, K = k / 100
  return [
    Math.round(255 * (1 - C) * (1 - K)),
    Math.round(255 * (1 - M) * (1 - K)),
    Math.round(255 * (1 - Y) * (1 - K)),
  ]
}

function isValidHex(v: string) {
  return /^#[0-9a-fA-F]{6}$/.test(v)
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CmykColorPicker({ label, color, onChange }: CmykColorPickerProps) {
  const safeColor = isValidHex(color) ? color : '#000000'
  const [open, setOpen] = useState(false)
  const [hexInput, setHexInput] = useState(safeColor.toUpperCase())
  const [cmyk, setCmyk] = useState<[number, number, number, number]>(() => {
    const [r, g, b] = hexToRgb(safeColor)
    return rgbToCmyk(r, g, b)
  })
  const popoverRef = useRef<HTMLDivElement>(null)
  const swatchRef = useRef<HTMLButtonElement>(null)
  const nativeRef = useRef<HTMLInputElement>(null)

  // Sync incoming color prop
  useEffect(() => {
    if (!isValidHex(color)) return
    setHexInput(color.toUpperCase())
    const [r, g, b] = hexToRgb(color)
    setCmyk(rgbToCmyk(r, g, b))
  }, [color])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        swatchRef.current && !swatchRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const applyHex = useCallback((hex: string) => {
    if (!isValidHex(hex)) return
    const [r, g, b] = hexToRgb(hex)
    setCmyk(rgbToCmyk(r, g, b))
    onChange(hex)
  }, [onChange])

  const handleHexInput = (v: string) => {
    const normalised = v.startsWith('#') ? v : `#${v}`
    setHexInput(normalised.toUpperCase())
    if (isValidHex(normalised)) applyHex(normalised)
  }

  const handleCmykChange = (idx: number, val: number) => {
    const next = [...cmyk] as [number, number, number, number]
    next[idx] = Math.max(0, Math.min(100, val))
    setCmyk(next)
    const [r, g, b] = cmykToRgb(...next)
    const hex = rgbToHex(r, g, b)
    setHexInput(hex.toUpperCase())
    onChange(hex)
  }

  const CMYK_LABELS = ['C', 'M', 'Y', 'K']
  const CMYK_COLORS = ['#00b4d8', '#e63946', '#f9c74f', '#333333']

  return (
    <div className="relative">
      {/* Trigger row */}
      <div className="flex items-center gap-1.5">
        {label && (
          <span className="text-[11px] text-ed-text-dim w-14 flex-shrink-0 truncate">{label}</span>
        )}
        <button
          ref={swatchRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-6 h-6 rounded border border-ed-border flex-shrink-0 shadow-sm hover:scale-105 transition-transform"
          style={{ backgroundColor: safeColor }}
          title={safeColor}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexInput(e.target.value)}
          onBlur={(e) => {
            const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
            if (isValidHex(v)) applyHex(v)
          }}
          className="flex-1 editor-input font-mono text-[11px] uppercase"
          maxLength={7}
          spellCheck={false}
        />
        {/* Hidden native color picker as a fallback */}
        <input
          ref={nativeRef}
          type="color"
          value={safeColor}
          onChange={(e) => { handleHexInput(e.target.value); setHexInput(e.target.value.toUpperCase()) }}
          className="sr-only"
          tabIndex={-1}
        />
      </div>

      {/* CMYK popover */}
      {open && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-1.5 z-50 bg-ed-surface border border-ed-border rounded-lg shadow-xl shadow-black/10 p-3 w-56"
        >
          {/* Native picker at top */}
          <div className="mb-3 flex items-center gap-2">
            <input
              type="color"
              value={safeColor}
              onChange={(e) => { handleHexInput(e.target.value) }}
              className="w-8 h-8 rounded border border-ed-border cursor-pointer bg-transparent p-0.5 flex-shrink-0"
            />
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexInput(e.target.value)}
              className="flex-1 editor-input font-mono text-[11px] uppercase"
              maxLength={7}
              spellCheck={false}
            />
          </div>

          <p className="text-[10px] font-semibold text-ed-text-dim uppercase tracking-wider mb-2">CMYK</p>

          {CMYK_LABELS.map((ch, idx) => (
            <div key={ch} className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold w-3 flex-shrink-0" style={{ color: CMYK_COLORS[idx] }}>{ch}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={cmyk[idx]}
                onChange={(e) => handleCmykChange(idx, Number(e.target.value))}
                className="flex-1 h-1.5 cursor-pointer appearance-none rounded-full bg-ed-bg"
                style={{ accentColor: CMYK_COLORS[idx] }}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={cmyk[idx]}
                onChange={(e) => handleCmykChange(idx, Number(e.target.value))}
                className="w-9 editor-input text-[10px] text-center tabular-nums p-0.5"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
