'use client'

/**
 * Toolbar — Tabbed left panel for the designer editor.
 * Tabs: Text | Images | Shapes | QR/Barcode | Filters | Layers
 *
 * Image upload features:
 *  - File size validation (50 MB max)
 *  - Upload progress bar
 *  - Retry on failure (up to 3 attempts)
 *  - Drag-and-drop images onto the upload zone
 *  - PDF support (client-side first-page render via pdfjs-dist, server fallback)
 *  - Large files (> 2 MB) uploaded to Supabase Storage for CDN URLs
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/lib/designer/store'
import { LayersPanel } from './LayersPanel'
import { TextPanel } from './panels/TextPanel'
import { ShapesPanel } from './panels/ShapesPanel'
import { QRCodePanel } from './panels/QRCodePanel'
import { BarcodePanel } from './panels/BarcodePanel'
import { ImageFiltersPanel } from './panels/ImageFiltersPanel'
import { TemplatesPanel } from './panels/TemplatesPanel'
import { MaterialsPanel } from './panels/MaterialsPanel'
import { AIPanel } from './panels/AIPanel'
import { validateImageFile, smartUpload, ACCEPTED_IMAGE_EXTENSIONS } from '@/lib/upload'
import type { DesignerCanvasRef } from '@/hooks/useDesigner'
import {
  Type,
  ImagePlus,
  Shapes,
  QrCode,
  Layers,
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Palette,
  Layout,
  Sparkles,
} from 'lucide-react'

// --- Tab definitions ---

type TabId = 'material' | 'template' | 'text' | 'add' | 'my' | 'ai'

interface TabDef {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: TabDef[] = [
  { id: 'material', label: 'Material', icon: Palette },
  { id: 'template', label: 'Template', icon: Layout },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'add', label: 'Add', icon: Shapes },
  { id: 'my', label: 'My', icon: ImagePlus },
  { id: 'ai', label: 'AI Creation', icon: Sparkles },
]

// --- Upload state ---

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadState {
  status: UploadStatus
  progress: number      // 0–100
  error: string | null
  fileName: string | null
}

const INITIAL_UPLOAD_STATE: UploadState = {
  status: 'idle',
  progress: 0,
  error: null,
  fileName: null,
}

// --- Props ---

interface ToolbarProps {
  canvasRef: React.RefObject<DesignerCanvasRef | null>
  onToggleLayers?: () => void
  showLayers?: boolean
  className?: string
}

// --- Component ---

export function Toolbar({ canvasRef, className }: ToolbarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('material')
  const [uploadState, setUploadState] = useState<UploadState>(INITIAL_UPLOAD_STATE)
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const retryFileRef = useRef<File | null>(null)

  const editor = useEditorStore((s) => s.editor)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedObject = useEditorStore((s) => s.activeObjects?.[0] as any)

  // Clear success state after 3 seconds
  useEffect(() => {
    if (uploadState.status === 'success') {
      const t = setTimeout(
        () => setUploadState(INITIAL_UPLOAD_STATE),
        3000
      )
      return () => clearTimeout(t)
    }
  }, [uploadState.status])

  // --- Core upload handler ---

  const processFile = useCallback(
    async (file: File) => {
      // 1. Validate
      const validationError = validateImageFile(file)
      if (validationError) {
        setUploadState({
          status: 'error',
          progress: 0,
          error: validationError,
          fileName: file.name,
        })
        return
      }

      // Store for retry
      retryFileRef.current = file

      setUploadState({
        status: 'uploading',
        progress: 0,
        error: null,
        fileName: file.name,
      })

      try {
        // PDF: route to ImportPlugin for first-page render
        const isPdf =
          file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

        if (isPdf) {
          if (!editor) throw new Error('Editor not ready')
          const plugin = editor.getPlugin<{ importFile: (f: File) => Promise<void> }>(
            'ImportPlugin'
          )
          if (!plugin) throw new Error('ImportPlugin not available')
          setUploadState((s) => ({ ...s, progress: 30 }))
          await plugin.importFile(file)
          setUploadState((s) => ({ ...s, progress: 100 }))
        } else {
          // Image: smart upload (local data URL for small, server for large)
          const url = await smartUpload(file, {
            onProgress: (pct) =>
              setUploadState((s) => ({ ...s, progress: pct })),
          })
          await canvasRef.current?.addImage(url)
        }

        setUploadState({
          status: 'success',
          progress: 100,
          error: null,
          fileName: file.name,
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Upload failed. Please try again.'
        setUploadState({
          status: 'error',
          progress: 0,
          error: message,
          fileName: file.name,
        })
      }
    },
    [canvasRef, editor]
  )

  // --- Retry last failed upload ---

  const handleRetry = useCallback(() => {
    if (retryFileRef.current) {
      processFile(retryFileRef.current)
    }
  }, [processFile])

  // --- File input change ---

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      processFile(file)
      e.target.value = ''
    },
    [processFile]
  )

  // --- Drag-and-drop handlers ---

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  // --- File import (SVG / JSON) ---

  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !editor) return

      const plugin = editor.getPlugin<{
        importFile: (file: File) => Promise<void>
      }>('ImportPlugin')
      if (plugin) plugin.importFile(file)
      e.target.value = ''
    },
    [editor]
  )

  // --- Dismiss error ---

  const dismissError = useCallback(
    () => setUploadState(INITIAL_UPLOAD_STATE),
    []
  )

  return (
    <div className={cn('flex h-full shrink-0', className)}>
      {/* Icon sidebar */}
      <div className="flex w-12 flex-col items-center border-r bg-gray-50 py-2 gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex h-10 w-10 flex-col items-center justify-center rounded-lg text-[9px] transition-colors',
                isActive
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              )}
              title={tab.label}
              aria-label={tab.label}
            >
              <Icon className="h-4 w-4" />
              <span className="mt-0.5 leading-tight">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Panel content */}
      <div className="w-[228px] overflow-y-auto border-r bg-background p-3">
        {/* Material tab */}
        {activeTab === 'material' && <MaterialsPanel />}

        {/* Template tab */}
        {activeTab === 'template' && <TemplatesPanel />}

        {/* Text tab */}
        {activeTab === 'text' && <TextPanel />}

        {/* Add tab - Images, Shapes, QR, etc. */}
        {activeTab === 'add' && <ShapesPanel />}

        {/* My tab - User uploads */}
        {activeTab === 'my' && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-700">My Uploads</div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_EXTENSIONS.join(',')}
              className="hidden"
              onChange={handleImageUpload}
            />
            <input
              ref={importInputRef}
              type="file"
              accept=".svg,.json,image/svg+xml,application/json"
              className="hidden"
              onChange={handleFileImport}
            />

            {/* Drag-and-drop / click upload zone */}
            <div
              onClick={() =>
                uploadState.status === 'uploading'
                  ? undefined
                  : fileInputRef.current?.click()
              }
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={cn(
                'flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-sm transition-colors',
                uploadState.status === 'uploading' && 'cursor-default',
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : uploadState.status === 'error'
                  ? 'border-red-300 bg-red-50 text-red-600'
                  : uploadState.status === 'success'
                  ? 'border-green-400 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-500 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600'
              )}
            >
              {/* Icon row */}
              {uploadState.status === 'success' ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : uploadState.status === 'error' ? (
                <AlertCircle className="h-6 w-6 text-red-500" />
              ) : (
                <Upload
                  className={cn(
                    'h-6 w-6',
                    isDragOver ? 'text-indigo-500' : 'text-gray-400'
                  )}
                />
              )}

              {/* Status text */}
              {uploadState.status === 'idle' && (
                <>
                  <div className="text-center">
                    <div className="font-medium">
                      {isDragOver ? 'Drop to upload' : 'Upload Image'}
                    </div>
                    <div className="mt-0.5 text-[10px] text-gray-400">
                      PNG, JPG, SVG, WebP, PDF — max 50 MB
                    </div>
                    <div className="mt-0.5 text-[10px] text-gray-400">
                      or drag &amp; drop here
                    </div>
                  </div>
                </>
              )}

              {uploadState.status === 'uploading' && (
                <div className="w-full space-y-1 text-center">
                  <div className="truncate text-xs font-medium text-indigo-600">
                    {uploadState.fileName}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-200"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-indigo-500">
                    {uploadState.progress < 100
                      ? `Uploading… ${uploadState.progress}%`
                      : 'Processing…'}
                  </div>
                </div>
              )}

              {uploadState.status === 'success' && (
                <div className="text-center">
                  <div className="text-xs font-medium text-green-700">
                    Added to canvas!
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-green-600">
                    {uploadState.fileName}
                  </div>
                </div>
              )}

              {uploadState.status === 'error' && (
                <div className="w-full space-y-1 text-center">
                  <div className="text-xs font-medium text-red-600">Upload failed</div>
                  <div className="text-[10px] text-red-500 leading-snug">
                    {uploadState.error}
                  </div>
                  <div className="flex justify-center gap-2 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRetry()
                      }}
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-red-600 hover:bg-red-100"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissError()
                      }}
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-gray-500 hover:bg-gray-100"
                    >
                      <X className="h-3 w-3" />
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Import SVG / JSON */}
            <button
              onClick={() => importInputRef.current?.click()}
              className="flex w-full items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FileJson className="h-4 w-4" />
              <span>Import SVG / JSON</span>
            </button>
          </div>
        )}

        {/* AI Creation tab */}
        {activeTab === 'ai' && <AIPanel />}
      </div>
    </div>
  )
}
