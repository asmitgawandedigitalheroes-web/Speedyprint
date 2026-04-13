'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle2, AlertTriangle, X, Download, FileText, Loader2 } from 'lucide-react'

type CsvRow = Record<string, string>

interface CsvUploadProps {
  /** Product type: drives which columns are required and which template to reference */
  productType: 'race-numbers' | 'mtb-boards'
}

const CONFIGS = {
  'race-numbers': {
    label: 'Race Numbers',
    requiredColumns: ['race_number', 'athlete_name'],
    allColumns: ['race_number', 'athlete_name', 'category', 'team', 'club'],
    templateName: 'race-numbers-template.csv',
    templateContent: 'race_number,athlete_name,category,team,club\n1,John Smith,Senior,Wolves AC,Wolves AC\n2,Jane Doe,Junior,Lions RC,Lions RC',
  },
  'mtb-boards': {
    label: 'MTB Boards',
    requiredColumns: ['board_number', 'athlete_name'],
    allColumns: ['board_number', 'athlete_name', 'category', 'club'],
    templateName: 'mtb-boards-template.csv',
    templateContent: 'board_number,athlete_name,category,club\n1,John Smith,Elite,Wolves MTB\n2,Jane Doe,Sport,Lions MTB',
  },
}

type ValidationResult = {
  valid: CsvRow[]
  errors: { row: number; message: string }[]
  missingColumns: string[]
}

/** Strip CSV formula-injection characters (=, +, -, @, TAB, CR) from cell values. */
function sanitizeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => sanitizeCell(v.trim()))
    const row: CsvRow = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

function validateRows(rows: CsvRow[], requiredCols: string[]): ValidationResult {
  if (rows.length === 0) return { valid: [], errors: [{ row: 0, message: 'No data rows found.' }], missingColumns: [] }

  const firstRow = rows[0]
  const presentCols = Object.keys(firstRow)
  const missingColumns = requiredCols.filter((c) => !presentCols.includes(c))

  if (missingColumns.length > 0) {
    return { valid: [], errors: [], missingColumns }
  }

  const valid: CsvRow[] = []
  const errors: { row: number; message: string }[] = []
  const seenNumbers = new Set<string>()
  const numberKey = requiredCols[0] // first required col is typically the unique number

  rows.forEach((row, i) => {
    const rowNum = i + 2 // +2 because row 1 is header
    const issues: string[] = []

    requiredCols.forEach((col) => {
      if (!row[col] || row[col].trim() === '') {
        issues.push(`Missing required field: ${col}`)
      }
    })

    const num = row[numberKey]?.trim()
    if (num && seenNumbers.has(num)) {
      issues.push(`Duplicate ${numberKey}: ${num}`)
    } else if (num) {
      seenNumbers.add(num)
    }

    if (issues.length > 0) {
      errors.push({ row: rowNum, message: issues.join(', ') })
    } else {
      valid.push(row)
    }
  })

  return { valid, errors, missingColumns: [] }
}

