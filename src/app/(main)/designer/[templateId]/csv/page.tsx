'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ProductTemplate, TemplateParameter } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedCSV {
  headers: string[]
  rows: string[][]
  rowCount: number
}

interface ValidationError {
  row: number
  column: string
  message: string
}

type Stage = 'upload' | 'map' | 'validate' | 'sample_proof' | 'processing' | 'done'

const MAX_ROWS_CLIENT = 5000
const POLL_INTERVAL_MS = 2500

// ─── Component ────────────────────────────────────────────────────────────────

export default function CSVUploadPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const { user } = useAuth()
  const [template, setTemplate] = useState<ProductTemplate | null>(null)
  const [parameters, setParameters] = useState<TemplateParameter[]>([])

  // Upload
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedCSV | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Mapping
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [duplicateCheckColumn, setDuplicateCheckColumn] = useState('')

  // Validation
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [showAllErrors, setShowAllErrors] = useState(false)

  // Processing
  const [stage, setStage] = useState<Stage>('upload')
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [jobErrors, setJobErrors] = useState<{ row: number; error: string }[]>([])
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sample proof
  const [sampleUrls, setSampleUrls] = useState<string[]>([])
  const [generatingSample, setGeneratingSample] = useState(false)

  // Load template + parameters
  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('product_templates').select('*').eq('id', templateId).single(),
      supabase.from('template_parameters').select('*').eq('product_template_id', templateId).order('display_order'),
    ]).then(([tmplRes, paramsRes]) => {
      setTemplate(tmplRes.data as ProductTemplate | null)
      setParameters((paramsRes.data as TemplateParameter[]) || [])
    })
  }, [templateId])

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // ── File handling ─────────────────────────────────────────────────────────

  const parseCSV = useCallback(async (csvFile: File) => {
    if (!csvFile.name.endsWith('.csv')) {
      toast.error('Only .csv files are accepted')
      return
    }
    const text = await csvFile.text()
    const Papa = (await import('papaparse')).default
    const result = Papa.parse(text, { header: false, skipEmptyLines: true })

    if (result.data.length < 2) {
      toast.error('CSV must have at least one header row and one data row')
      return
    }

    const headers = (result.data[0] as string[]).map((h) => h.trim())
    const rows = (result.data.slice(1) as string[][]).map((row) =>
      row.map((cell) => (typeof cell === 'string' ? cell.trim() : String(cell)))
    )

    if (rows.length > MAX_ROWS_CLIENT) {
      toast.error(`CSV has ${rows.length.toLocaleString()} rows. Maximum is ${MAX_ROWS_CLIENT.toLocaleString()}. Split your file and upload in batches.`)
      return
    }

    setParsed({ headers, rows, rowCount: rows.length })
    setValidationErrors([])
    setShowAllErrors(false)

    // Auto-map: match header names to param keys / labels (case-insensitive)
    setParameters((params) => {
      const autoMap: Record<string, string> = {}
      params.forEach((param) => {
        const match = headers.find(
          (h) =>
            h.toLowerCase() === param.param_key.toLowerCase() ||
            h.toLowerCase() === param.param_label.toLowerCase()
        )
        if (match) autoMap[param.param_key] = match
      })
      setColumnMapping(autoMap)
      return params
    })

    setDuplicateCheckColumn(headers[0] ?? '')
    setStage('map')
  }, [])

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) { setFile(dropped); parseCSV(dropped) }
  }, [parseCSV])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) { setFile(selected); parseCSV(selected) }
  }

  const resetUpload = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    setFile(null); setParsed(null); setColumnMapping({})
    setValidationErrors([]); setJobErrors([]); setJobId(null)
    setProgress(0); setGeneratedCount(0); setErrorCount(0)
    setSampleUrls([]); setGeneratingSample(false)
    setStage('upload')
  }

  // ── Shared: upload CSV job to server ─────────────────────────────────────
  const uploadCSVJob = async (): Promise<string | null> => {
    if (!parsed || !file) return null
    const uploadRes = await fetch('/api/csv/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        filename: file.name,
        parsed_data: parsed.rows.map((row) => {
          const obj: Record<string, string> = {}
          parsed.headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
          return obj
        }),
        column_mapping: columnMapping,
        row_count: parsed.rowCount,
      }),
    })
    if (!uploadRes.ok) {
      const body = await uploadRes.json()
      if (uploadRes.status === 422 && body.validation_errors) {
        setValidationErrors(body.validation_errors)
        setStage('validate')
        toast.error(`Server validation: ${body.validation_errors.length} error(s)`)
        return null
      }
      throw new Error(body.error ?? 'Upload failed')
    }
    const job = await uploadRes.json()
    setJobId(job.id)
    return job.id as string
  }

  // ── Shared: start generation polling ─────────────────────────────────────
  const startGenerationPolling = async (id: string) => {
    setStage('processing')
    setProgress(0); setGeneratedCount(0); setJobErrors([])

    const genRes = await fetch(`/api/csv/${id}/generate`, { method: 'POST' })
    if (!genRes.ok && genRes.status !== 202) throw new Error('Generation failed to start')

    pollRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/csv/${id}/status`)
        const status = await statusRes.json()
        const pct = status.progress ?? 0
        setProgress(pct)
        const derived = status.generated_count ?? Math.round((pct / 100) * (status.row_count ?? parsed?.rowCount ?? 0))
        setGeneratedCount(derived)
        if (status.status === 'completed' || status.status === 'error') {
          clearInterval(pollRef.current!)
          setJobErrors(status.error_log ?? [])
          setErrorCount(status.error_log?.length ?? 0)
          setStage('done')
          if (status.status === 'completed') {
            toast.success(`Generated ${status.row_count ?? parsed?.rowCount} production files!`)
          } else {
            toast.error('Some files failed. See the error log below.')
          }
        }
      } catch { /* transient polling error */ }
    }, POLL_INTERVAL_MS)
  }

  // ── Sample proof: upload job → generate first 5 proofs ───────────────────
  const handleSampleProof = async () => {
    if (!parsed || !file) return
    const errors = runValidation()
    setValidationErrors(errors)
    if (errors.length > 0) { setStage('validate'); return }

    setGeneratingSample(true)
    try {
      const id = await uploadCSVJob()
      if (!id) return
      const res = await fetch(`/api/csv/${id}/sample-proof`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Sample generation failed') }
      const data = await res.json()
      setSampleUrls(data.proof_urls ?? [])
      setStage('sample_proof')
      toast.success(`Sample proof generated for ${data.sample_count} entries!`)
    } catch (err) {
      toast.error(String(err) || 'Failed to generate sample proof')
      setStage('validate')
    }
    setGeneratingSample(false)
  }

  // ── Approve sample → generate all ────────────────────────────────────────
  const handleApproveAndGenerateAll = async () => {
    if (!jobId || !parsed) return
    try {
      await startGenerationPolling(jobId)
    } catch (err) {
      toast.error(String(err) || 'Failed to start generation')
      setStage('sample_proof')
    }
  }

  // ── Client-side validation ────────────────────────────────────────────────

  const runValidation = useCallback((): ValidationError[] => {
    if (!parsed) return []
    const errors: ValidationError[] = []

    // Required fields + type format checks
    parameters.forEach((param) => {
      const mappedCol = columnMapping[param.param_key]
      if (!mappedCol) return
      const colIdx = parsed.headers.indexOf(mappedCol)
      if (colIdx < 0) return

      parsed.rows.forEach((row, i) => {
        const val = (row[colIdx] ?? '').trim()
        if (param.is_required && val === '') {
          errors.push({ row: i + 2, column: param.param_label, message: 'Required field is empty' })
          return
        }
        if (val === '') return
        if ((param.param_type === 'number' || param.param_type === 'range') && isNaN(Number(val))) {
          errors.push({ row: i + 2, column: param.param_label, message: `Expected a number, got "${val}"` })
        }
        if (param.param_type === 'text' && val.length > 500) {
          errors.push({ row: i + 2, column: param.param_label, message: `Text too long (${val.length} chars, max 500)` })
        }
      })
    })

    // Duplicate detection
    if (duplicateCheckColumn) {
      const colIdx = parsed.headers.indexOf(duplicateCheckColumn)
      if (colIdx >= 0) {
        const seen = new Map<string, number>()
        parsed.rows.forEach((row, i) => {
          const val = (row[colIdx] ?? '').toLowerCase()
          if (!val) return
          if (seen.has(val)) {
            errors.push({ row: i + 2, column: duplicateCheckColumn, message: `Duplicate of row ${seen.get(val)! + 2}` })
          } else {
            seen.set(val, i)
          }
        })
      }
    }

    return errors
  }, [parsed, parameters, columnMapping, duplicateCheckColumn])

  const handleValidate = () => {
    const errors = runValidation()
    setValidationErrors(errors)
    setStage('validate')
    if (errors.length === 0) toast.success('All rows passed validation!')
    else toast.error(`Found ${errors.length} validation error(s). Fix them before generating.`)
  }

  // ── Submit: direct generate (skip sample proof) ──────────────────────────
  const handleSubmit = async () => {
    if (!parsed || !file) return
    const errors = runValidation()
    setValidationErrors(errors)
    if (errors.length > 0) {
      toast.error('Fix validation errors before generating')
      setStage('validate')
      return
    }
    try {
      const id = await uploadCSVJob()
      if (!id) return
      await startGenerationPolling(id)
    } catch (err) {
      toast.error(String(err) || 'Failed to process CSV')
      setStage('validate')
    }
  }

  // ── Download error log CSV ────────────────────────────────────────────────

  const downloadErrorCSV = () => {
    const lines = ['Row,Error', ...jobErrors.map((e) => `${e.row},"${e.error.replace(/"/g, '""')}"`)]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `errors-${jobId?.slice(0, 8) ?? 'job'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Step indicator ────────────────────────────────────────────────────────

  const steps: { key: Stage; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'map', label: 'Map Columns' },
    { key: 'validate', label: 'Validate' },
    { key: 'sample_proof', label: 'Sample Proof' },
    { key: 'processing', label: 'Generate' },
    { key: 'done', label: 'Done' },
  ]
  const stageIndex = steps.findIndex((s) => s.key === stage)

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back */}
      <Link
        href={`/designer/${templateId}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-brand-text-muted hover:text-brand-primary-darky"
      >
        ← Back to Designer
      </Link>

      <h1 className="mb-1 text-2xl font-bold text-brand-text">CSV Variable Data Upload</h1>
      <p className="mb-8 text-sm text-brand-text-muted">
        Batch-generate production files for{' '}
        <span className="font-medium text-brand-text">{template?.name ?? '…'}</span>
        {' '}— up to {MAX_ROWS_CLIENT.toLocaleString()} rows per upload.
      </p>

      {/* Step progress bar */}
      <div className="mb-8 flex items-center">
        {steps.map((s, idx) => {
          const done = idx < stageIndex
          const active = idx === stageIndex
          return (
            <div key={s.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors
                  ${done ? 'bg-green-500 text-white' : active ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {done ? '✓' : idx + 1}
                </div>
                <span className={`mt-1 whitespace-nowrap text-xs ${active ? 'font-semibold text-brand-primary' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`mb-4 h-0.5 flex-1 ${idx < stageIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* ─── Stage: Upload ─── */}
      {stage === 'upload' && (
        <div
          onDrop={handleFileDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => document.getElementById('csv-input')?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-16 transition
            ${isDragging ? 'border-brand-primary bg-red-50' : 'border-gray-200 bg-white hover:border-brand-primary'}`}
        >
          <div className="text-5xl">📄</div>
          <p className="mt-4 text-lg font-medium text-brand-text">Drag & drop your CSV file here</p>
          <p className="mt-1 text-sm text-brand-text-muted">or click to browse (.csv files only)</p>
          <p className="mt-3 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
            Max {MAX_ROWS_CLIENT.toLocaleString()} rows · Headers required in row 1
          </p>
          <input id="csv-input" type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
        </div>
      )}

      {/* ─── Stages: Map / Validate / Processing / Done ─── */}
      {stage !== 'upload' && parsed && (
        <div className="space-y-6">

          {/* File info bar */}
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <div>
              <p className="font-medium text-green-800">{file?.name}</p>
              <p className="text-sm text-green-600">
                {parsed.rowCount.toLocaleString()} rows · {parsed.headers.length} columns
                {parsed.rowCount >= MAX_ROWS_CLIENT * 0.9 && (
                  <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                    Near row limit
                  </span>
                )}
              </p>
            </div>
            {stage !== 'processing' && stage !== 'done' && (
              <button onClick={resetUpload} className="text-sm text-red-500 hover:underline">Remove</button>
            )}
          </div>

          {/* ── Column Mapping ── */}
          {(stage === 'map' || stage === 'validate') && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-1 text-lg font-semibold text-brand-text">Map CSV Columns to Template Fields</h2>
              <p className="mb-4 text-sm text-brand-text-muted">
                Select which CSV column maps to each template field. Fields marked <span className="text-red-500">*</span> are required.
              </p>

              {parameters.length === 0 ? (
                <p className="rounded bg-yellow-50 p-3 text-sm text-yellow-700">
                  No template parameters defined. All column headers will be available as <code>{`{{ColumnName}}`}</code> placeholders.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {parameters.map((param) => (
                    <div key={param.id}>
                      <label className="mb-1 block text-sm font-medium text-brand-text">
                        {param.param_label}
                        {param.is_required && <span className="ml-1 text-red-500">*</span>}
                        <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 capitalize">
                          {param.param_type}
                        </span>
                      </label>
                      <select
                        value={columnMapping[param.param_key] ?? ''}
                        onChange={(e) => setColumnMapping((prev) => ({ ...prev, [param.param_key]: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
                      >
                        <option value="">— Select CSV Column —</option>
                        {parsed.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Duplicate check selector */}
              <div className="mt-5 border-t border-gray-100 pt-4">
                <label className="mb-1 block text-sm font-medium text-brand-text">
                  Duplicate detection column
                </label>
                <select
                  value={duplicateCheckColumn}
                  onChange={(e) => setDuplicateCheckColumn(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none sm:w-64"
                >
                  <option value="">— None —</option>
                  {parsed.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                <p className="mt-1 text-xs text-brand-text-muted">
                  Rows with the same value in this column will be flagged as duplicates (e.g. race number).
                </p>
              </div>
            </div>
          )}

          {/* ── Data Preview Table ── */}
          {(stage === 'map' || stage === 'validate') && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-2.5 text-sm font-medium text-brand-text">
                Data Preview <span className="ml-1 font-normal text-brand-text-muted">(first 10 rows)</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-brand-text-muted">#</th>
                    {parsed.headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-brand-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {parsed.rows.slice(0, 10).map((row, i) => {
                    const hasErr = validationErrors.some((e) => e.row === i + 2)
                    return (
                      <tr key={i} className={hasErr ? 'bg-red-50' : ''}>
                        <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
                        {row.map((cell, j) => (
                          <td key={j} className="max-w-[180px] truncate px-3 py-2">
                            {cell || <span className="italic text-gray-300">empty</span>}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {parsed.rowCount > 10 && (
                <p className="border-t bg-gray-50 px-4 py-2 text-center text-xs text-brand-text-muted">
                  Showing 10 of {parsed.rowCount.toLocaleString()} rows
                </p>
              )}
            </div>
          )}

          {/* ── Validation Errors ── */}
          {stage === 'validate' && validationErrors.length > 0 && (
            <div className="rounded-lg border border-brand-primary-darky bg-brand-primary-light p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-brand-primary-darky">
                  {validationErrors.length} Validation Error{validationErrors.length !== 1 ? 's' : ''}
                </h3>
                <button onClick={() => setShowAllErrors((v) => !v)} className="text-xs text-brand-primary-darky underline">
                  {showAllErrors ? 'Show fewer' : `Show all ${validationErrors.length}`}
                </button>
              </div>
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {(showAllErrors ? validationErrors : validationErrors.slice(0, 5)).map((err, i) => (
                  <li key={i} className="flex flex-wrap gap-2 text-sm text-brand-primary-darky">
                    <span className="shrink-0 rounded bg-brand-primary-light px-1.5 py-0.5 font-mono text-xs">Row {err.row}</span>
                    <span className="font-medium">{err.column}:</span>
                    <span>{err.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Validation OK ── */}
          {stage === 'validate' && validationErrors.length === 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-800">All {parsed.rowCount.toLocaleString()} rows passed validation</p>
                <p className="text-sm text-green-600">Ready to generate production files.</p>
              </div>
            </div>
          )}

          {/* ── Processing progress ── */}
          {stage === 'processing' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-brand-text">Generating production files…</p>
                <span className="text-sm font-medium text-brand-primary-darky">{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-brand-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-brand-text-muted">
                {generatedCount.toLocaleString()} of {parsed.rowCount.toLocaleString()} files generated
                <span className="ml-2 text-xs text-gray-400">· Processing runs in the background</span>
              </p>
            </div>
          )}

          {/* ── Done ── */}
          {stage === 'done' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className={`rounded-lg border p-6 ${errorCount === parsed.rowCount ? 'border-brand-primary-darky bg-brand-primary-light' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{errorCount === parsed.rowCount ? '❌' : generatedCount > 0 ? '🎉' : '⚠️'}</span>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-brand-text">
                      {errorCount === parsed.rowCount
                        ? 'Generation Failed'
                        : errorCount > 0
                        ? 'Completed with Some Errors'
                        : 'Generation Complete!'}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-6 text-sm">
                      <div>
                        <span className="font-bold text-green-700">{generatedCount.toLocaleString()}</span>
                        <span className="text-green-600"> files generated</span>
                      </div>
                      {errorCount > 0 && (
                        <div>
                          <span className="font-bold text-brand-primary-darky">{errorCount.toLocaleString()}</span>
                          <span className="text-brand-primary-darky"> failed</span>
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-gray-700">{parsed.rowCount.toLocaleString()}</span>
                        <span className="text-gray-500"> total rows</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download ZIP */}
              {generatedCount > 0 && jobId && (
                <a
                  href={`/api/csv/${jobId}/download`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-3 text-center font-semibold text-white transition hover:bg-brand-primary-darky/90"
                >
                  ⬇ Download All {generatedCount.toLocaleString()} Production Files (ZIP)
                </a>
              )}

              {/* Error log */}
              {jobErrors.length > 0 && (
                <div className="rounded-lg border border-brand-primary-darky bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-brand-primary-darky">
                      {jobErrors.length} Row{jobErrors.length !== 1 ? 's' : ''} Failed to Generate
                    </h3>
                    <button onClick={downloadErrorCSV} className="text-sm text-brand-primary-darky underline hover:opacity-80">
                      Download error log (.csv)
                    </button>
                  </div>
                  <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-brand-primary-darky">
                    {jobErrors.slice(0, 20).map((e, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="shrink-0 rounded bg-brand-primary-light px-1.5 py-0.5 font-mono text-xs">Row {e.row}</span>
                        <span>{e.error}</span>
                      </li>
                    ))}
                    {jobErrors.length > 20 && (
                      <li className="text-gray-400 italic">… and {jobErrors.length - 20} more — download the full log above.</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Start over */}
              <button
                onClick={resetUpload}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-brand-text-muted transition hover:border-brand-primary hover:text-brand-primary-darky"
              >
                Upload Another CSV
              </button>
            </div>
          )}

          {/* ── Action Buttons ── */}
          {stage === 'map' && (
            <button
              onClick={handleValidate}
              className="w-full rounded-lg bg-brand-primary py-3 text-lg font-semibold text-white transition hover:bg-brand-primary-darky/90"
            >
              Validate {parsed.rowCount.toLocaleString()} Rows →
            </button>
          )}

          {stage === 'validate' && (
            validationErrors.length > 0 ? (
              <button
                disabled
                className="w-full cursor-not-allowed rounded-lg bg-brand-primary/50 py-3 text-lg font-semibold text-white"
              >
                Fix {validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''} First
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-sm font-medium text-brand-text-muted">Choose how to proceed:</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Option A: Sample Proof */}
                  <button
                    onClick={handleSampleProof}
                    disabled={generatingSample}
                    className="flex flex-col items-center gap-2 rounded-xl border-2 border-brand-primary bg-red-50 py-4 px-4 text-center transition hover:bg-red-100 disabled:opacity-60"
                  >
                    {generatingSample ? (
                      <span className="text-2xl">⏳</span>
                    ) : (
                      <span className="text-2xl">🔍</span>
                    )}
                    <span className="font-semibold text-brand-primary-darky">
                      {generatingSample ? 'Generating Sample…' : 'Preview Sample Proof'}
                    </span>
                    <span className="text-xs text-brand-text-muted">
                      Review first 5 entries before generating all {parsed.rowCount.toLocaleString()} files
                    </span>
                  </button>
                  {/* Option B: Direct generate */}
                  <button
                    onClick={handleSubmit}
                    disabled={generatingSample}
                    className="flex flex-col items-center gap-2 rounded-xl border-2 border-gray-300 bg-white py-4 px-4 text-center transition hover:border-brand-primary hover:bg-gray-50 disabled:opacity-60"
                  >
                    <span className="text-2xl">⚡</span>
                    <span className="font-semibold text-brand-text">Generate All Files</span>
                    <span className="text-xs text-brand-text-muted">
                      Skip preview and generate all {parsed.rowCount.toLocaleString()} production files now
                    </span>
                  </button>
                </div>
              </div>
            )
          )}

          {/* ── Sample Proof Stage ── */}
          {stage === 'sample_proof' && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <span className="text-2xl">🔍</span>
                <div>
                  <h2 className="font-semibold text-blue-800">Sample Proof Preview</h2>
                  <p className="mt-0.5 text-sm text-blue-600">
                    Showing first {sampleUrls.length} entr{sampleUrls.length !== 1 ? 'ies' : 'y'} of {parsed?.rowCount.toLocaleString()} total.
                    Review carefully — check text, layout, and variable data.
                  </p>
                </div>
              </div>

              {/* PDF grid */}
              <div className={`grid gap-4 ${sampleUrls.length === 1 ? 'grid-cols-1 max-w-sm' : sampleUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {sampleUrls.map((url, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b bg-gray-50 px-3 py-2">
                      <span className="text-sm font-semibold text-brand-text">Row {i + 1}</span>
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-brand-primary-darky hover:underline">
                        Open PDF ↗
                      </a>
                    </div>
                    <iframe
                      src={`${url}#toolbar=0&navpanes=0`}
                      className="h-52 w-full"
                      title={`Sample row ${i + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleApproveAndGenerateAll}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-base font-semibold text-white transition hover:bg-green-700"
                >
                  ✓ Approve Sample — Generate All {parsed?.rowCount.toLocaleString()} Files
                </button>
                <button
                  onClick={() => { setSampleUrls([]); setStage('validate') }}
                  className="rounded-xl border-2 border-gray-300 px-6 py-3.5 text-sm font-semibold text-brand-text-muted transition hover:border-brand-primary hover:text-brand-primary-darky"
                >
                  ← Revise Mapping
                </button>
              </div>
              <p className="text-center text-xs text-brand-text-muted">
                The watermarked &ldquo;PROOF&rdquo; versions above will NOT be sent to print.
                Full-resolution production files will be generated after approval.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
