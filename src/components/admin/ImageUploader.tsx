'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, AlertTriangle, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { IMAGE_SPECS, type ImageType } from '@/lib/imageSpecs'

interface ImageUploaderProps {
  value: string[]
  onChange: (value: string[]) => void
  maxImages?: number
  bucket?: string
  folder?: string
  imageType?: ImageType
}

interface DimensionWarning {
  fileName: string
  actualWidth: number
  actualHeight: number
  notWebP: boolean
  tooSmall: boolean
}

function checkImageDimensions(
  file: File,
  spec: (typeof IMAGE_SPECS)[ImageType]
): Promise<DimensionWarning | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      const notWebP = file.type !== 'image/webp'
      const tooSmall = img.naturalWidth < spec.width || img.naturalHeight < spec.height
      URL.revokeObjectURL(url)
      if (notWebP || tooSmall) {
        resolve({
          fileName: file.name,
          actualWidth: img.naturalWidth,
          actualHeight: img.naturalHeight,
          notWebP,
          tooSmall,
        })
      } else {
        resolve(null)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

export function ImageUploader({
  value = [],
  onChange,
  maxImages = 3,
  bucket = 'products',
  folder = 'product-groups',
  imageType,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<DimensionWarning[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const spec = imageType ? IMAGE_SPECS[imageType] : null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (value.length + files.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images`)
      return
    }

    setError(null)
    setWarnings([])

    // Check dimensions before uploading if spec is defined
    if (spec) {
      const checks = await Promise.all(files.map((f) => checkImageDimensions(f, spec)))
      const newWarnings = checks.filter((w): w is DimensionWarning => w !== null)
      if (newWarnings.length > 0) {
        setWarnings(newWarnings)
      }
    }

    setUploading(true)

    try {
      const supabase = createClient()
      const newUrls: string[] = [...value]

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `${folder}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)

        newUrls.push(urlData.publicUrl)
      }

      onChange(newUrls)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload one or more images')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index)
    onChange(newUrls)
  }

  return (
    <div className="space-y-3">
      {/* Spec badge */}
      {spec && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>{spec.label}:</strong> {spec.width}×{spec.height} px · {spec.ratio} · {spec.format}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {value.map((url, index) => (
          <div
            key={url}
            className="group relative aspect-square rounded-lg border bg-muted overflow-hidden"
          >
            <img
              src={url}
              alt={`Product ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 transition-colors hover:border-brand/50 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Upload</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Dimension / format warnings */}
      {warnings.map((w) => (
        <div
          key={w.fileName}
          className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>{w.fileName}</strong>
            {w.tooSmall && (
              <> is {w.actualWidth}×{w.actualHeight} px — smaller than the recommended {spec!.width}×{spec!.height} px.</>
            )}
            {w.notWebP && <> Convert to WebP for best performance.</>}
            {' '}Image was still uploaded.
          </span>
        </div>
      ))}

      {error && (
        <p className="text-xs font-medium text-red-500">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Upload up to {maxImages} images. PNG, JPG or WebP.
        {spec && <> Recommended: {spec.width}×{spec.height} px WebP.</>}
      </p>
    </div>
  )
}
