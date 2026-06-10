'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  Hash,
  QrCode,
  Barcode,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Papa from 'papaparse'

// ── QR code and barcode (browser-side) ───────────────────────────────────────
// qrcode and jsbarcode are already installed in the project.
// We import lazily via dynamic import to avoid SSR issues with canvas.

async function generateQRCodeDataURL(text: string): Promise<string> {
  const QRCode = (await import('qrcode')).default
  return QRCode.toDataURL(text, { width: 200, margin: 1 })
}

async function generateBarcodeDataURL(value: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create an off-screen SVG element for JsBarcode
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    import('jsbarcode').then(({ default: JsBarcode }) => {
      try {
        JsBarcode(svg, value, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 12,
          margin: 4,
        })
        const svgString = new XMLSerializer().serializeToString(svg)
        const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)))
        resolve(dataUrl)
      } catch (e) {
        reject(e)
      }
    })
  })
}

/** Adds a Fabric image object from a data URL to the centre of the canvas */
async function addImageToCanvas(canvas: any, dataUrl: string) {
  const { fabric } = await import('fabric')
  fabric.Image.fromURL(dataUrl, (img: any) => {
    img.scaleToWidth(Math.min(200, canvas.getWidth() * 0.4))
    img.set({
      left: canvas.getWidth() / 2 - (img.getScaledWidth() / 2),
      top: canvas.getHeight() / 2 - (img.getScaledHeight() / 2),
    })
    canvas.add(img)
    canvas.setActiveObject(img)
    canvas.renderAll()
  })
}

