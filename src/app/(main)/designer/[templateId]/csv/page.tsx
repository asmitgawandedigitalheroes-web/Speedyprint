'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ProductTemplate, TemplateParameter } from '@/types'

interface ParsedCSV {
  headers: string[]
  rows: string[][]
  rowCount: number
}

export default function CSVUploadPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const { user } = useAuth()
  const [template, setTemplate] = useState<ProductTemplate | null>(null)
  const [parameters, setParameters] = useState<TemplateParameter[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedCSV | null>(null)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<{ row: number; column: string; message: string }[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

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

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx'))) {
      setFile(droppedFile)
      parseCSV(droppedFile)
    } else {
      toast.error('Please upload a .csv file')
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseCSV(selectedFile)
    }
  }

  const parseCSV = async (csvFile: File) => {
    const text = await csvFile.text()
    const Papa = (await import('papaparse')).default
    const result = Papa.parse(text, { header: false, skipEmptyLines: true })

    if (result.data.length < 2) {
      toast.error('CSV must have at least a header row and one data row')
      return
    }

    const headers = (result.data[0] as string[]).map((h) => h.trim())
    const rows = (result.data.slice(1) as string[][]).map((row) =>
      row.map((cell) => (typeof cell === 'string' ? cell.trim() : String(cell)))
    )

    setParsed({ headers, rows, rowCount: rows.length })
    setErrors([])

    // Auto-map columns if names match parameters
    const autoMap: Record<string, string> = {}
    parameters.forEach((param) => {
      const match = headers.find(
        (h) => h.toLowerCase() === param.param_key.toLowerCase() || h.toLowerCase() === param.param_label.toLowerCase()
      )
      if (match) autoMap[param.param_key] = match
    })
    setColumnMapping(autoMap)
  }

  const validate = () => {
    if (!parsed) return false
    const newErrors: typeof errors = []

    parsed.rows.forEach((row, rowIdx) => {
      parameters.forEach((param) => {
        if (param.is_required && columnMapping[param.param_key]) {
          const colIdx = parsed.headers.indexOf(columnMapping[param.param_key])
          if (colIdx >= 0 && (!row[colIdx] || row[colIdx].trim() === '')) {
            newErrors.push({ row: rowIdx + 2, column: param.param_label, message: 'Required field is empty' })
          }
        }
      })
    })

    // Check for duplicate values in first mapped column
    const firstMappedCol = Object.values(columnMapping)[0]
    if (firstMappedCol) {
      const colIdx = parsed.headers.indexOf(firstMappedCol)
      if (colIdx >= 0) {
        const seen = new Map<string, number>()
        parsed.rows.forEach((row, rowIdx) => {
          const val = row[colIdx]?.toLowerCase()
          if (val && seen.has(val)) {
            newErrors.push({ row: rowIdx + 2, column: firstMappedCol, message: `Duplicate of row ${seen.get(val)! + 2}` })
          }
          if (val) seen.set(val, rowIdx)
        })
      }
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fix validation errors before submitting')
      return
    }

    setProcessing(true)
    setProgress(0)

    try {
      // Upload CSV file
      const res = await fetch('/api/csv/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          filename: file?.name,
          parsed_data: parsed?.rows.map((row) => {
            const obj: Record<string, string> = {}
            parsed!.headers.forEach((h, i) => { obj[h] = row[i] || '' })
            return obj
          }),
          column_mapping: columnMapping,
          row_count: parsed?.rowCount,
        }),
      })

      if (!res.ok) throw new Error('Upload failed')
      const job = await res.json()

      // Trigger generation
      const genRes = await fetch(`/api/csv/${job.id}/generate`, { method: 'POST' })
      if (!genRes.ok) throw new Error('Generation failed')

      // Poll progress
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch(`/api/csv/${job.id}/status`)
        const status = await statusRes.json()
        setProgress(status.progress || 0)

        if (status.status === 'completed' || status.status === 'error') {
          clearInterval(pollInterval)
          setProcessing(false)
          if (status.status === 'completed') {
            toast.success(`Generated ${parsed?.rowCount} production files!`)
          } else {
            toast.error('Some files failed to generate. Check the error log.')
          }
        }
      }, 2000)
    } catch {
      toast.error('Failed to process CSV')
      setProcessing(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href={`/designer/${templateId}`} className="mb-4 inline-block text-sm text-brand-gray-medium hover:text-brand-red">
        &larr; Back to Designer
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-brand-black">CSV Variable Data Upload</h1>
      <p className="mb-8 text-brand-gray-medium">
        Upload a CSV file with variable data to batch-generate production files for {template?.name || 'this template'}.
      </p>

      {/* Upload Zone */}
      {!parsed && (
        <div
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-gray-light bg-white p-16 transition hover:border-brand-red"
          onClick={() => document.getElementById('csv-input')?.click()}
        >
          <div className="text-5xl">📄</div>
          <p className="mt-4 text-lg font-medium text-brand-black">Drag & drop your CSV file here</p>
          <p className="mt-1 text-sm text-brand-gray-medium">or click to browse (.csv files accepted)</p>
          <input id="csv-input" type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
        </div>
      )}

      {/* Preview & Mapping */}
      {parsed && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
            <div>
              <p className="font-medium text-green-800">{file?.name}</p>
              <p className="text-sm text-green-600">{parsed.rowCount} rows, {parsed.headers.length} columns</p>
            </div>
            <button
              onClick={() => { setParsed(null); setFile(null); setErrors([]) }}
              className="text-sm text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>

          {/* Column Mapping */}
          <div className="rounded-lg border border-brand-gray-light bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-brand-black">Map Columns to Template Fields</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {parameters.map((param) => (
                <div key={param.id}>
                  <label className="mb-1 block text-sm font-medium">
                    {param.param_label} {param.is_required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={columnMapping[param.param_key] || ''}
                    onChange={(e) => setColumnMapping((prev) => ({ ...prev, [param.param_key]: e.target.value }))}
                    className="w-full rounded-lg border border-brand-gray-light px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                  >
                    <option value="">-- Select CSV Column --</option>
                    {parsed.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Data Preview */}
          <div className="overflow-x-auto rounded-lg border border-brand-gray-light bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-brand-gray-medium">#</th>
                  {parsed.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-brand-gray-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsed.rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className={errors.some((e) => e.row === i + 2) ? 'bg-red-50' : ''}>
                    <td className="px-3 py-2 text-xs text-brand-gray-medium">{i + 1}</td>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.rowCount > 10 && (
              <p className="border-t bg-gray-50 p-2 text-center text-xs text-brand-gray-medium">
                Showing 10 of {parsed.rowCount} rows
              </p>
            )}
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="mb-2 font-medium text-red-800">Validation Errors ({errors.length})</h3>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-red-600">
                {errors.map((err, i) => (
                  <li key={i}>Row {err.row}, {err.column}: {err.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Progress */}
          {processing && (
            <div className="rounded-lg border border-brand-gray-light bg-white p-6">
              <p className="mb-2 text-sm font-medium">Generating production files...</p>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-brand-red transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-brand-gray-medium">{progress}% complete</p>
            </div>
          )}

          {/* Submit */}
          {!processing && (
            <button
              onClick={handleSubmit}
              className="w-full rounded-lg bg-brand-red py-3 text-lg font-semibold text-white transition hover:bg-brand-red-light"
            >
              Validate & Generate {parsed.rowCount} Production Files
            </button>
          )}
        </div>
      )}
    </div>
  )
}
