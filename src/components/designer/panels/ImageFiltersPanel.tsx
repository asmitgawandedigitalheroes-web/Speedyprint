'use client'

/**
 * ImageFiltersPanel — Slider controls for image filters + presets.
 */

import { useState, useEffect, useCallback } from 'react'
import { ImageIcon, RotateCcw } from 'lucide-react'
import { FabricImage } from 'fabric'
import { useEditorStore } from '@/lib/designer/store'

interface FilterState {
  brightness: number
  contrast: number
  saturation: number
  blur: number
}

const DEFAULT_FILTERS: FilterState = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
}

const PRESETS = [
  'Grayscale',
  'Sepia',
  'Vintage',
  'High Contrast',
  'Warm',
  'Cool',
]

export function ImageFiltersPanel() {
  const editor = useEditorStore((s) => s.editor)
  const activeObjects = useEditorStore((s) => s.activeObjects)
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS })

  const activeImage = activeObjects.length === 1 && activeObjects[0] instanceof FabricImage
    ? activeObjects[0]
    : null

  // Reset filter display when selection changes
  useEffect(() => {
    setFilters({ ...DEFAULT_FILTERS })
  }, [activeImage])

  const getPlugin = useCallback(() => {
    if (!editor) return null
    return editor.getPlugin<{
      applyBrightness: (v: number) => void
      applyContrast: (v: number) => void
      applySaturation: (v: number) => void
      applyBlur: (v: number) => void
      applyGrayscale: () => void
      applyPreset: (name: string) => void
      clearFilters: () => void
      getPresets: () => string[]
    }>('ImagePlugin')
  }, [editor])

  const handleFilterChange = (key: keyof FilterState, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    const plugin = getPlugin()
    if (!plugin) return

    switch (key) {
      case 'brightness':
        plugin.applyBrightness(value)
        break
      case 'contrast':
        plugin.applyContrast(value)
        break
      case 'saturation':
        plugin.applySaturation(value)
        break
      case 'blur':
        plugin.applyBlur(value)
        break
    }
  }

  const handlePreset = (presetName: string) => {
    const plugin = getPlugin()
    if (!plugin) return
    plugin.applyPreset(presetName)
  }

  const handleReset = () => {
    setFilters({ ...DEFAULT_FILTERS })
    const plugin = getPlugin()
    if (!plugin) return
    plugin.clearFilters()
  }

  if (!activeImage) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <ImageIcon className="mb-2 h-8 w-8" />
        <p className="text-sm">Select an image to apply filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <ImageIcon className="h-4 w-4" />
          <span>Image Filters</span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
          title="Reset all filters"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      {/* Sliders */}
      <div className="space-y-3">
        <FilterSlider
          label="Brightness"
          value={filters.brightness}
          min={-1}
          max={1}
          step={0.05}
          onChange={(v) => handleFilterChange('brightness', v)}
        />
        <FilterSlider
          label="Contrast"
          value={filters.contrast}
          min={-1}
          max={1}
          step={0.05}
          onChange={(v) => handleFilterChange('contrast', v)}
        />
        <FilterSlider
          label="Saturation"
          value={filters.saturation}
          min={-1}
          max={1}
          step={0.05}
          onChange={(v) => handleFilterChange('saturation', v)}
        />
        <FilterSlider
          label="Blur"
          value={filters.blur}
          min={0}
          max={1}
          step={0.02}
          onChange={(v) => handleFilterChange('blur', v)}
        />
      </div>

      {/* Presets */}
      <div className="border-t pt-3">
        <div className="mb-2 text-xs font-medium text-gray-600">Presets</div>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePreset(preset)}
              className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Internal slider component ---

function FilterSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-mono">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  )
}