export function CsvUpload({ productType }: CsvUploadProps) {
  const config = CONFIGS[productType]
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<CsvRow[]>([])
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedJobId, setSavedJobId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setValidation({ valid: [], errors: [{ row: 0, message: 'Please upload a .csv file.' }], missingColumns: [] })
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCsv(text)
      setRows(parsed)
      setValidation(validateRows(parsed, config.requiredColumns))
    }
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleClear() {
    setFileName(null)
    setRows([])
    setValidation(null)
    setSavedJobId(null)
    setSaveError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave() {
    if (!validation || validation.valid.length === 0) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/csv-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_type: productType, rows: validation.valid }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save CSV data')
      setSavedJobId(json.id)
      localStorage.setItem(`csv_job_${productType}`, json.id)
    } catch (err: any) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function downloadTemplate() {
    const blob = new Blob([config.templateContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = config.templateName
    a.click()
    URL.revokeObjectURL(url)
  }

  const previewRows = (validation?.valid ?? []).slice(0, 5)
  const previewCols = config.allColumns

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-text">Variable data CSV upload</h3>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Upload a CSV with your athlete/rider data to generate unique {config.label}.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
        >
          <Download className="h-3.5 w-3.5" />
          Download template
        </button>
      </div>

      {/* Required columns */}
      <div className="rounded-md border border-gray-100 bg-brand-bg p-3">
        <p className="text-xs font-medium text-brand-text mb-1.5">Required CSV columns:</p>
        <div className="flex flex-wrap gap-1.5">
          {config.allColumns.map((col) => (
            <span
              key={col}
              className={`rounded px-2 py-0.5 font-mono text-[11px] ${config.requiredColumns.includes(col) ? 'bg-brand-primary/10 text-brand-primary font-semibold' : 'bg-gray-200 text-gray-600'}`}
            >
              {col}
              {config.requiredColumns.includes(col) && ' *'}
            </span>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-brand-text-muted">* Required columns</p>
      </div>

      {/* Drop zone */}
      {!fileName ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-gray-200 bg-brand-bg p-8 text-center transition hover:border-brand-primary hover:bg-brand-primary/5"
        >
          <Upload className="h-8 w-8 text-brand-primary/40" />
          <div>
            <p className="text-sm font-medium text-brand-text">Drop your CSV file here</p>
            <p className="mt-0.5 text-xs text-brand-text-muted">or click to browse — .csv files only</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleChange}
            className="sr-only"
          />
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-primary" />
            <span className="text-sm font-medium text-brand-text">{fileName}</span>
            <span className="text-xs text-brand-text-muted">— {rows.length} rows</span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Validation results */}
      {validation && (
        <div className="space-y-3">
          {/* Missing columns error */}
          {validation.missingColumns.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Missing required columns</p>
                  <p className="mt-0.5 text-xs text-red-600">
                    Your CSV is missing: <span className="font-mono">{validation.missingColumns.join(', ')}</span>
                  </p>
                  <p className="mt-1 text-xs text-red-600">Download the template above and ensure your columns match exactly.</p>
                </div>
              </div>
            </div>
          )}

          {/* Summary badge */}
          {validation.missingColumns.length === 0 && (
            <div className={`flex items-center gap-2 rounded-md border px-4 py-3 ${validation.errors.length === 0 ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
              {validation.errors.length === 0 ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              )}
              <p className={`text-sm font-medium ${validation.errors.length === 0 ? 'text-green-700' : 'text-amber-700'}`}>
                {validation.valid.length} valid {validation.valid.length === 1 ? 'entry' : 'entries'} found
                {validation.errors.length > 0 && ` — ${validation.errors.length} row${validation.errors.length > 1 ? 's' : ''} with errors (see below)`}
              </p>
            </div>
          )}

          {/* Save to order */}
          {validation.missingColumns.length === 0 && validation.valid.length > 0 && (
            <div className="space-y-2">
              {savedJobId ? (
                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">Data saved — ready for checkout</p>
                    <p className="text-xs text-green-600 font-mono">Job ID: {savedJobId}</p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-60"
                >
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  ) : (
                    <>Save {validation.valid.length} {validation.valid.length === 1 ? 'entry' : 'entries'} to order</>
                  )}
                </button>
              )}
              {saveError && (
                <p className="text-xs text-red-600"><AlertTriangle className="inline h-3 w-3 mr-1" />{saveError}</p>
              )}
            </div>
          )}

          {/* Row errors */}
          {validation.errors.length > 0 && validation.missingColumns.length === 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 space-y-1.5 max-h-40 overflow-y-auto">
              {validation.errors.map((err) => (
                <div key={err.row} className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                  <span className="text-red-700">
                    <span className="font-semibold">Row {err.row}:</span> {err.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Preview table */}
          {previewRows.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-brand-text-muted">Preview (first {Math.min(5, validation.valid.length)} rows)</p>
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <table className="w-full min-w-max text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {previewCols.map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-semibold text-brand-text">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        {previewCols.map((col) => (
                          <td key={col} className="px-3 py-2 text-brand-text-muted">{row[col] || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {validation.valid.length > 5 && (
                <p className="mt-1 text-xs text-brand-text-muted">…and {validation.valid.length - 5} more rows</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
