'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle2, AlertCircle, Play, ArrowRight } from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Papa from 'papaparse'

export default function BulkCreatePanel() {
  const { bulkData, setBulkData, canvas, template, designId, saveStatus } = useEditorStore()
  const [isParsing, setIsParsing] = useState(false)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      },
      error: (err) => {
        setError(err.message)
        setIsParsing(false)
      }
    })
  }

  const applyRowToCanvas = (row: Record<string, string>) => {
    if (!canvas) return

    canvas.getObjects().forEach((obj) => {
      // Check if it's a text-type object
      if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
        const textObj = obj as any
        
        // If this is the first time we're applying data, save the original text as a template
        if (textObj.rawText === undefined) {
          textObj.rawText = textObj.text || ''
        }

        let template = textObj.rawText
        if (!template || !template.includes('{{')) return

        // Replace {{header}} with row[header]
        let newText = template
        Object.keys(row).forEach((header) => {
          const placeholder = `{{${header}}}`
          if (newText.includes(placeholder)) {
            newText = newText.replaceAll(placeholder, row[header])
          }
        })

        if (newText !== textObj.text) {
          textObj.set({ text: newText })
        }
      }
    })
    canvas.renderAll()
  }

  return (
    <div className="flex flex-col h-full bg-ed-surface">
      <div className="p-4 border-b border-ed-border">
        <h2 className="text-sm font-semibold text-ed-text">Bulk Create</h2>
        <p className="text-xs text-ed-text-dim mt-1">
          Upload a CSV to generate multiple designs.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              <p className="text-xs text-ed-text-dim mt-1">Click to browse</p>
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
                  {bulkData.rows.length} rows loaded with {bulkData.headers.length} columns.
                </p>
                <button 
                  onClick={() => setBulkData(null)}
                  className="text-[10px] text-ed-accent font-medium mt-1 hover:underline"
                >
                  Change file
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider font-bold text-ed-text-dim">Available Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {bulkData.headers.map(header => (
                  <code key={header} className="text-[10px] bg-ed-surface-hover px-1.5 py-0.5 rounded border border-ed-border text-ed-text">
                    {`{{${header}}}`}
                  </code>
                ))}
              </div>
              <p className="text-[10px] text-ed-text-dim leading-relaxed">
                Add these tags to any text element on your canvas to map data.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider font-bold text-ed-text-dim">Preview Rows</p>
              <div className="border border-ed-border rounded-lg divide-y divide-ed-border overflow-hidden">
                {bulkData.rows.slice(0, 5).map((row, i) => (
                  <button
                    key={i}
                    onClick={() => applyRowToCanvas(row)}
                    className="w-full text-left p-2 hover:bg-ed-surface-hover transition-colors flex items-center justify-between group"
                  >
                    <div className="truncate pr-4">
                      <p className="text-[11px] font-medium text-ed-text truncate">
                        Row {i + 1}: {Object.values(row)[0]}
                      </p>
                    </div>
                    <Play size={10} className="text-ed-text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
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
                      description: 'We need a saved design ID to link with your CSV data.'
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
                This will take you to the CSV processing page to generate all {bulkData.rows.length} files.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle size={16} className="text-red-500 mt-0.5" />
            <p className="text-[10px] text-red-500 leading-normal">{error}</p>
          </div>
        )}

        <div className="mt-6 p-3 bg-ed-surface-hover rounded-lg border border-ed-border">
          <p className="text-[11px] font-medium text-ed-text mb-2">How it works:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-[10px] text-ed-text-dim">
            <li>Create a text element on the canvas.</li>
            <li>In the text, use placeholders like <code className="bg-ed-surface px-1 rounded">{"{{column_name}}"}</code>.</li>
            <li>Upload your CSV file here.</li>
            <li>Click a row above to preview that entry.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
