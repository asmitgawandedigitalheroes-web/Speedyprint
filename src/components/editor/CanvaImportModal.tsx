'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Link2, ExternalLink, Loader2, CheckCircle2, AlertCircle, ImageDown } from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'

interface ResolvedDesign {
  designId: string
  shareHash: string
  resolvedUrl: string
  embedUrl: string
}

interface Props {
  open: boolean
  initialUrl?: string
  onClose: () => void
  onLink: (canvaUrl: string) => void
  /** Called after saving the link — skips artboard import and goes straight to the order flow */
  onProceedToOrder?: () => void
}

export default function CanvaImportModal({ open, initialUrl = '', onClose, onLink, onProceedToOrder }: Props) {
  const [input, setInput] = useState(initialUrl)
  const [resolving, setResolving] = useState(false)
  const [resolved, setResolved] = useState<ResolvedDesign | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const canvas = useEditorStore((s) => s.canvas)
  const artboardWidth = useEditorStore((s) => s.artboardWidth)
  const artboardHeight = useEditorStore((s) => s.artboardHeight)

  useEffect(() => {
    if (open && initialUrl) {
      setInput(initialUrl)
      handleResolve(initialUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80)
      if (!initialUrl) {
        setInput('')
        setResolved(null)
        setError(null)
        setImportDone(false)
      }
    }
  }, [open, initialUrl])

  async function handleResolve(url = input) {
    const trimmed = url.trim()
    if (!trimmed) return
    setResolving(true)
    setError(null)
    setResolved(null)
    setImportDone(false)
    try {
      const res = await fetch(`/api/canva/resolve?url=${encodeURIComponent(trimmed)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not resolve that link.')
        return
      }
      setResolved(data as ResolvedDesign)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setResolving(false)
    }
  }

  async function handleImportToArtboard() {
    if (!resolved || !canvas) return
    setImporting(true)
    setError(null)
    try {
      // Capture the Canva design as a PNG via server-side Playwright
      const res = await fetch(`/api/canva/screenshot?embedUrl=${encodeURIComponent(resolved.embedUrl)}`)
      const data = await res.json()
      if (!res.ok || !data.image) {
        setError(data.error ?? 'Could not capture the design image.')
        return
      }

      // Load as Fabric image and add to canvas
      const { FabricImage } = await import('fabric')
      const img = await FabricImage.fromURL(data.image, { crossOrigin: 'anonymous' })

      // Scale to fit inside the artboard with some padding
      const artW = artboardWidth ?? canvas.getWidth() * 0.9
      const artH = artboardHeight ?? canvas.getHeight() * 0.9
      const scaleX = (artW * 0.95) / (img.width ?? 1)
      const scaleY = (artH * 0.95) / (img.height ?? 1)
      const scale = Math.min(scaleX, scaleY, 1)

      img.set({
        scaleX: scale,
        scaleY: scale,
        left: artW / 2,
        top: artH / 2,
        originX: 'center',
        originY: 'center',
      })

      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()

      setImportDone(true)
      // Also save the link reference
      onLink(resolved.resolvedUrl)

      // Auto-close after a moment
      setTimeout(onClose, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  function handleLinkOnly() {
    if (!resolved) return
    onLink(resolved.resolvedUrl)
    onClose()
  }

  function handleProceedToOrder() {
    if (!resolved) return
    onLink(resolved.resolvedUrl)
    onClose()
    onProceedToOrder?.()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-ed-bg border border-ed-border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ed-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-ed-accent/10 flex items-center justify-center">
              <Link2 size={14} className="text-ed-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ed-text">Link a Canva Design</h2>
              <p className="text-[11px] text-ed-text-dim">Paste your Canva share link to import it onto the artboard</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-ed-surface-hover text-ed-text-dim hover:text-ed-text transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* URL input */}
        <div className="px-5 py-4 border-b border-ed-border shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="url"
              value={input}
              onChange={(e) => { setInput(e.target.value); setResolved(null); setError(null); setImportDone(false) }}
              onKeyDown={(e) => e.key === 'Enter' && handleResolve()}
              placeholder="https://canva.link/… or https://www.canva.com/design/…"
              className="flex-1 px-3 py-2 text-sm border border-ed-border rounded-lg bg-ed-bg text-ed-text placeholder:text-ed-text-dim focus:outline-none focus:border-ed-accent transition-colors"
            />
            <button
              onClick={() => handleResolve()}
              disabled={resolving || !input.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-ed-accent text-white hover:bg-ed-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-1.5"
            >
              {resolving ? <Loader2 size={14} className="animate-spin" /> : null}
              {resolving ? 'Loading…' : 'Preview'}
            </button>
          </div>

          {error && (
            <div className="mt-2 flex items-start gap-2 text-[12px] text-red-500">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="mt-2 text-[11px] text-ed-text-dim">
            In Canva: <span className="font-medium">Share → Anyone with the link → Can view</span>
          </p>
        </div>

        {/* Embed preview */}
        {resolved && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="px-5 py-2.5 flex items-center justify-between border-b border-ed-border shrink-0">
              <div className="flex items-center gap-1.5 text-[12px] text-green-600">
                <CheckCircle2 size={13} />
                <span className="font-medium">Design found</span>
                <span className="text-ed-text-dim">· ID: {resolved.designId}</span>
              </div>
              <a
                href={resolved.resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-ed-accent hover:underline"
              >
                Open in Canva <ExternalLink size={10} />
              </a>
            </div>

            {/* iframe preview */}
            <div className="flex-1 bg-gray-100 overflow-hidden min-h-[280px]">
              <iframe
                src={resolved.embedUrl}
                title="Canva Design Preview"
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!resolved && !resolving && !error && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-ed-surface flex items-center justify-center mb-3">
              <Link2 size={20} className="text-ed-text-dim" />
            </div>
            <p className="text-sm font-medium text-ed-text mb-1">Paste your Canva share link above</p>
            <p className="text-[12px] text-ed-text-dim max-w-xs">
              Make sure sharing is set to <span className="font-medium">"Anyone with the link can view"</span> in Canva.
            </p>
          </div>
        )}

        {/* Action footer */}
        {resolved && (
          <div className="px-5 py-3 border-t border-ed-border flex items-center justify-between gap-2 shrink-0 bg-ed-surface">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-ed-border text-ed-text hover:bg-ed-surface-hover transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {/* Save link only */}
              <button
                onClick={handleLinkOnly}
                disabled={importing}
                className="px-4 py-2 text-sm rounded-lg border border-ed-border text-ed-text hover:bg-ed-surface-hover disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <Link2 size={13} />
                Save link only
              </button>

              {/* Proceed to order without importing */}
              {onProceedToOrder && (
                <button
                  onClick={handleProceedToOrder}
                  disabled={importing}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-ed-accent text-ed-accent hover:bg-ed-accent/10 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  Order with Canva link
                </button>
              )}

              {/* Import to artboard — main CTA */}
              <button
                onClick={handleImportToArtboard}
                disabled={importing || importDone}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-ed-accent text-white hover:bg-ed-accent/90 disabled:opacity-60 transition-colors flex items-center gap-1.5"
              >
                {importDone ? (
                  <><CheckCircle2 size={14} /> Imported!</>
                ) : importing ? (
                  <><Loader2 size={14} className="animate-spin" /> Importing…</>
                ) : (
                  <><ImageDown size={14} /> Import to Artboard</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
