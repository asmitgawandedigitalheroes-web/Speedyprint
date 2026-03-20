/**
 * ImportPlugin — Import SVG, images, saved JSON designs, and PDFs.
 *
 * PDF support:
 *  Renders the first page of a PDF to a <canvas> element using PDF.js
 *  (loaded on demand from unpkg CDN — no extra npm package required).
 *  The rendered bitmap is then added to the Fabric canvas as an image.
 */

import { FabricImage, loadSVGFromString, type Canvas as FabricCanvas } from 'fabric'
import { loadCanvasJSON, getSafeZoneCenter } from '../canvas-utils'
import type { IPluginTempl, IEditor } from '../types'

// PDF.js version used for CDN loading (UMD build — webpack-safe, no dynamic import expression)
const PDFJS_VERSION = '4.4.168'
const PDFJS_CDN = 'https://unpkg.com/pdfjs-dist@' + PDFJS_VERSION + '/build/pdf.min.js'
const PDFJS_WORKER_CDN = 'https://unpkg.com/pdfjs-dist@' + PDFJS_VERSION + '/build/pdf.worker.min.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pdfjsLibCache: any = null

/**
 * Load PDF.js UMD bundle via a <script> tag (webpack-safe — no dynamic import expression).
 * The library attaches itself to `window.pdfjsLib` when loaded.
 * Subsequent calls return the cached module immediately.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _loadPdfjs(): Promise<any> {
  // Return cached instance
  if (_pdfjsLibCache) return Promise.resolve(_pdfjsLibCache)

  // Already on window (e.g. script tag previously loaded)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _pdfjsLibCache = (window as any).pdfjsLib
    return Promise.resolve(_pdfjsLibCache)
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = PDFJS_CDN
    script.async = true
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lib = (window as any).pdfjsLib
      if (!lib) {
        reject(new Error('PDF.js loaded but window.pdfjsLib is not defined'))
        return
      }
      lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN
      _pdfjsLibCache = lib
      resolve(lib)
    }
    script.onerror = () =>
      reject(
        new Error(
          'PDF rendering requires an internet connection to load the PDF library. Please try again.'
        )
      )
    document.head.appendChild(script)
  })
}

export class ImportPlugin implements IPluginTempl {
  pluginName = 'ImportPlugin'
  canvas: FabricCanvas
  editor: IEditor

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Import an SVG file and add its objects to the canvas.
   */
  async importSVG(file: File): Promise<void> {
    const svgString = await file.text()
    this._saveHistory()

    try {
      const result = await loadSVGFromString(svgString)
      const objects = result.objects.filter(Boolean)

      if (objects.length === 0) return

      const zones = this._getZones()
      const { x: centerX, y: centerY } = getSafeZoneCenter(this.canvas, zones)

      // Group the SVG objects and add to canvas
      const fabric = await import('fabric')
      const group = new fabric.Group(objects as import('fabric').FabricObject[], {
        left: centerX,
        top: centerY,
        originX: 'center',
        originY: 'center',
      })

      // Scale to fit in safe zone
      if (zones) {
        const maxW = zones.safePx.width * 0.8
        const maxH = zones.safePx.height * 0.8
        const scaleX = maxW / (group.width || 1)
        const scaleY = maxH / (group.height || 1)
        const scale = Math.min(scaleX, scaleY, 1)
        group.scale(scale)
      }

      this.canvas.add(group)
      this.canvas.setActiveObject(group)
      this.canvas.requestRenderAll()
      this.editor.emit('canvas:dirty')
    } catch (err) {
      console.error('[ImportPlugin] SVG import failed:', err)
    }
  }

  /**
   * Import an image file.
   */
  async importImage(file: File): Promise<void> {
    this._saveHistory()

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

    const zones = this._getZones()
    const imgElement = new Image()
    imgElement.crossOrigin = 'anonymous'

    await new Promise<void>((resolve) => {
      imgElement.onload = () => resolve()
      imgElement.onerror = () => resolve()
      imgElement.src = dataUrl
    })

    const { x: imgCX, y: imgCY } = getSafeZoneCenter(this.canvas, zones)
    const fabricImage = new FabricImage(imgElement, {
      left: imgCX,
      top: imgCY,
      originX: 'center',
      originY: 'center',
    })

    // Scale to fit
    if (zones) {
      const maxW = zones.safePx.width * 0.8
      const maxH = zones.safePx.height * 0.8
      const scaleX = maxW / (fabricImage.width || 1)
      const scaleY = maxH / (fabricImage.height || 1)
      const scale = Math.min(scaleX, scaleY, 1)
      fabricImage.scale(scale)
    } else {
      const maxDim = 300
      const scaleFactor = Math.min(
        maxDim / (fabricImage.width || 1),
        maxDim / (fabricImage.height || 1),
        1
      )
      fabricImage.scale(scaleFactor)
    }

    this.canvas.add(fabricImage)
    this.canvas.setActiveObject(fabricImage)
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  /**
   * Import a PDF file — renders first page to canvas as an image.
   * Uses PDF.js loaded dynamically from CDN.
   */
  async importPDF(file: File): Promise<void> {
    this._saveHistory()

    try {
      // Load PDF.js UMD bundle from CDN via <script> tag (webpack-safe)
      const pdfjsLib = await _loadPdfjs()

      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      if (pdfDoc.numPages === 0) {
        throw new Error('PDF has no pages.')
      }

      // Render first page
      const page = await pdfDoc.getPage(1)
      const scale = 2 // 2× for print-quality rasterisation
      const viewport = page.getViewport({ scale })

      const offscreenCanvas = document.createElement('canvas')
      offscreenCanvas.width = viewport.width
      offscreenCanvas.height = viewport.height
      const ctx = offscreenCanvas.getContext('2d')
      if (!ctx) throw new Error('Cannot get 2D context for PDF render')

      await page.render({ canvasContext: ctx, viewport }).promise

      // Convert rendered canvas to data URL and add to Fabric canvas as image
      const dataUrl = offscreenCanvas.toDataURL('image/png')

      const zones = this._getZones()
      const imgElement = new Image()
      imgElement.crossOrigin = 'anonymous'

      await new Promise<void>((resolve) => {
        imgElement.onload = () => resolve()
        imgElement.onerror = () => resolve()
        imgElement.src = dataUrl
      })

      const { x: cx, y: cy } = getSafeZoneCenter(this.canvas, zones)
      const fabricImage = new FabricImage(imgElement, {
        left: cx,
        top: cy,
        originX: 'center',
        originY: 'center',
      })

      // Scale to fit within the safe zone
      if (zones) {
        const maxW = zones.safePx.width * 0.8
        const maxH = zones.safePx.height * 0.8
        const scale = Math.min(
          maxW / (fabricImage.width || 1),
          maxH / (fabricImage.height || 1),
          1
        )
        fabricImage.scale(scale)
      } else {
        fabricImage.scale(Math.min(300 / (fabricImage.width || 1), 300 / (fabricImage.height || 1), 1))
      }

      this.canvas.add(fabricImage)
      this.canvas.setActiveObject(fabricImage)
      this.canvas.requestRenderAll()
      this.editor.emit('canvas:dirty')
    } catch (err) {
      console.error('[ImportPlugin] PDF import failed:', err)
      throw err // re-throw so Toolbar can display the error
    }
  }

  /**
   * Import a saved design JSON file.
   */
  async importJSON(file: File): Promise<void> {
    try {
      const text = await file.text()
      const json = JSON.parse(text)

      this._saveHistory()
      await loadCanvasJSON(this.canvas, json)
      this.canvas.requestRenderAll()
      this.editor.emit('canvas:dirty')
    } catch (err) {
      console.error('[ImportPlugin] JSON import failed:', err)
    }
  }

  /**
   * Import a file — auto-detect type.
   * Supported: SVG, PNG/JPG/WebP images, JSON design files, PDF (first page rendered).
   */
  async importFile(file: File): Promise<void> {
    const type = file.type
    const name = file.name.toLowerCase()

    if (type === 'image/svg+xml' || name.endsWith('.svg')) {
      await this.importSVG(file)
    } else if (type === 'application/pdf' || name.endsWith('.pdf')) {
      await this.importPDF(file)
    } else if (type.startsWith('image/')) {
      await this.importImage(file)
    } else if (type === 'application/json' || name.endsWith('.json')) {
      await this.importJSON(file)
    } else {
      console.warn('[ImportPlugin] Unsupported file type:', type)
    }
  }

  // --- Private ---

  private _saveHistory(): void {
    if (this.editor.hasPlugin('HistoryPlugin')) {
      this.editor.getPlugin<{ saveState: () => void }>('HistoryPlugin').saveState()
    }
  }

  private _getZones() {
    if (this.editor.hasPlugin('ZonePlugin')) {
      return this.editor.getPlugin<{ getZones: () => import('../canvas-utils').CanvasZones | null }>('ZonePlugin').getZones()
    }
    return null
  }
}
