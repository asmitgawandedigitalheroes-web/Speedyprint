/**
 * upload.ts — File upload utility with validation, progress tracking, and retry.
 *
 * Architecture:
 *  - Small images (≤ 2MB): read as data URL client-side (fast, no server round-trip)
 *  - Large files (> 2MB): POST to /api/upload which stores in Supabase Storage and
 *    returns a CDN-backed public URL.  This keeps canvas JSON small.
 */

export const MAX_FILE_SIZE_MB = 50
export const LARGE_FILE_THRESHOLD_MB = 2

/** File types accepted by the image uploader */
export const ACCEPTED_IMAGE_MIME = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
]

export const ACCEPTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf']

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationError {
  message: string
}

/**
 * Validate a file before uploading.
 * Returns an error message string, or null if the file is valid.
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = MAX_FILE_SIZE_MB
): string | null {
  const maxBytes = maxSizeMB * 1024 * 1024

  if (file.size > maxBytes) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum allowed is ${maxSizeMB} MB.`
  }

  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  const typeOk =
    ACCEPTED_IMAGE_MIME.includes(file.type) ||
    ACCEPTED_IMAGE_EXTENSIONS.includes(ext)

  if (!typeOk) {
    return `Unsupported file type "${file.type || ext}". Accepted: PNG, JPG, WebP, SVG, PDF.`
  }

  return null
}

// ---------------------------------------------------------------------------
// Progress-tracked upload
// ---------------------------------------------------------------------------

export interface UploadOptions {
  /** Called with 0–100 as the upload progresses */
  onProgress?: (percent: number) => void
  /** How many times to retry on network failure (default 3) */
  maxRetries?: number
}

export interface UploadResult {
  /** Public CDN URL for the uploaded file */
  url: string
  /** Storage path (for deletion later if needed) */
  path: string
}

/**
 * Upload a file to /api/upload with progress tracking and retry.
 * Uses XMLHttpRequest under the hood so `upload.progress` events fire.
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { onProgress, maxRetries = 3 } = options

  let lastError: Error = new Error('Upload failed')

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await _xhrUpload(file, onProgress)
      return result
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      if (attempt < maxRetries) {
        // Exponential back-off: 1s, 2s, 4s …
        await new Promise((r) => setTimeout(r, 1000 * attempt))
        onProgress?.(0) // reset progress on retry
      }
    }
  }

  throw lastError
}

function _xhrUpload(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 95)) // leave 5% for server processing
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UploadResult
          onProgress?.(100)
          resolve(data)
        } catch {
          reject(new Error('Invalid server response'))
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err.error || `Server error ${xhr.status}`))
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.addEventListener('abort', () => reject(new Error('Upload was aborted')))
    xhr.addEventListener('timeout', () => reject(new Error('Upload timed out')))

    xhr.timeout = 120_000 // 2-minute timeout for large files
    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  })
}

// ---------------------------------------------------------------------------
// Small-file fast path: read as data URL (no server round-trip)
// ---------------------------------------------------------------------------

/**
 * Read a small file as a base64 data URL with optional progress reporting.
 * For large files, use uploadFile() instead.
 */
export function readFileAsDataURL(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    reader.addEventListener('load', () => {
      onProgress?.(100)
      resolve(reader.result as string)
    })

    reader.addEventListener('error', () => reject(new Error('Failed to read file')))
    reader.readAsDataURL(file)
  })
}

/**
 * Smart upload: uses local data URL for small files, server upload for large ones.
 * Returns a URL usable as an image src.
 */
export async function smartUpload(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const thresholdBytes = LARGE_FILE_THRESHOLD_MB * 1024 * 1024

  if (file.size <= thresholdBytes) {
    // Small file: read locally for instant display
    return readFileAsDataURL(file, options.onProgress)
  } else {
    // Large file: upload to server, get CDN URL back
    const result = await uploadFile(file, options)
    return result.url
  }
}
