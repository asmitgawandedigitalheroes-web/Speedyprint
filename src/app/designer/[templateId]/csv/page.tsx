'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Download,
  Eye,
  ArrowRight,
  Trash2,
  MapPin,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ProductTemplate, TemplateParameter } from '@/types'
import { useCart } from '@/hooks/useCart'
import { useRouter, useSearchParams } from 'next/navigation'
import { MAX_CSV_ROWS } from '@/lib/utils/constants'

type Step = 'upload' | 'preview' | 'mapping' | 'processing' | 'complete'

interface ValidationError {
  row: number
  column: string
  message: string
}

interface CsvJobResult {
  id: string
  status: string
  progress: number
  row_count: number
  error_log: Array<{ row: number; error: string }>
  completed_at: string | null
}

interface DesignerCsvPageProps {
  params: Promise<{ templateId: string }>
}


export default function DesignerCsvPage({ params }: DesignerCsvPageProps) {
  const { templateId } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const designIdParam = searchParams.get('design')

  const [template, setTemplate] = useState<ProductTemplate | null>(null)
  const [design, setDesign] = useState<any | null>(null)
  const [templateParams, setTemplateParams] = useState<TemplateParameter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // CSV state
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [headerWarnings, setHeaderWarnings] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<CsvJobResult | null>(null)
  const [sampleProofUrl, setSampleProofUrl] = useState<string | null>(null)
  const [generatingProof, setGeneratingProof] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cart state
  const addItem = useCart((s) => s.addItem)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartAdded, setCartAdded] = useState(false)

  // Fetch template & optional design
  useEffect(() => {
    const supabase = createClient()
    
    // Fetch Template
    supabase
      .from('product_templates')
      .select('*, product_group:product_groups(*), parameters:template_parameters(*)')
      .eq('id', templateId)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Template not found')
        } else {
          setTemplate(data as unknown as ProductTemplate)
          setTemplateParams(
            ((data as unknown as ProductTemplate).parameters || []).sort(
              (a, b) => a.display_order - b.display_order
            )
          )
        }
        if (!designIdParam) setLoading(false)
      })

    // Fetch Design if provided
    if (designIdParam) {
      supabase
        .from('designs')
        .select('*')
        .eq('id', designIdParam)
        .single()
        .then(({ data }) => {
          if (data) setDesign(data)
          setLoading(false)
        })
    }
  }, [templateId, designIdParam])

  // Parse CSV client-side
  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile)
      setValidationErrors([])
      setError(null)

      try {
        // BUG-13: Validate file content is valid UTF-8 text, not a binary file
        const rawBytes = await selectedFile.arrayBuffer()
        const firstBytes = new Uint8Array(rawBytes.slice(0, 4))
        // Common binary magic bytes: PNG (89 50 4E 47), JPEG (FF D8), PDF (25 50 44 46), ZIP/DOCX (50 4B)
        const isBinary =
          (firstBytes[0] === 0x89 && firstBytes[1] === 0x50) || // PNG
          (firstBytes[0] === 0xff && firstBytes[1] === 0xd8) || // JPEG
          (firstBytes[0] === 0x25 && firstBytes[1] === 0x50) || // PDF
          (firstBytes[0] === 0x50 && firstBytes[1] === 0x4b)    // ZIP/DOCX
        if (isBinary) {
          setError('The selected file does not appear to be a valid CSV text file.')
          setFile(null)
          return
        }

        const Papa = (await import('papaparse')).default
        const text = await selectedFile.text()

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as Record<string, string>[]
            const csvHeaders = results.meta.fields || []

            // BUG-12: Check for parse errors (e.g. unterminated quotes)
            if (results.errors && results.errors.length > 0) {
              const firstErr = results.errors[0]
              setError(`CSV parse error on row ${firstErr.row ?? '?'}: ${firstErr.message}. Please fix the file and try again.`)
              return
            }

            if (data.length === 0) {
              setError('CSV file is empty')
              return
            }

            // BUG-11: Enforce row limit
            if (data.length > MAX_CSV_ROWS) {
              setError(`CSV contains ${data.length.toLocaleString()} rows. Maximum allowed is ${MAX_CSV_ROWS.toLocaleString()} rows.`)
              return
            }

            setParsedData(data)
            setHeaders(csvHeaders)

            // Auto-map columns by matching names
            const mapping: Record<string, string> = {}
            for (const param of templateParams) {
              const matchHeader = csvHeaders.find(
                (h) =>
                  h.toLowerCase() === param.param_key.toLowerCase() ||
                  h.toLowerCase() === param.param_label.toLowerCase() ||
                  h.toLowerCase().replace(/[_\s-]/g, '') ===
                    param.param_key.toLowerCase().replace(/[_\s-]/g, '')
              )
              if (matchHeader) {
                mapping[param.param_key] = matchHeader
              }
            }
            setColumnMapping(mapping)

            // Warn about template parameters not matched to any CSV column
            const warnings: string[] = []
            for (const param of templateParams) {
              const isMapped = !!mapping[param.param_key]
              const hasDirectMatch = csvHeaders.some(
                (h) => h === param.param_key || h.toLowerCase() === param.param_key.toLowerCase()
              )
              if (!isMapped && !hasDirectMatch) {
                warnings.push(
                  `"{{${param.param_key}}}" (${param.param_label}) has no matching column — will use empty string`
                )
              }
            }
            setHeaderWarnings(warnings)

            setStep('preview')
          },
          error: (err: Error) => {
            setError(`Failed to parse CSV: ${err.message}`)
          },
        })
      } catch {
        setError('Failed to read file')
      }
    },
    [templateParams]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.type === 'text/csv')) {
        handleFileSelect(droppedFile)
      } else {
        setError('Please upload a .csv file')
      }
    },
    [handleFileSelect]
  )

  // Upload to API
  const handleUpload = useCallback(async () => {
    if (!parsedData.length) return
    setUploading(true)
    setValidationErrors([])
    setError(null)

    try {
      const res = await fetch('/api/csv/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          filename: file?.name || 'upload.csv',
          parsed_data: parsedData,
          column_mapping: {
            ...columnMapping,
            _design_id: designIdParam
          },
          row_count: parsedData.length,
        }),
      })

      const data = await res.json()

      if (res.status === 422 && data.validation_errors) {
        setValidationErrors(data.validation_errors)
        setError(`Validation failed: ${data.validation_errors.length} error(s) found`)
        setUploading(false)
        return
      }

      if (!res.ok) {
        setError(data.error || 'Upload failed')
        setUploading(false)
        return
      }

      setJobId(data.id)
      setStep('mapping')
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [parsedData, templateId, file, columnMapping])

  // Generate sample proof
  const handleSampleProof = useCallback(async () => {
    if (!jobId) return
    setGeneratingProof(true)
    try {
      const res = await fetch(`/api/csv/${jobId}/sample-proof`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.proof_url) {
        setSampleProofUrl(data.proof_url)
      } else {
        setError(data.error || 'Sample proof failed')
      }
    } catch {
      setError('Failed to generate sample proof')
    } finally {
      setGeneratingProof(false)
    }
  }, [jobId])

  // Start generation
  const handleGenerate = useCallback(async () => {
    if (!jobId) return
    setError(null)
    try {
      const res = await fetch(`/api/csv/${jobId}/generate`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Generation failed')
        return
      }
      setStep('processing')

      // Start polling
      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/csv/${jobId}/status`)
          const statusData = await statusRes.json()
          setJobStatus(statusData)

          if (statusData.status === 'completed' || statusData.status === 'error') {
            if (pollingRef.current) clearInterval(pollingRef.current)
            if (statusData.status === 'completed') {
              setStep('complete')
            }
          }
        } catch {
          // Continue polling
        }
      }, 2000)
    } catch {
      setError('Failed to start generation')
    }
  }, [jobId])

  // Cleanup polling
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // Download ZIP
  const handleDownload = useCallback(async () => {
    if (!jobId) return
    const res = await fetch(`/api/csv/${jobId}/download`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${file?.name?.replace('.csv', '') || 'batch'}-production-files.zip`
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [jobId, file])

  const handleReset = () => {
    setStep('upload')
    setFile(null)
    setParsedData([])
    setHeaders([])
    setColumnMapping({})
    setValidationErrors([])
    setHeaderWarnings([])
    setJobId(null)
    setJobStatus(null)
    setSampleProofUrl(null)
    setError(null)
  }

  // Compute unit price based on template or default
  const getUnitPrice = useCallback((qty: number) => {
    // Base price R5.00 per unit for 100x100mm
    let base = 5.0
    if (template) {
      // Scale by area relative to 100x100mm
      const area = (template.print_width_mm * template.print_height_mm) / (100 * 100)
      base = 5.0 * Math.max(area, 0.5)
    }
    // Volume discounts
    if (qty >= 1000) base *= 0.65
    else if (qty >= 500) base *= 0.72
    else if (qty >= 250) base *= 0.78
    else if (qty >= 100) base *= 0.85
    else if (qty >= 50) base *= 0.92

    return Math.round(base * 100) / 100
  }, [template])

  const handleAddToCart = useCallback(async () => {
    if (!template || !jobId) return
    setAddingToCart(true)

    try {
      const quantity = parsedData.length
      const unitPrice = getUnitPrice(quantity)

      addItem({
        product_group_id: template.product_group_id ?? 'custom-design',
        product_template_id: template.id,
        product_name: template.product_group?.name ?? template.name,
        template_name: template.name,
        quantity: quantity,
        unit_price: unitPrice,
        selected_params: {
          width_mm: template.print_width_mm,
          height_mm: template.print_height_mm,
          csv_job: true
        },
        design_id: designIdParam ?? undefined,
        csv_job_id: jobId,
        thumbnail_url: design?.thumbnail_url || template.image_url || undefined,
      })

      setCartAdded(true)
      // Small delay then redirect to cart
      setTimeout(() => {
        router.push('/cart')
      }, 1500)
    } catch (err) {
      console.error('Add to cart failed:', err)
      setError('Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }, [template, jobId, parsedData.length, getUnitPrice, addItem, designIdParam, design?.thumbnail_url, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-red-500" size={32} />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Template Not Found</h2>
          <Link href="/products" className="text-red-500 hover:underline">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  const stepLabels = ['Upload CSV', 'Preview & Map', 'Review & Generate', 'Processing', 'Complete']
  const stepKeys: Step[] = ['upload', 'preview', 'mapping', 'processing', 'complete']
  const currentStepIdx = stepKeys.indexOf(step)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link
              href={designIdParam ? `/designer/${templateId}?designId=${designIdParam}` : `/designer/${templateId}`}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
            >
              <ArrowLeft size={16} /> Back to Editor
            </Link>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              CSV Batch Upload {designIdParam && <span className="text-ed-accent text-xs font-normal ml-2">(Using Custom Design)</span>}
            </h1>
            <p className="text-xs text-gray-500">
              {template.name} — {template.print_width_mm}×{template.print_height_mm}mm
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-8">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  i < currentStepIdx
                    ? 'bg-green-100 text-green-700'
                    : i === currentStepIdx
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i < currentStepIdx ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-current/10 text-[10px] font-bold">
                    {i + 1}
                  </span>
                )}
                {label}
              </div>
              {i < stepLabels.length - 1 && (
                <ArrowRight size={14} className="text-gray-300" />
              )}
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
              {validationErrors.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {validationErrors.slice(0, 10).map((ve, i) => (
                    <li key={i} className="text-xs text-red-600">
                      Row {ve.row}, Column &quot;{ve.column}&quot;: {ve.message}
                    </li>
                  ))}
                  {validationErrors.length > 10 && (
                    <li className="text-xs text-red-500 font-medium">
                      ... and {validationErrors.length - 10} more errors
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="text-center mb-6">
              <FileSpreadsheet size={48} className="mx-auto text-gray-300 mb-3" />
              <h2 className="text-lg font-semibold text-gray-900">Upload your CSV file</h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload a CSV with variable data (names, numbers, etc.) to batch-generate production files.
              </p>
            </div>

            {templateParams.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <p className="text-xs font-semibold text-blue-700 mb-2">Expected CSV columns:</p>
                <div className="flex flex-wrap gap-2">
                  {templateParams.map((p) => (
                    <span
                      key={p.id}
                      className={`px-2 py-0.5 rounded text-xs ${
                        p.is_required
                          ? 'bg-blue-200 text-blue-800 font-medium'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {p.param_label}
                      {p.is_required && ' *'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition"
            >
              <Upload size={32} className="mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600">
                Drag and drop your CSV file here, or{' '}
                <span className="text-red-500 font-medium">click to browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Max 5,000 rows</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFileSelect(f)
                }}
              />
            </div>
          </div>
        )}

        {/* Step 2: Preview & Map */}
        {step === 'preview' && (
          <div className="space-y-6">
            {/* File info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={20} className="text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file?.name}</p>
                    <p className="text-xs text-gray-500">
                      {parsedData.length} rows × {headers.length} columns
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>

              {/* Data Preview Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">#</th>
                        {headers.map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedData.slice(0, 20).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                          {headers.map((h) => (
                            <td key={h} className="px-3 py-1.5 text-gray-700 max-w-[200px] truncate">
                              {row[h] || <span className="text-gray-300">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 20 && (
                  <div className="bg-gray-50 px-3 py-2 text-xs text-gray-400 text-center">
                    Showing first 20 of {parsedData.length} rows
                  </div>
                )}
              </div>
            </div>

            {/* Header mismatch warnings */}
            {headerWarnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">
                  {headerWarnings.length} placeholder{headerWarnings.length > 1 ? 's' : ''} not matched to a CSV column:
                </p>
                <ul className="space-y-0.5">
                  {headerWarnings.map((w, i) => (
                    <li key={i} className="text-xs text-amber-600">{w}</li>
                  ))}
                </ul>
                <p className="text-xs text-amber-500 mt-1">
                  You can fix the mapping below, or these fields will be left blank in output.
                </p>
              </div>
            )}

            {/* Column Mapping */}
            {templateParams.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={16} className="text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">Column Mapping</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Map your CSV columns to template fields. Auto-detected mappings are pre-filled.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templateParams.map((param) => (
                    <div key={param.id} className="flex items-center gap-3">
                      <label className="text-xs font-medium text-gray-700 w-32 shrink-0 truncate">
                        {param.param_label}
                        {param.is_required && <span className="text-red-400 ml-0.5">*</span>}
                      </label>
                      <select
                        value={columnMapping[param.param_key] || ''}
                        onChange={(e) =>
                          setColumnMapping((prev) => ({
                            ...prev,
                            [param.param_key]: e.target.value,
                          }))
                        }
                        className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-300"
                      >
                        <option value="">— Select column —</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition"
              >
                Start Over
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50 transition flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    Upload & Validate <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Generate */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 size={20} className="text-green-500" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">CSV Validated Successfully</h3>
                  <p className="text-xs text-gray-500">
                    {parsedData.length} rows ready for batch generation
                  </p>
                </div>
              </div>

              {/* Sample Proof Section */}
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Sample Preview</p>
                    <p className="text-xs text-gray-500">
                      Generate a preview of the first 5 entries before batch-processing all rows
                    </p>
                  </div>
                  <button
                    onClick={handleSampleProof}
                    disabled={generatingProof}
                    className="px-4 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition flex items-center gap-1.5"
                  >
                    {generatingProof ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Eye size={12} /> Generate Sample Proof
                      </>
                    )}
                  </button>
                </div>

                {sampleProofUrl && (
                  <div className="mt-4">
                    <a
                      href={sampleProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-[3/4] max-w-sm mx-auto border border-gray-200 rounded-md overflow-hidden hover:border-red-300 transition shadow-sm"
                    >
                      <iframe
                        src={`${sampleProofUrl}#toolbar=0`}
                        className="w-full h-full pointer-events-none"
                        title="Sample Proof"
                      />
                    </a>
                    <p className="text-center text-xs text-gray-400 mt-2">
                      Click to view full 5-page sample proof
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('preview')}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                className="px-6 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition flex items-center gap-2"
              >
                Generate All {parsedData.length} Files <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Processing */}
        {step === 'processing' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Loader2 size={40} className="mx-auto animate-spin text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Production Files</h3>
            <p className="text-sm text-gray-500 mb-6">
              Processing {parsedData.length} entries. This may take a few minutes.
            </p>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{jobStatus?.progress ?? 0}% complete</span>
                <span>
                  {Math.round(((jobStatus?.progress ?? 0) / 100) * parsedData.length)} /{' '}
                  {parsedData.length} files
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${jobStatus?.progress ?? 0}%` }}
                />
              </div>
            </div>

            {jobStatus?.error_log && jobStatus.error_log.length > 0 && (
              <div className="max-w-md mx-auto mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
                <p className="text-xs font-medium text-amber-700 mb-1">
                  {jobStatus.error_log.length} row(s) had errors:
                </p>
                {jobStatus.error_log.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-amber-600">
                    Row {e.row}: {e.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Batch Generation Complete!</h3>
            <p className="text-sm text-gray-500 mb-6">
              {parsedData.length} production files generated successfully.
              {jobStatus?.error_log && jobStatus.error_log.length > 0 && (
                <span className="text-amber-600">
                  {' '}
                  ({jobStatus.error_log.length} row(s) had errors)
                </span>
              )}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleDownload}
                className="px-6 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition flex items-center gap-2"
              >
                <Download size={16} /> Download ZIP
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Upload Another CSV
              </button>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || cartAdded}
                className={`px-6 py-2.5 text-white text-sm font-bold rounded-lg transition flex items-center gap-2 shadow-lg ${
                  cartAdded 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-gradient-to-r from-ed-accent to-ed-accent-hover hover:from-ed-accent-hover hover:to-ed-accent active:scale-95'
                }`}
              >
                {addingToCart ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Adding...
                  </>
                ) : cartAdded ? (
                  <>
                    <CheckCircle2 size={16} /> Added to Cart!
                  </>
                ) : (
                  <>
                    <Loader2 size={16} className="hidden" /> Add to Cart (Ready to Checkout)
                  </>
                )}
              </button>
              <Link
                href={designIdParam ? `/designer/${templateId}?design=${designIdParam}` : `/designer/${templateId}`}
                className="px-6 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Back to Editor
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
