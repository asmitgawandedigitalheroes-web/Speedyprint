'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Image as ImageIcon, Trash2, Plus } from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { addImage } from '@/lib/editor/fabricUtils'
import { toast } from 'sonner'
import { FabricImage } from 'fabric'

interface UploadEntry {
  id: string
  name: string
  dataUrl: string
  timestamp: number
}

export default function MyUploadsPanel() {
  const [uploads, setUploads] = useState<UploadEntry[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvas = useEditorStore((s) => s.canvas)

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return

      Array.from(files).forEach((file) => {
        // Preflight checks
        const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
          toast.error(`"${file.name}" is an unsupported format. Please use PNG, JPG, SVG, or PDF.`)
          return
        }

        if (file.size > 50 * 1024 * 1024) {
          toast.error(`"${file.name}" is too large (>50MB). Please optimise your file.`)
          return
        }

        const reader = new FileReader()
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string
          
          // Image resolution check
          const img = new Image()
          img.onload = () => {
             if (img.width < 1000 || img.height < 1000) {
               toast.warning(`"${file.name}" has low resolution. It may appear blurry when printed.`, {
                 description: 'For best results, use images at least 2000px wide.',
               })
             }
          }
          img.src = dataUrl

          setUploads((prev) => [
            {
              id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: file.name,
              dataUrl,
              timestamp: Date.now(),
            },
            ...prev,
          ])
        }
        reader.readAsDataURL(file)
      })

      e.target.value = ''
    },
    []
  )

  const handleAddToCanvas = useCallback(
    async (upload: UploadEntry) => {
      if (!canvas) return
      const img = await FabricImage.fromURL(upload.dataUrl)
      const maxW = canvas.getWidth() * 0.6
      const maxH = canvas.getHeight() * 0.6
      const scale = Math.min(maxW / (img.width ?? 1), maxH / (img.height ?? 1), 1)
      img.set({
        left: canvas.getWidth() / 2 - ((img.width ?? 0) * scale) / 2,
        top: canvas.getHeight() / 2 - ((img.height ?? 0) * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      })
      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()
    },
    [canvas]
  )

  const handleDelete = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id))
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2">
        <h2 className="text-sm font-semibold text-ed-text mb-3">My Uploads</h2>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-5 border-2 border-dashed border-ed-border rounded-lg hover:border-ed-accent/40 hover:bg-ed-accent/5 transition-all group"
        >
          <Upload size={20} className="text-ed-text-dim group-hover:text-ed-accent" />
          <span className="text-sm text-ed-text-dim group-hover:text-ed-accent font-medium">
            Upload Files
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 editor-scrollbar">
        {uploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon size={40} className="text-ed-text-dim mb-3" />
            <p className="text-sm text-ed-text-dim mb-1">No uploads yet</p>
            <p className="text-[10px] text-ed-text-dim">Upload images to use in your design</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="bg-ed-bg border border-ed-border rounded-lg overflow-hidden group hover:border-ed-border-light transition-shadow"
              >
                <div className="relative">
                  <img
                    src={upload.dataUrl}
                    alt={upload.name}
                    className="w-full h-20 object-cover"
                  />
                  <button
                    onClick={() => handleDelete(upload.id)}
                    className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
                <div className="p-1.5">
                  <p className="text-[10px] text-ed-text-dim truncate mb-1">{upload.name}</p>
                  <button
                    onClick={() => handleAddToCanvas(upload)}
                    className="w-full flex items-center justify-center gap-1 py-1 bg-ed-accent text-white rounded text-[10px] font-medium hover:bg-ed-accent-hover transition-colors"
                  >
                    <Plus size={10} />
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
