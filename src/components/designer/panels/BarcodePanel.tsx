'use client'

/**
 * BarcodePanel — UI for generating and adding barcodes to the canvas.
 */

import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { useEditorStore } from '@/lib/designer/store'

const FORMATS = [
  { value: 'CODE128', label: 'Code 128', placeholder: 'ABC-123' },
  { value: 'EAN13', label: 'EAN-13', placeholder: '5901234123457' },
  { value: 'UPC', label: 'UPC', placeholder: '012345678905' },
  { value: 'CODE39', label: 'Code 39', placeholder: 'HELLO' },
  { value: 'ITF14', label: 'ITF-14', placeholder: '98249880215005' },
  { value: 'MSI', label: 'MSI', placeholder: '1234567' },
] as const

type BarcodeFormat = (typeof FORMATS)[number]['value']

export function BarcodePanel() {
  const editor = useEditorStore((s) => s.editor)
  const [data, setData] = useState('ABC-123')
  const [format, setFormat] = useState<BarcodeFormat>('CODE128')
  const [showText, setShowText] = useState(true)
  const [lineColor, setLineColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')

  const currentFormat = FORMATS.find((f) => f.value === format)

  const handleAdd = () => {
    if (!editor || !data.trim()) return
    const plugin = editor.getPlugin<{
      addBarcode: (data: string, options?: Record<string, unknown>) => Promise<void>
    }>('BarcodePlugin')
    if (plugin) {
      plugin.addBarcode(data.trim(), {
        format,
        displayValue: showText,
        lineColor,
        background: bgColor,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <BarChart3 className="h-4 w-4" />
        <span>Barcode</span>
      </div>

      {/* Format selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Format
        </label>
        <select
          value={format}
          onChange={(e) => {
            const f = e.target.value as BarcodeFormat
            setFormat(f)
            const match = FORMATS.find((fmt) => fmt.value === f)
            if (match) setData(match.placeholder)
          }}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Data input */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Data
        </label>
        <input
          type="text"
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder={currentFormat?.placeholder}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Show text toggle */}
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={showText}
          onChange={(e) => setShowText(e.target.checked)}
          className="rounded border-gray-300"
        />
        Show text below barcode
      </label>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Line Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <span className="text-xs text-gray-500">{lineColor}</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Background
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <span className="text-xs text-gray-500">{bgColor}</span>
          </div>
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        disabled={!data.trim()}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Add Barcode
      </button>
    </div>
  )
}
