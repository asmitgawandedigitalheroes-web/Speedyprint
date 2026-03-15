/**
 * ExportPlugin — Multi-format export (PNG, JPEG, SVG, PDF).
 */

import type { Canvas as FabricCanvas } from 'fabric'
import type { IPluginTempl, IEditor } from '../types'

interface ExportOptions {
  format?: 'png' | 'jpeg' | 'svg'
  quality?: number
  multiplier?: number // DPI multiplier
  includeBleed?: boolean
}

export class ExportPlugin implements IPluginTempl {
  pluginName = 'ExportPlugin'
  canvas: FabricCanvas
  editor: IEditor

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Export canvas as a data URL.
   */
  exportDataURL(options: ExportOptions = {}): string {
    const {
      format = 'png',
      quality = 1,
      multiplier = 1,
    } = options

    return this.canvas.toDataURL({
      format: format === 'svg' ? 'png' : format,
      quality,
      multiplier,
    })
  }

  /**
   * Export as PNG and trigger download.
   */
  downloadPNG(filename: string = 'design.png', multiplier: number = 1): void {
    const dataUrl = this.exportDataURL({ format: 'png', multiplier })
    this._downloadFile(dataUrl, filename)
  }

  /**
   * Export as JPEG and trigger download.
   */
  downloadJPEG(filename: string = 'design.jpg', quality: number = 0.92): void {
    const dataUrl = this.exportDataURL({ format: 'jpeg', quality })
    this._downloadFile(dataUrl, filename)
  }

  /**
   * Export as SVG string.
   */
  exportSVG(): string {
    return this.canvas.toSVG()
  }

  /**
   * Export as SVG and trigger download.
   */
  downloadSVG(filename: string = 'design.svg'): void {
    const svgString = this.exportSVG()
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    this._downloadFile(url, filename)
    URL.revokeObjectURL(url)
  }

  /**
   * Export as PDF using browser print.
   */
  async downloadPDF(filename: string = 'design.pdf'): Promise<void> {
    try {
      // Use pdf-lib if available, otherwise use canvas-to-blob approach
      const { PDFDocument } = await import('pdf-lib')

      const pngDataUrl = this.exportDataURL({ format: 'png', multiplier: 2 })
      const pngBytes = this._dataUrlToBytes(pngDataUrl)

      const pdfDoc = await PDFDocument.create()
      const pngImage = await pdfDoc.embedPng(pngBytes)

      const page = pdfDoc.addPage([pngImage.width / 2, pngImage.height / 2])
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pngImage.width / 2,
        height: pngImage.height / 2,
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      this._downloadFile(url, filename)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[ExportPlugin] PDF export failed:', err)
      // Fallback: open print dialog
      const dataUrl = this.exportDataURL({ format: 'png', multiplier: 2 })
      const printWindow = window.open('')
      if (printWindow) {
        printWindow.document.write(`<img src="${dataUrl}" onload="window.print();window.close();" />`)
      }
    }
  }

  /**
   * Get estimated file size for given format.
   */
  estimateFileSize(format: 'png' | 'jpeg' | 'svg', multiplier: number = 1): string {
    const dataUrl = this.exportDataURL({ format, multiplier, quality: format === 'jpeg' ? 0.92 : 1 })
    const bytes = Math.round((dataUrl.length * 3) / 4)
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // --- Private ---

  private _downloadFile(url: string, filename: string): void {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  private _dataUrlToBytes(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(',')[1]
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }
}
