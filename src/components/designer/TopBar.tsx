'use client'

/**
 * TopBar — Editor top bar with back, design name, undo/redo, save, preview, export, add to cart.
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useEditorStore } from '@/lib/designer/store'
import { ExportDialog } from './ExportDialog'
import { ShortcutHelp } from './ShortcutHelp'
import {
  Undo2,
  Redo2,
  Save,
  Eye,
  ShoppingCart,
  Loader2,
  ArrowLeft,
  Download,
  Keyboard,
  ZoomIn,
  ZoomOut,
  Maximize,
  TableProperties,
  PanelLeft,
  PanelRight,
} from 'lucide-react'
import type { ProductTemplate } from '@/types'

// --- Props ---

interface TopBarProps {
  template: ProductTemplate
  designName: string
  isDirty: boolean
  isSaving: boolean
  isAuthenticated: boolean
  onSetDesignName: (name: string) => void
  onSave: () => void
  onPreview: () => void
  onAddToCart: () => void
}

// --- Component ---

export function TopBar({
  template,
  designName,
  isDirty,
  isSaving,
  isAuthenticated,
  onSetDesignName,
  onSave,
  onPreview,
  onAddToCart,
}: TopBarProps) {
  const router = useRouter()
  const editor = useEditorStore((s) => s.editor)
  const canUndo = useEditorStore((s) => s.canUndo)
  const canRedo = useEditorStore((s) => s.canRedo)
  const zoom = useEditorStore((s) => s.zoom)
  const toggleLeftPanel = useEditorStore((s) => s.toggleLeftPanel)
  const toggleRightPanel = useEditorStore((s) => s.toggleRightPanel)

  const [showExport, setShowExport] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const handleUndo = useCallback(() => {
    if (!editor) return
    const history = editor.getPlugin<{ undo: () => void }>('HistoryPlugin')
    history?.undo()
  }, [editor])

  const handleRedo = useCallback(() => {
    if (!editor) return
    const history = editor.getPlugin<{ redo: () => void }>('HistoryPlugin')
    history?.redo()
  }, [editor])

  const handleZoomIn = useCallback(() => {
    if (!editor) return
    const zp = editor.getPlugin<{ zoomIn: () => void }>('ZoomPlugin')
    zp?.zoomIn()
  }, [editor])

  const handleZoomOut = useCallback(() => {
    if (!editor) return
    const zp = editor.getPlugin<{ zoomOut: () => void }>('ZoomPlugin')
    zp?.zoomOut()
  }, [editor])

  const handleZoomFit = useCallback(() => {
    if (!editor) return
    const zp = editor.getPlugin<{ zoomToFit: () => void }>('ZoomPlugin')
    zp?.zoomToFit()
  }, [editor])

  return (
    <>
      <div className="flex w-full items-center justify-between gap-1 px-2 sm:px-3">
        {/* Left: back + design name + mobile left-panel toggle */}
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          {/* Mobile: open left tools panel */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleLeftPanel}
            title="Tools panel"
            className="shrink-0 lg:hidden"
          >
            <PanelLeft className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.back()}
            title="Back"
            className="shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {template.product_group?.name || 'Product'}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">/</span>
            <Input
              value={designName}
              onChange={(e) => onSetDesignName(e.target.value)}
              className="h-7 w-24 border-none bg-transparent text-sm font-medium shadow-none focus-visible:ring-1 sm:w-40"
              placeholder="Design name"
            />
          </div>

          {isDirty && (
            <span className="hidden text-xs text-amber-500 sm:inline">Unsaved</span>
          )}
        </div>

        {/* Center: zoom + undo/redo (hidden on mobile) */}
        <div className="hidden items-center gap-1 md:flex">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="size-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <Button variant="ghost" size="icon-sm" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="size-4" />
          </Button>
          <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon-sm" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleZoomFit} title="Fit to Screen">
            <Maximize className="size-3.5" />
          </Button>
        </div>

        {/* Right: actions + mobile right-panel toggle */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard Shortcuts"
            className="hidden md:flex"
          >
            <Keyboard className="size-4" />
          </Button>

          <Separator orientation="vertical" className="hidden h-5 md:block" />

          {/* Batch CSV Upload — only for event products (race bibs, MTB boards, etc.) */}
          {template.product_group?.division === 'events' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/designer/${template.id}/csv`)}
                title="Batch CSV Variable Data Upload"
                className="hidden border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-400 sm:flex"
              >
                <TableProperties className="size-4" />
                <span className="hidden sm:inline">Batch CSV</span>
              </Button>
              <Separator orientation="vertical" className="hidden h-5 sm:block" />
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving || !isDirty}
            className="px-2 sm:px-3"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            <span className="hidden sm:inline">Save</span>
          </Button>

          <Button variant="outline" size="sm" onClick={onPreview} className="hidden sm:flex">
            <Eye className="size-4" />
            Preview
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExport(true)}
            className="hidden sm:flex"
          >
            <Download className="size-4" />
            Export
          </Button>

          <Button size="sm" onClick={onAddToCart} className="px-2 sm:px-3">
            <ShoppingCart className="size-4" />
            <span className="hidden sm:inline">Add to Cart</span>
          </Button>

          {/* Mobile: open right properties panel */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleRightPanel}
            title="Properties panel"
            className="shrink-0 lg:hidden"
          >
            <PanelRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      <ExportDialog open={showExport} onClose={() => setShowExport(false)} />
      <ShortcutHelp open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  )
}
