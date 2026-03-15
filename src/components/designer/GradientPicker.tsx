'use client'

import { useState, useCallback } from 'react'
import { Gradient } from 'fabric'
import { cn } from '@/lib/utils'

interface GradientStop {
  offset: number
  color: string
}

interface GradientPickerProps {
  onApply: (gradient: Gradient<'linear'> | Gradient<'radial'>) => void
  className?: string
}

export function GradientPicker({ onApply, className }: GradientPickerProps) {
  const [type, setType] = useState<'linear' | 'radial'>('linear')
  const [angle, setAngle] = useState(0)
  const [stops, setStops] = useState<GradientStop[]>([
    { offset: 0, color: '#3b82f6' },
    { offset: 1, color: '#8b5cf6' },
  ])

  const updateStop = useCallback((index: number, field: keyof GradientStop, value: string | number) => {
    setStops((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    )
  }, [])

  const addStop = useCallback(() => {
    if (stops.length >= 8) return
    setStops((prev) => [
      ...prev,
      { offset: prev.length > 0 ? (prev[prev.length - 1].offset + 1) / 2 : 0.5, color: '#ffffff' },
    ].sort((a, b) => a.offset - b.offset))
  }, [stops])

  const removeStop = useCallback((index: number) => {
    if (stops.length <= 2) return
    setStops((prev) => prev.filter((_, i) => i !== index))
  }, [stops])

  const handleApply = useCallback(() => {
    // Convert angle to coords
    const radian = (angle * Math.PI) / 180
    const coords = type === 'linear'
      ? {
          x1: 0.5 - Math.cos(radian) * 0.5,
          y1: 0.5 - Math.sin(radian) * 0.5,
          x2: 0.5 + Math.cos(radian) * 0.5,
          y2: 0.5 + Math.sin(radian) * 0.5,
        }
      : { x1: 0.5, y1: 0.5, x2: 0.5, y2: 0.5, r1: 0, r2: 0.5 }

    const gradient = new Gradient({
      type,
      coords,
      colorStops: stops.map((s) => ({ offset: s.offset, color: s.color })),
    })

    onApply(gradient as Gradient<'linear'> | Gradient<'radial'>)
  }, [type, angle, stops, onApply])

  // Generate CSS gradient preview
  const previewGradient = type === 'linear'
    ? `linear-gradient(${angle}deg, ${stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ')})`
    : `radial-gradient(circle, ${stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ')})`

  return (
    <div className={cn('space-y-3', className)}>
      {/* Preview */}
      <div
        className="h-10 w-full rounded border"
        style={{ background: previewGradient }}
      />

      {/* Type selector */}
      <div className="flex gap-1">
        <button
          type="button"
          className={cn(
            'flex-1 rounded px-2 py-1 text-xs',
            type === 'linear' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
          onClick={() => setType('linear')}
        >
          Linear
        </button>
        <button
          type="button"
          className={cn(
            'flex-1 rounded px-2 py-1 text-xs',
            type === 'radial' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
          onClick={() => setType('radial')}
        >
          Radial
        </button>
      </div>

      {/* Angle (linear only) */}
      {type === 'linear' && (
        <div>
          <label className="text-xs text-muted-foreground">Angle: {angle}&#176;</label>
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(parseInt(e.target.value))}
            className="h-1 w-full cursor-pointer accent-primary"
          />
        </div>
      )}

      {/* Color stops */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Color Stops</span>
          <button
            type="button"
            onClick={addStop}
            disabled={stops.length >= 8}
            className="text-xs text-primary hover:underline disabled:opacity-50"
          >
            + Add
          </button>
        </div>
        {stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={stop.color}
              onChange={(e) => updateStop(i, 'color', e.target.value)}
              className="h-6 w-6 cursor-pointer rounded border-none"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={Math.round(stop.offset * 100)}
              onChange={(e) => updateStop(i, 'offset', parseInt(e.target.value) / 100)}
              className="h-6 w-14 rounded border px-1 text-xs"
            />
            <span className="text-xs text-muted-foreground">%</span>
            {stops.length > 2 && (
              <button
                type="button"
                onClick={() => removeStop(i)}
                className="text-xs text-destructive hover:underline"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Apply button */}
      <button
        type="button"
        onClick={handleApply}
        className="w-full rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
      >
        Apply Gradient
      </button>
    </div>
  )
}
