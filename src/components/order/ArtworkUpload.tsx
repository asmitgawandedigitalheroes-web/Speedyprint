'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'

const ACCEPTED_EXTENSIONS = ['.pdf', '.ai', '.eps', '.png', '.jpg', '.jpeg', '.svg']
const MAX_FILE_SIZE_MB = 50
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

interface Alert {
  level: 'error' | 'warning' | 'info'
  message: string
}

interface ArtworkUploadProps {
  onFileChange?: (file: File | null) => void
  label?: string
}

function getExtension(name: string): string {
  return name.slice(name.lastIndexOf('.')).toLowerCase()
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) return null
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

export function ArtworkUpload({ onFileChange, label = 'Upload artwork file' }: ArtworkUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [dragging, setDragging] = useState(false)

  async function processFile(f: File) {
    const newAlerts: Alert[] = []
    const ext = getExtension(f.name)

    // 1. Extension check
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      newAlerts.push({
        level: 'error',
        message: `⚠️ Unsupported file type (${ext}). Please upload PDF, AI, EPS, PNG, JPG, or SVG.`,
      })
      setFile(f)
      setAlerts(newAlerts)
      onFileChange?.(f)
      return
    }

    // 2. File size check
    if (f.size > MAX_FILE_SIZE_BYTES) {
      newAlerts.push({
        level: 'error',
        message: `⚠️ File is too large (${(f.size / 1024 / 1024).toFixed(1)}MB). Maximum is ${MAX_FILE_SIZE_MB}MB. Please compress or contact us for large files.`,
      })
    }

    // 3. DPI check for raster images
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      const dims = await getImageDimensions(f)
      if (dims) {
        // Estimate DPI assuming A5 print size (148×210mm) as a baseline.
        // Real DPI check requires knowing the target print size.
        // We flag if the image is < 1748×2480px (A5 @ 300dpi).
        const minPixels = 1748 // 148mm × 300dpi / 25.4
        if (dims.width < minPixels && dims.height < minPixels) {
          newAlerts.push({
            level: 'warning',
            message: `⚠️ This image may be too low resolution for print quality (${dims.width}×${dims.height}px detected). We recommend 300 DPI minimum at your final print size.`,
          })
        }
      }
    }

    // 4. Always show CMYK banner for any upload
    newAlerts.push({
      level: 'info',
      message: 'ℹ️ All files are printed in CMYK. RGB colours will be converted — there may be minor colour differences.',
    })

    setFile(f)
    setAlerts(newAlerts)
    onFileChange?.(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) processFile(f)
  }

  function handleClear() {
    setFile(null)
    setAlerts([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    onFileChange?.(null)
  }

  const hasError = alerts.some((a) => a.level === 'error')

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-brand-text">{label}</p>

      {/* Drop zone / file display */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-8 text-center transition ${dragging ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 bg-brand-bg hover:border-brand-primary hover:bg-brand-primary/5'}`}
        >
          <Upload className="h-8 w-8 text-brand-primary/40" />
          <div>
            <p className="text-sm font-medium text-brand-text">Drop your artwork file here</p>
            <p className="mt-0.5 text-xs text-brand-text-muted">
              PDF, AI, EPS, PNG, JPG, SVG — max {MAX_FILE_SIZE_MB}MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.svg"
            onChange={handleChange}
            className="sr-only"
          />
        </div>
      ) : (
        <div className={`flex items-center justify-between rounded-md border px-4 py-3 ${hasError ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <FileText className={`h-4 w-4 shrink-0 ${hasError ? 'text-red-500' : 'text-brand-primary'}`} />
            <span className="truncate text-sm font-medium text-brand-text">{file.name}</span>
            <span className="shrink-0 text-xs text-brand-text-muted">({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="ml-3 shrink-0 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Alerts */}
      {alerts.map((alert, i) => {
        const Icon = alert.level === 'error' ? AlertTriangle : alert.level === 'warning' ? AlertTriangle : Info
        const colors = {
          error: 'border-red-200 bg-red-50 text-red-800',
          warning: 'border-amber-200 bg-amber-50 text-amber-800',
          info: 'border-blue-200 bg-blue-50 text-blue-800',
        }[alert.level]
        const iconColor = { error: 'text-red-500', warning: 'text-amber-500', info: 'text-blue-500' }[alert.level]

        return (
          <div key={i} className={`flex items-start gap-2.5 rounded-md border px-4 py-3 text-sm ${colors}`}>
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
            <p>{alert.message}</p>
          </div>
        )
      })}

      {/* Success state */}
      {file && !hasError && alerts.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          File accepted — our team will review before production.
        </div>
      )}

      <p className="text-xs text-brand-text-muted">
        Don&apos;t have artwork yet? Submit your order and we&apos;ll follow up.{' '}
        <a href="/artwork-specs" className="text-brand-primary underline underline-offset-2" target="_blank" rel="noopener noreferrer">
          See artwork specifications →
        </a>
      </p>
    </div>
  )
}