export default function BulkCreatePanel() {
  const { bulkData, setBulkData, canvas, template, designId, saveStatus } = useEditorStore()
  const [isParsing, setIsParsing] = useState(false)
  const [activeRow, setActiveRow] = useState<number | null>(null)
  const [showInsertTools, setShowInsertTools] = useState(false)
  const [serialStart, setSerialStart] = useState('1')
  const [serialPrefix, setSerialPrefix] = useState('')
  const [qrText, setQrText] = useState('')
  const [barcodeValue, setBarcodeValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Apply a CSV row's values to canvas text placeholders ─────────────────
  const applyRowToCanvas = useCallback((row: Record<string, string>) => {
    if (!canvas) return

    canvas.getObjects().forEach((obj: any) => {
      if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
        if (obj.rawText === undefined) {
          obj.rawText = obj.text || ''
        }
        let template = obj.rawText
        if (!template || !template.includes('{{')) return
        let newText = template
        Object.keys(row).forEach((header) => {
          const placeholder = `{{${header}}}`
          if (newText.includes(placeholder)) {
            newText = newText.replaceAll(placeholder, row[header])
          }
        })
        if (newText !== obj.text) {
          obj.set({ text: newText })
        }
      }
    })
    canvas.renderAll()
  }, [canvas])

  // ── CSV upload ─────────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    setError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setError('CSV must have at least one data row.')
          setIsParsing(false)
          return
        }

        const headers = results.meta.fields || []
        const rows = results.data as Record<string, string>[]

        setBulkData({ headers, rows })
        setIsParsing(false)

        // Auto-preview the first row immediately after upload
        if (rows.length > 0) {
          setActiveRow(0)
          setTimeout(() => applyRowToCanvas(rows[0]), 50)
        }
      },
      error: (err) => {
        setError(err.message)
        setIsParsing(false)
      }
    })
  }

  // ── Insert serial-number placeholder text ──────────────────────────────────
  const handleInsertSerial = () => {
    if (!canvas) return
    const { fabric } = require('fabric')
    const label = `${serialPrefix}{{_serial_}}`
    const text = new fabric.Textbox(label, {
      left: 100,
      top: 100,
      width: 200,
      fontSize: 24,
      fill: '#000000',
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    toast.success('Serial number placeholder added', {
      description: `"${label}" will be replaced with ${serialPrefix}${serialStart}, ${serialPrefix}${Number(serialStart) + 1}, … during batch export.`,
    })
  }

  // ── Insert QR code image ───────────────────────────────────────────────────
  const handleInsertQR = async () => {
    if (!canvas || !qrText.trim()) return
    setIsGenerating(true)
    try {
      const dataUrl = await generateQRCodeDataURL(qrText.trim())
      await addImageToCanvas(canvas, dataUrl)
      toast.success('QR code added to canvas')
    } catch (e: any) {
      toast.error('Failed to generate QR code: ' + e.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Insert barcode image ───────────────────────────────────────────────────
  const handleInsertBarcode = async () => {
    if (!canvas || !barcodeValue.trim()) return
    setIsGenerating(true)
    try {
      const dataUrl = await generateBarcodeDataURL(barcodeValue.trim())
      await addImageToCanvas(canvas, dataUrl)
      toast.success('Barcode added to canvas')
    } catch (e: any) {
      toast.error('Failed to generate barcode: ' + e.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-ed-surface">
      <div className="p-4 border-b border-ed-border">
        <h2 className="text-sm font-semibold text-ed-text">Variable Data</h2>
        <p className="text-xs text-ed-text-dim mt-1">
          Upload a CSV or insert serial numbers, QR codes, and barcodes.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── Insert Tools Section ─────────────────────────────────────────── */}
        <div className="border border-ed-border rounded-lg overflow-hidden">
          <button
            onClick={() => setShowInsertTools((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-ed-surface-hover transition-colors text-left"
          >
            <span className="text-[11px] font-bold text-ed-text uppercase tracking-wide">Insert Elements</span>
            {showInsertTools ? <ChevronUp size={14} className="text-ed-text-dim" /> : <ChevronDown size={14} className="text-ed-text-dim" />}
          </button>

          {showInsertTools && (
            <div className="border-t border-ed-border divide-y divide-ed-border">

              {/* Serial Number */}
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Hash size={13} className="text-ed-accent shrink-0" />
                  <p className="text-[11px] font-semibold text-ed-text">Serialised Number</p>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Prefix (e.g. INV-)"
                    value={serialPrefix}
                    onChange={(e) => setSerialPrefix(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1 text-[11px] border border-ed-border rounded editor-input"
                  />
                  <input
                    type="number"
                    placeholder="Start"
                    value={serialStart}
                    onChange={(e) => setSerialStart(e.target.value)}
                    className="w-14 px-2 py-1 text-[11px] border border-ed-border rounded editor-input"
                  />
                </div>
                <button
                  onClick={handleInsertSerial}
                  disabled={!canvas}
                  className="w-full py-1.5 bg-ed-accent/10 hover:bg-ed-accent/20 text-ed-accent text-[11px] font-semibold rounded transition-colors disabled:opacity-40"
                >
                  Insert Placeholder
                </button>
                <p className="text-[9px] text-ed-text-dim leading-relaxed">
                  A <code className="bg-ed-surface-hover px-0.5 rounded">{'{{_serial_}}'}</code> placeholder is added to the canvas. Each exported file will use the next number in sequence.
                </p>
              </div>

              {/* QR Code */}
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <QrCode size={13} className="text-ed-accent shrink-0" />
                  <p className="text-[11px] font-semibold text-ed-text">QR Code</p>
                </div>
                <input
                  type="text"
                  placeholder="URL or text to encode"
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-ed-border rounded editor-input"
                />
                <button
                  onClick={handleInsertQR}
                  disabled={!canvas || !qrText.trim() || isGenerating}
                  className="w-full py-1.5 bg-ed-accent/10 hover:bg-ed-accent/20 text-ed-accent text-[11px] font-semibold rounded transition-colors disabled:opacity-40"
                >
                  {isGenerating ? 'Generating…' : 'Add QR Code to Canvas'}
                </button>
              </div>

              {/* Barcode */}
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Barcode size={13} className="text-ed-accent shrink-0" />
                  <p className="text-[11px] font-semibold text-ed-text">Barcode (CODE128)</p>
                </div>
                <input
                  type="text"
                  placeholder="Value to encode (e.g. SKU123)"
                  value={barcodeValue}
                  onChange={(e) => setBarcodeValue(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-ed-border rounded editor-input"
                />
                <button
                  onClick={handleInsertBarcode}
                  disabled={!canvas || !barcodeValue.trim() || isGenerating}
                  className="w-full py-1.5 bg-ed-accent/10 hover:bg-ed-accent/20 text-ed-accent text-[11px] font-semibold rounded transition-colors disabled:opacity-40"
                >
                  {isGenerating ? 'Generating…' : 'Add Barcode to Canvas'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── CSV Upload Section ───────────────────────────────────────────── */}
        {!bulkData ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-ed-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-ed-accent/50 hover:bg-ed-accent/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-ed-surface-hover flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={24} className="text-ed-text-dim group-hover:text-ed-accent" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-ed-text">Upload CSV file</p>
              <p className="text-xs text-ed-text-dim mt-1">Click to browse · Rows are auto-previewed</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-ed-accent/5 border border-ed-accent/20 rounded-lg p-3 flex items-start gap-3">
              <CheckCircle2 size={16} className="text-ed-accent mt-0.5" />
              <div>
                <p className="text-xs font-medium text-ed-text">CSV Uploaded</p>
                <p className="text-[10px] text-ed-text-dim mt-0.5">
                  {bulkData.rows.length} rows · {bulkData.headers.length} columns
                </p>
                <button
                  onClick={() => { setBulkData(null); setActiveRow(null) }}
                  className="text-[10px] text-ed-accent font-medium mt-1 hover:underline"
                >
                  Change file
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider font-bold text-ed-text-dim">Available Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {bulkData.headers.map((header) => (
                  <code
                    key={header}
                    className="text-[10px] bg-ed-surface-hover px-1.5 py-0.5 rounded border border-ed-border text-ed-text"
                  >
                    {`{{${header}}}`}
                  </code>
                ))}
              </div>
              <p className="text-[10px] text-ed-text-dim leading-relaxed">
                Add these tags to any text element on the canvas to map data from the CSV.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider font-bold text-ed-text-dim">
                Preview Rows <span className="normal-case font-normal">(click to apply)</span>
              </p>
              <div className="border border-ed-border rounded-lg divide-y divide-ed-border overflow-hidden">
                {bulkData.rows.slice(0, 5).map((row, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveRow(i)
                      applyRowToCanvas(row)
                    }}
                    className={`w-full text-left p-2 transition-colors flex items-center justify-between group ${
                      activeRow === i
                        ? 'bg-ed-accent/10 border-l-2 border-l-ed-accent'
                        : 'hover:bg-ed-surface-hover'
                    }`}
                  >
                    <div className="truncate pr-4">
                      <p className="text-[11px] font-medium text-ed-text truncate">
                        Row {i + 1}: {Object.values(row)[0]}
                      </p>
                    </div>
                    {activeRow === i ? (
                      <CheckCircle2 size={10} className="text-ed-accent shrink-0" />
                    ) : (
                      <Play size={10} className="text-ed-text-dim opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </button>
                ))}
                {bulkData.rows.length > 5 && (
                  <div className="p-2 text-center">
                    <p className="text-[10px] text-ed-text-dim">
                      + {bulkData.rows.length - 5} more rows
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  if (!template) return
                  if (saveStatus === 'unsaved' || !designId) {
                    toast.error('Please save your design first before proceeding to batch order.', {
                      description: 'We need a saved design ID to link with your CSV data.',
                    })
                    return
                  }
                  router.push(`/designer/${template.id}/csv?design=${designId}`)
                }}
                className="w-full py-3 bg-gradient-to-r from-ed-accent to-ed-accent-hover text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-ed-accent/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                Proceed to Batch Order
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-[9px] text-ed-text-dim mt-2 text-center">
                Generates all {bulkData.rows.length} files at once for a bulk order.
              </p>
            </div>
          </div>
        )}

        {isParsing && (
          <p className="text-xs text-ed-text-dim text-center py-2">Parsing CSV…</p>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle size={16} className="text-red-500 mt-0.5" />
            <p className="text-[10px] text-red-500 leading-normal">{error}</p>
          </div>
        )}

        <div className="mt-4 p-3 bg-ed-surface-hover rounded-lg border border-ed-border">
          <p className="text-[11px] font-medium text-ed-text mb-2">How it works:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-[10px] text-ed-text-dim">
            <li>Create text on the canvas with <code className="bg-ed-surface px-1 rounded">{'{{column_name}}'}</code> placeholders.</li>
            <li>Upload your CSV — the first row previews instantly.</li>
            <li>Click any row above to see that entry on the canvas.</li>
            <li>Use <em>Proceed to Batch Order</em> to generate all files.</li>
            <li>Use <em>Insert Elements</em> above to add serial numbers, QR codes, or barcodes.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
