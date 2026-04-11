'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface ImageUploaderProps {
  value: string[]
  onChange: (value: string[]) => void
  maxImages?: number
  bucket?: string
  folder?: string
}

export function ImageUploader({
  value = [],
  onChange,
  maxImages = 3,
  bucket = 'products',
  folder = 'product-groups',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (value.length + files.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images`)
      return
    }

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const newUrls: string[] = [...value]

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `${folder}/${fileName}`

        const { data, error: uploadError } = await supabase.storage
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
    <div className="space-y-4">
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

      {error && (
        <p className="text-xs font-medium text-red-500">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Upload up to {maxImages} images. PNG, JPG or WEBP.
      </p>
    </div>
  )
}
