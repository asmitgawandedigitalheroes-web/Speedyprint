'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  label?: string
  className?: string
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#1e293b', '#0ea5e9',
  '#14b8a6', '#a855f7', '#f43f5e', '#d97706', '#059669', '#7c3aed',
]

const RECENT_COLORS_KEY = 'sp-designer-recent-colors'
const MAX_RECENT = 8

export function ColorPicker({ color, onChange, label, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hexInput, setHexInput] = useState(color)
  const [recentColors, setRecentColors] = useState<string[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  // Load recent colors from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_COLORS_KEY)
      if (stored) setRecentColors(JSON.parse(stored))
    } catch {
      // Ignore
    }
  }, [])

  // Sync hexInput when color prop changes
  useEffect(() => {
    setHexInput(color)
  }, [color])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const applyColor = useCallback(
    (newColor: string) => {
      onChange(newColor)
      setHexInput(newColor)

      // Add to recent colors
      setRecentColors((prev) => {
        const updated = [newColor, ...prev.filter((c) => c !== newColor)].slice(0, MAX_RECENT)
        try {
          localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated))
        } catch {
          // Ignore
        }
        return updated
      })
    },
    [onChange]
  )

  const handleHexSubmit = useCallback(() => {
    const hex = hexInput.startsWith('#') ? hexInput : `#${hexInput}`
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      applyColor(hex)
    }
  }, [hexInput, applyColor])

  return (
    <div className={cn('relative', className)} ref={panelRef}>
      {label && <label className="mb-1 block text-xs text-muted-foreground">{label}</label>}

      {/* Color swatch trigger */}
      <button
        type="button"
        className="flex items-center gap-2 rounded-md border p-1.5 hover:bg-accent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          className="h-5 w-5 rounded border"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-mono">{color}</span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border bg-popover p-3 shadow-lg">
          {/* Native color input */}
          <input
            type="color"
            value={color}
            onChange={(e) => applyColor(e.target.value)}
            className="mb-2 h-8 w-full cursor-pointer rounded border-none"
          />

          {/* Hex input */}
          <div className="mb-2 flex items-center gap-1">
            <input
              type="text"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onBlur={handleHexSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleHexSubmit()}
              className="h-7 flex-1 rounded border px-2 text-xs font-mono"
              placeholder="#000000"
            />
          </div>

          {/* Opacity slider */}
          <div className="mb-2">
            <label className="text-[10px] text-muted-foreground">Opacity</label>
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={100}
              className="h-1 w-full cursor-pointer accent-primary"
            />
          </div>

          {/* Preset swatches */}
          <div className="mb-2">
            <p className="mb-1 text-[10px] text-muted-foreground">Presets</p>
            <div className="grid grid-cols-9 gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    'h-5 w-5 rounded border hover:scale-110 transition-transform',
                    color === c && 'ring-2 ring-primary ring-offset-1'
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => applyColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Recent colors */}
          {recentColors.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] text-muted-foreground">Recent</p>
              <div className="flex gap-1">
                {recentColors.map((c, i) => (
                  <button
                    key={`${c}-${i}`}
                    type="button"
                    className="h-5 w-5 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    onClick={() => applyColor(c)}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
