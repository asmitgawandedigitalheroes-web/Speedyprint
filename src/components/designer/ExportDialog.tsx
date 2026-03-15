'use client'

/**
 * ExportDialog — Export format selection, quality settings, and download.
 */

import { useState, useCallback, useEffect } from 'react'
import { Download, X, FileImage, FileCode, FileText } from 'lucide-react'
import { useEditorStore } from '@/lib/designer/store'

type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
}

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const editor = useEditorStore((s) => s.editor)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [quality, setQuality] = useState(0.92)
  const [multiplier, setMultiplier] = useState(1)
  const [filename, setFilename] = useState('design')
  const [estimatedSize, setEstimatedSize] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const getPlugin = useCallback(() => {
    if (!editor) return null
    return editor.getPlugin<{
      downloadPNG: (filename: string, multiplier: number) => void
      downloadJPEG: (filename: string, quality: number) => void
      downloadSVG: (filename: string) => void
      downloadPDF: (filename: string) => Promise<void>
      estimateFileSize: (format: 'png' | 'jpeg' | 'svg', multiplier: number) => string
    }>('ExportPlugin')
  }, [editor])

  // Update estimated size when settings change
  useEffect(() => {
    const plugin = getPlugin()
    if (!plugin || !open) return

    try {
      if (format !== 'pdf') {
        const size = plugin.estimateFileSize(format, multiplier)
        setEstimatedSize(size)
      } else {
        setEstimatedSize('~1-5 MB')
      }
    } catch {
      setEstimatedSize('Unknown')
    }
  }, [format, quality, multiplier, open, getPlugin])

  const handleExport = async () => {
    const plugin = getPlugin()
    if (!plugin) return

    setIsExporting(true)
    try {
      const ext = format === 'jpeg' ? 'jpg' : format
      const fullFilename = `${filename}.${ext}`

      switch (format) {
        case 'png':
          plugin.downloadPNG(fullFilename, multiplier)
          break
        case 'jpeg':
          plugin.downloadJPEG(fullFilename, quality)
          break
        case 'svg':
          plugin.downloadSVG(fullFilename)
          break
        case 'pdf':
          await plugin.downloadPDF(fullFilename)
          break
      }

      onClose()
    } catch (err) {
      console.error('[ExportDialog] Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  if (!open) return null

  const formats: Array<{
    value: ExportFormat
    label: string
    icon: React.ComponentType<{ className?: string }>
    desc: string
  }> = [
    { value: 'png', label: 'PNG', icon: FileImage, desc: 'Best for web, transparent bg' },
    { value: 'jpeg', label: 'JPEG', icon: FileImage, desc: 'Smaller file, no transparency' },
    { value: 'svg', label: 'SVG', icon: FileCode, desc: 'Vector, infinitely scalable' },
    { value: 'pdf', label: 'PDF', icon: FileText, desc: 'Print-ready document' },
  ]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold">Export Design</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Format selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((f) => {
                const Icon = f.icon
                return (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left transition-colors ${
                      format === f.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${format === f.value ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div>
                      <div className="text-sm font-semibold">{f.label}</div>
                      <div className="text-[10px] text-gray-500">{f.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Filename */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Filename
            </label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-500">
                .{format === 'jpeg' ? 'jpg' : format}
              </span>
            </div>
          </div>

          {/* Quality slider (JPEG only) */}
          {format === 'jpeg' && (
            <div>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span>Quality</span>
                <span className="font-mono">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* DPI multiplier (PNG/JPEG) */}
          {(format === 'png' || format === 'jpeg') && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Resolution
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMultiplier(m)}
                    className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                      multiplier === m
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {m}x ({m * 72} DPI)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Estimated size */}
          {estimatedSize && (
            <div className="text-xs text-gray-500">
              Estimated file size: <span className="font-medium">{estimatedSize}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !filename.trim()}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  )
}
