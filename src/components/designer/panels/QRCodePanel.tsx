'use client'

/**
 * QRCodePanel — UI for generating and adding QR codes to the canvas.
 */

import { useState } from 'react'
import { QrCode } from 'lucide-react'
import { useEditorStore } from '@/lib/designer/store'

const ERROR_LEVELS = ['L', 'M', 'Q', 'H'] as const

export function QRCodePanel() {
  const editor = useEditorStore((s) => s.editor)
  const [data, setData] = useState('https://example.com')
  const [size, setSize] = useState(200)
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')

  const handleAdd = () => {
    if (!editor || !data.trim()) return
    const plugin = editor.getPlugin<{
      addQRCode: (data: string, options?: Record<string, unknown>) => Promise<void>
    }>('QRCodePlugin')
    if (plugin) {
      plugin.addQRCode(data.trim(), {
        width: size,
        errorCorrectionLevel: errorLevel,
        color: { dark: fgColor, light: bgColor },
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <QrCode className="h-4 w-4" />
        <span>QR Code</span>
      </div>

      {/* Data input */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Data / URL
        </label>
        <textarea
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          rows={3}
          placeholder="Enter URL, text, or data..."
        />
      </div>

      {/* Size */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Size: {size}px
        </label>
        <input
          type="range"
          min={50}
          max={500}
          step={10}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Error correction level */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Error Correction
        </label>
        <div className="grid grid-cols-4 gap-1">
          {ERROR_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setErrorLevel(level)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                errorLevel === level
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Foreground
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <span className="text-xs text-gray-500">{fgColor}</span>
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
        Add QR Code
      </button>
    </div>
  )
}
