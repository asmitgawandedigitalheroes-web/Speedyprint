'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Save,
  Eye,
  Download,
  ShoppingCart,
  Table2,
  ChevronDown,
  X,
  Minus,
  Plus,
  Check,
  LayoutTemplate,
  MoreVertical,
  RotateCcw,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { exportJSON, exportPNG, exportSVG, loadJSON } from '@/lib/editor/fabricUtils'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/hooks/useCart'
import { CURRENCY_SYMBOL, VAT_RATE } from '@/lib/utils/constants'
import type { ProductTemplate } from '@/types'

export default function Toolbar() {
  const [saving, setSaving] = useState(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSavedJsonRef = useRef<string | null>(null)
  const [siblingTemplates, setSiblingTemplates] = useState<ProductTemplate[]>([])
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [cartQuantity, setCartQuantity] = useState(100)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartAdded, setCartAdded] = useState(false)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const templatePickerRef = useRef<HTMLDivElement>(null)

  const canvas = useEditorStore((s) => s.canvas)
  const zoom = useEditorStore((s) => s.zoom)
  const zoomIn = useEditorStore((s) => s.zoomIn)
  const zoomOut = useEditorStore((s) => s.zoomOut)
  const zoomToFit = useEditorStore((s) => s.zoomToFit)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const template = useEditorStore((s) => s.template)
  const setTemplate = useEditorStore((s) => s.setTemplate)
  const designId = useEditorStore((s) => s.designId)
  const setDesignId = useEditorStore((s) => s.setDesignId)
  const designName = useEditorStore((s) => s.designName)
  const setDesignName = useEditorStore((s) => s.setDesignName)
  const saveStatus = useEditorStore((s) => s.saveStatus)
  const setSaveStatus = useEditorStore((s) => s.setSaveStatus)
  const addItem = useCart((s) => s.addItem)
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  const noCanvas = !canvas
  const groupName = template?.product_group?.name ?? template?.name ?? null

  useEffect(() => {
    if (!template?.product_group_id) {
      setSiblingTemplates([])
      return
    }

    const fetchSiblings = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('product_templates')
        .select('*, product_group:product_groups(*)')
        .eq('product_group_id', template.product_group_id)
        .eq('is_active', true)
        .order('name')
      
      if (!error && data && data.length > 1) {
        setSiblingTemplates(data as unknown as ProductTemplate[])
      } else {
        setSiblingTemplates([])
      }
    }

    fetchSiblings()
  }, [template?.product_group_id])

  useEffect(() => {
    if (!showTemplatePicker) return
    const handleClick = (e: MouseEvent) => {
      if (templatePickerRef.current && !templatePickerRef.current.contains(e.target as Node)) {
        setShowTemplatePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showTemplatePicker])

  const handleTemplateSwitch = useCallback(
    (newTemplate: ProductTemplate) => {
      setShowTemplatePicker(false)
      setTemplate(newTemplate)
    },
    [setTemplate]
  )

  const handleSave = useCallback(async () => {
    if (!canvas) return

    // If not authenticated, save to local storage and redirect to login
    if (!isAuthenticated) {
      const canvasJson = exportJSON(canvas)
      const pendingData = {
        name: designName || 'Untitled Design',
        canvas_json: JSON.parse(canvasJson),
        product_template_id: template?.id ?? null,
        timestamp: Date.now()
      }
      localStorage.setItem('sp_pending_design', JSON.stringify(pendingData))
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }

    setSaving(true)
    try {
      const canvasJson = JSON.parse(exportJSON(canvas))
      const thumbnailUrl = canvas.toDataURL({ format: 'png', multiplier: 0.3 })

      const body: Record<string, unknown> = {
        name: designName || 'Untitled Design',
        canvas_json: canvasJson,
        thumbnail_url: thumbnailUrl,
        product_template_id: template?.id ?? null,
      }

      let res: Response
      if (designId) {
        res = await fetch(`/api/designs/${designId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.id) setDesignId(data.id)
        }
      }

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to save: ${res.status} ${res.statusText} - ${errorText}`)
      }

      setSaveStatus('saved')
    } catch (err) {
      console.error('Save failed:', err)
      setSaveStatus('unsaved')
      alert(err instanceof Error ? err.message : 'Save failed. Please check your connection.')
    } finally {
      setSaving(false)
    }
  }, [canvas, template, designId, setDesignId, designName, isAuthenticated])

  const handleSaveAsDefault = useCallback(async () => {
    if (!canvas || !template) return
    if (!confirm('Are you sure you want to save this design as the DEFAULT for this product template? ALL new users will start with this design.')) return
    
    setSaving(true)
    try {
      const canvasJson = JSON.parse(exportJSON(canvas))
      const supabase = createClient()
      
      const currentTj = (template.template_json || {}) as Record<string, any>
      const newTj = {
        ...currentTj,
        default_canvas_json: canvasJson
      }
      
      const { error } = await supabase
        .from('product_templates')
        .update({ template_json: newTj })
        .eq('id', template.id)
        
      if (error) throw error
      
      // Update local state
      setTemplate({ ...template, template_json: newTj })
      setSaveStatus('saved')
      alert('Default design saved successfully!')
    } catch (err) {
      console.error('Save as default failed:', err)
      setSaveStatus('unsaved')
      alert('Failed to save default design. Check console for details.')
    } finally {
      setSaving(false)
    }
  }, [canvas, template, setTemplate])

  // Auto-save every 30 seconds when there are unsaved changes
  useEffect(() => {
    if (!canvas) return

    const autoSave = async () => {
      const currentJson = exportJSON(canvas)
      // Skip if nothing changed since last save
      if (currentJson === lastSavedJsonRef.current) return
      lastSavedJsonRef.current = currentJson
      setSaveStatus('saving')
      try {
        const canvasJson = JSON.parse(currentJson)
        const thumbnailUrl = canvas.toDataURL({ format: 'png', multiplier: 0.3 })
        const body: Record<string, unknown> = {
          name: designName || 'Untitled Design',
          canvas_json: canvasJson,
          thumbnail_url: thumbnailUrl,
          product_template_id: template?.id ?? null,
        }
        const currentDesignId = useEditorStore.getState().designId
        let res: Response
        if (currentDesignId) {
          res = await fetch(`/api/designs/${currentDesignId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        } else {
          res = await fetch('/api/designs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          if (res.ok) {
            const data = await res.json()
            if (data?.id) useEditorStore.getState().setDesignId(data.id)
          }
        }

        if (!res.ok) {
          throw new Error(`Auto-save failed: ${res.status}`)
        }
        setSaveStatus('saved')
      } catch (err) {
        console.warn('Auto-save background failure:', err)
        setSaveStatus('unsaved')
      }
    }

    autoSaveTimerRef.current = setInterval(autoSave, 30000)
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)
    }
  }, [canvas, designName, template])

  // Mark as unsaved when canvas changes
  useEffect(() => {
    if (!canvas) return
    const markUnsaved = () => {
      // Don't mark as unsaved if we are currently saving or just finished
      if (useEditorStore.getState().saveStatus !== 'unsaved') {
        setSaveStatus('unsaved')
      }
    }
    canvas.on('object:modified', markUnsaved)
    canvas.on('object:added', markUnsaved)
    canvas.on('object:removed', markUnsaved)
    return () => {
      canvas.off('object:modified', markUnsaved)
      canvas.off('object:added', markUnsaved)
      canvas.off('object:removed', markUnsaved)
    }
  }, [canvas])

  const handleExportPNG = useCallback(() => {
    if (!canvas) return
    const dataUrl = exportPNG(canvas)
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${designName || 'design'}.png`
    a.click()
  }, [canvas, designName])

  const handleExportJPG = useCallback(() => {
    if (!canvas) return
    // @ts-ignore – Fabric toDataURL supports jpeg format
    const dataUrl = canvas.toDataURL({ format: 'jpeg', quality: 1, multiplier: 2 })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${designName || 'design'}.jpg`
    a.click()
  }, [canvas, designName])

  const handleExportSVG = useCallback(() => {
    if (!canvas) return
    const svgString = exportSVG(canvas)
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${designName || 'design'}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }, [canvas, designName])

  const handlePreview = useCallback(() => {
    if (!canvas) return
    const dataUrl = exportPNG(canvas)
    const win = window.open('', '_blank')
    if (win) {
      const title = designName || 'Preview'
      win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
    }
    .wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 24px;
      max-width: 100vw;
      max-height: 100vh;
    }
    img {
      display: block;
      max-width: calc(100vw - 48px);
      max-height: calc(100vh - 80px);
      width: auto;
      height: auto;
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      border-radius: 4px;
      background: #fff;
    }
    p { font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="wrap">
    <img src="${dataUrl}" alt="Design Preview"/>
    <p>${title}</p>
  </div>
</body>
</html>`)
      win.document.close()
    }
  }, [canvas, designName])

  const handleReset = useCallback(() => {
    if (!canvas) return
    if (!window.confirm('Reset design? All elements will be removed and the canvas will be cleared.')) return
    // Remove every object except the artboard and guides
    const toRemove = canvas.getObjects().filter((o) => {
      const meta = o as unknown as Record<string, unknown>
      return !meta.isArtboard && !meta.isGuide
    })
    toRemove.forEach((o) => canvas.remove(o))
    // Reset artboard fill back to white
    const artboard = canvas.getObjects().find(
      (o) => (o as unknown as Record<string, unknown>).isArtboard
    )
    if (artboard) artboard.set('fill', '#ffffff')
    canvas.discardActiveObject()
    canvas.renderAll()
    // Capture into history so the reset is undoable
    useEditorStore.getState().pushHistory(
      // @ts-ignore
      JSON.stringify(canvas.toJSON(['isArtboard', 'rawText']))
    )
    useEditorStore.getState().refreshObjects()
    useEditorStore.getState().setActiveObject(null)
  }, [canvas])

  const handleExportPDF = useCallback(async () => {
    if (!canvas) return
    try {
      // Step 1: Capture the canvas as PNG FIRST (synchronously, before any re-renders)
      // This ensures drawn paths and all canvas content are captured correctly.
      const pngDataUrl = exportPNG(canvas)

      // Step 2: Determine print dimensions (mm → points: 1mm = 2.83465pt)
      const MM_TO_PT = 2.83465
      const printWidthMm = template?.print_width_mm ?? 210
      const printHeightMm = template?.print_height_mm ?? 297
      const pageWidthPt = printWidthMm * MM_TO_PT
      const pageHeightPt = printHeightMm * MM_TO_PT

      // Step 3: Build PDF client-side using pdf-lib so drawn content is never lost
      const { PDFDocument } = await import('pdf-lib')
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([pageWidthPt, pageHeightPt])

      // Convert data URL to Uint8Array for embedding
      const base64 = pngDataUrl.split(',')[1]
      const pngBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
      const pngImage = await pdfDoc.embedPng(pngBytes)

      // Draw image to fill the page (white background from artboard is preserved in PNG)
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pageWidthPt,
        height: pageHeightPt,
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes] as any, { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${designName || 'design'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (err) {
      console.error('PDF export failed:', err)
    }
  }, [canvas, template, designName])

  // Compute unit price based on template or default
  const getUnitPrice = useCallback((qty: number) => {
    // Base price R5.00 per unit for 100x100mm
    let base = 5.0
    if (template) {
      // Scale by area relative to 100x100mm
      const area = (template.print_width_mm * template.print_height_mm) / (100 * 100)
      base = 5.0 * Math.max(area, 0.5)
    }
    // Volume discounts
    if (qty >= 1000) base *= 0.65
    else if (qty >= 500) base *= 0.72
    else if (qty >= 250) base *= 0.78
    else if (qty >= 100) base *= 0.85
    else if (qty >= 50) base *= 0.92

    return Math.round(base * 100) / 100
  }, [template])

  const handleOpenCartModal = useCallback(() => {
    if (!canvas) return
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      router.push(`/login?redirect=${returnUrl}`)
      return
    }
    setCartAdded(false)
    setShowCartModal(true)
  }, [canvas, user, router])

  const handleConfirmAddToCart = useCallback(async () => {
    if (!canvas) return
    setAddingToCart(true)

    try {
      // Auto-save the design first
      const canvasJson = JSON.parse(exportJSON(canvas))
      const thumbnailUrl = canvas.toDataURL({ format: 'png', multiplier: 0.3 })
      let savedDesignId = designId

      const body: Record<string, unknown> = {
        name: designName || 'Untitled Design',
        canvas_json: canvasJson,
        thumbnail_url: thumbnailUrl,
        product_template_id: template?.id ?? null,
      }

      let res: Response
      if (designId) {
        res = await fetch(`/api/designs/${designId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.id) {
            savedDesignId = data.id
            setDesignId(data.id)
          }
        }
      }

      if (!res.ok) {
        if (res.status === 401) {
          setShowCartModal(false)
          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
          router.push(`/login?redirect=${returnUrl}`)
          return
        }
        throw new Error(`Failed to save design before adding to cart: ${res.status}`)
      }

      const unitPrice = getUnitPrice(cartQuantity)

      // Restore product configuration params saved by ProductConfigurator
      let savedParams: Record<string, string> = {}
      if (template?.id) {
        try {
          const raw = sessionStorage.getItem(`speedy_params_${template.id}`)
          if (raw) {
            const parsed = JSON.parse(raw)
            savedParams = parsed.params ?? {}
            sessionStorage.removeItem(`speedy_params_${template.id}`)
          }
        } catch {
          // ignore — fall back to dimensions only
        }
      }

      addItem({
        product_group_id: template?.product_group_id ?? 'custom-design',
        product_template_id: template?.id ?? 'custom',
        product_name: template?.product_group?.name ?? 'Custom Design',
        template_name: template?.name ?? (designName || 'Untitled Design'),
        quantity: cartQuantity,
        unit_price: unitPrice,
        selected_params: {
          width_mm: template?.print_width_mm ?? 100,
          height_mm: template?.print_height_mm ?? 100,
          ...savedParams,
        },
        design_id: savedDesignId ?? undefined,
        thumbnail_url: thumbnailUrl,
      })

      setCartAdded(true)
    } catch (err: any) {
      console.error('Add to cart failed:', err)
      toast.error(err?.message || 'Failed to add to cart. Please try again.')
    } finally {
      setAddingToCart(false)
    }
  }, [canvas, designId, designName, template, cartQuantity, setDesignId, addItem, getUnitPrice])

  const iconBtn = 'p-1.5 text-ed-text-muted hover:text-ed-text hover:bg-ed-surface-hover rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95'
  const ghostBtn = 'flex items-center gap-1.5 px-3 py-1.5 border border-ed-border text-ed-text-muted text-xs font-medium rounded-md hover:text-ed-text hover:border-ed-border-light hover:bg-ed-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors'

  return (
    <div className="h-11 bg-ed-surface border-b border-ed-border flex items-center px-3 gap-2 flex-shrink-0 z-[60]">
      {/* LEFT: Back + Breadcrumb + Name + Status */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button onClick={() => window.history.back()} title="Back" className={iconBtn}>
          <ArrowLeft size={16} />
        </button>

        {groupName && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-ed-text-dim whitespace-nowrap">{groupName}</span>
            <span className="text-xs text-ed-border-light">/</span>
          </div>
        )}

        {siblingTemplates.length > 1 && template ? (
          <div ref={templatePickerRef} className="relative flex-shrink-0">
            <button
              onClick={() => setShowTemplatePicker((v) => !v)}
              className="flex items-center gap-1 text-sm font-semibold text-ed-text hover:bg-ed-surface-hover rounded-md px-2 py-0.5 transition-colors max-w-[120px] sm:max-w-none"
            >
              <span className="truncate">{template.name}</span>
              <ChevronDown size={14} className="text-ed-text-dim flex-shrink-0" />
            </button>
            {showTemplatePicker && (
              <div className="absolute top-full left-0 mt-1 bg-ed-surface border border-ed-border rounded-lg shadow-xl shadow-black/10 z-50 min-w-[200px] py-1">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-ed-text-dim uppercase tracking-wider">Template</p>
                {siblingTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateSwitch(t)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      t.id === template.id
                        ? 'bg-ed-accent/15 text-ed-accent font-medium'
                        : 'text-ed-text-muted hover:bg-ed-surface-hover hover:text-ed-text'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <input
            type="text"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            className="text-sm font-semibold text-ed-text bg-transparent border-none outline-none flex-1 min-w-[60px] max-w-[180px] hover:bg-ed-surface-hover focus:bg-ed-surface-hover px-2 py-0.5 rounded-md transition-all truncate"
            placeholder="Untitled"
          />
        )}

        {siblingTemplates.length > 1 && template && (
          <input
            type="text"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            className="hidden sm:block text-sm font-semibold text-ed-text bg-transparent border-none outline-none min-w-[60px] max-w-[140px] hover:bg-ed-surface-hover focus:bg-ed-surface-hover px-2 py-0.5 rounded-md transition-all truncate"
            placeholder="Untitled"
          />
        )}

        {/* Save status - hide text on mobile */}
        <span className="flex items-center gap-1.5 text-[11px] whitespace-nowrap">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            saveStatus === 'saving' || saving ? 'bg-blue-400 animate-pulse' :
            saveStatus === 'saved' ? 'bg-emerald-400' : 'bg-amber-400'
          }`} />
          <span className="hidden md:inline text-ed-text-dim">
            {saving || saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
          </span>
        </span>
      </div>

      {/* CENTER: Undo/Redo + Zoom - Hidden on mobile to prevent overlap, tail-end of scroll on tablet */}
      <div className="hidden lg:flex flex-1 items-center justify-center gap-0.5 flex-shrink-0">
        <button onClick={undo} disabled={noCanvas} title="Undo (Ctrl+Z)" className={iconBtn}>
          <Undo2 size={15} />
        </button>
        <button onClick={redo} disabled={noCanvas} title="Redo (Ctrl+Y)" className={iconBtn}>
          <Redo2 size={15} />
        </button>
        <button onClick={handleReset} disabled={noCanvas} title="Reset Design" className={`${iconBtn} hover:text-red-500`}>
          <RotateCcw size={15} />
        </button>

        <div className="w-px h-4 bg-ed-border mx-2" />

        <div className="flex items-center bg-ed-bg rounded-md px-1">
          <button onClick={zoomOut} disabled={noCanvas} title="Zoom Out" className={iconBtn}>
            <ZoomOut size={15} />
          </button>
          <span className="text-[11px] text-ed-text-muted font-mono min-w-[3rem] text-center tabular-nums select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={zoomIn} disabled={noCanvas} title="Zoom In" className={iconBtn}>
            <ZoomIn size={15} />
          </button>
        </div>
        <button onClick={zoomToFit} disabled={noCanvas} title="Fit to View" className={iconBtn}>
          <Maximize2 size={15} />
        </button>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="hidden lg:flex items-center gap-1.5">
          <button onClick={handlePreview} disabled={noCanvas} title="Preview" className={iconBtn}>
            <Eye size={16} />
          </button>
          <button
            onClick={() => useEditorStore.getState().togglePrintBoundaries()}
            disabled={noCanvas}
            title="Toggle Print Boundaries"
            className={iconBtn}
            style={{ opacity: useEditorStore.getState().showPrintBoundaries ? 1 : 0.4 }}
          >
            <Maximize2 size={15} />
          </button>

          <div className="w-px h-4 bg-ed-border mx-0.5" />

          {template && (
            <button
              onClick={() => window.open(`/designer/${template.id}/csv${designId ? `?design=${designId}` : ''}`, '_blank')}
              disabled={noCanvas}
              title="Batch CSV Upload"
              className={ghostBtn}
            >
              <Table2 size={14} />
              CSV
            </button>
          )}
          <button onClick={handleSave} disabled={noCanvas || saving} title="Save Design" className={ghostBtn}>
            <Save size={14} />
            {saving ? 'Saving...' : 'Save'}
          </button>

          {/* Export dropdown — JPG / PNG / SVG / PDF */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button disabled={noCanvas} className={ghostBtn} title="Export design">
                <Download size={14} />
                Export
                <ChevronDown size={12} className="-ml-0.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleExportJPG} disabled={noCanvas}>
                <Download className="mr-2 h-4 w-4 text-amber-500" />
                <span>Export as JPG</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPNG} disabled={noCanvas}>
                <Download className="mr-2 h-4 w-4 text-blue-500" />
                <span>Export as PNG</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportSVG} disabled={noCanvas}>
                <Download className="mr-2 h-4 w-4 text-green-600" />
                <span>Export as SVG</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportPDF} disabled={noCanvas}>
                <Download className="mr-2 h-4 w-4 text-red-600" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {useAuth.getState().user?.role === 'admin' && (
            <button 
              onClick={handleSaveAsDefault} 
              disabled={noCanvas || saving} 
              title="Save as Default Template Design (Admin Only)" 
              className={`${ghostBtn} bg-blue-50/50 border-blue-200 text-blue-600 hover:bg-blue-100/50`}
            >
              <LayoutTemplate size={14} />
              Set Default
            </button>
          )}

          <div className="w-px h-4 bg-ed-border mx-0.5" />
        </div>

        {/* Mobile More Actions Dropdown — shown when < lg */}
        <div className="flex lg:hidden items-center mr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button title="More Actions" className={iconBtn}>
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handlePreview} disabled={noCanvas}>
                <Eye className="mr-2 h-4 w-4" />
                <span>Preview</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useEditorStore.getState().togglePrintBoundaries()} disabled={noCanvas}>
                <Maximize2 className="mr-2 h-4 w-4" />
                <span>Toggle Boundaries</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReset} disabled={noCanvas} className="text-red-500 focus:text-red-500">
                <RotateCcw className="mr-2 h-4 w-4" />
                <span>Reset Design</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSave} disabled={noCanvas || saving}>
                <Save className="mr-2 h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Design'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJPG} disabled={noCanvas}>
                <Download className="mr-2 h-4 w-4 text-amber-500" />
                <span>Export as JPG</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPNG} disabled={noCanvas}>
                <Download className="mr-2 h-4 w-4 text-blue-500" />
                <span>Export as PNG</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportSVG} disabled={noCanvas}>
                <Download className="mr-2 h-4 w-4 text-green-600" />
                <span>Export as SVG</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} disabled={noCanvas}>
                <Download className="mr-2 h-4 w-4 text-red-600" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
              {template && (
                <DropdownMenuItem onClick={() => window.open(`/designer/${template.id}/csv${designId ? `?design=${designId}` : ''}`, '_blank')} disabled={noCanvas}>
                  <Table2 className="mr-2 h-4 w-4" />
                  <span>Batch CSV</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Primary CTA — compact text on mobile */}
        <button
          onClick={handleOpenCartModal}
          disabled={noCanvas}
          title="Add to Cart"
          className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-ed-accent to-ed-accent-hover text-white text-xs font-bold rounded-md hover:from-ed-accent-hover hover:to-ed-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-ed-accent/20 hover:shadow-ed-accent/30 active:scale-95"
        >
          <ShoppingCart size={14} className="flex-shrink-0" />
          <span className="sm:inline">Add to Cart</span>
          <span className="hidden sm:hidden">Add</span>
        </button>
      </div>

      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file || !canvas) return
          const reader = new FileReader()
          reader.onload = (ev) => loadJSON(canvas, ev.target?.result as string)
          reader.readAsText(file)
          e.target.value = ''
        }}
      />

      {/* Add to Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add to Cart</h2>
              <button
                onClick={() => setShowCartModal(false)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {cartAdded ? (
              /* Success State */
              <div className="px-5 py-8 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={28} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Added to Cart!</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {cartQuantity}x {template?.name ?? designName} added to your cart.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Continue Designing
                  </button>
                  <button
                    onClick={() => { window.location.href = '/cart' }}
                    className="flex-1 px-4 py-2.5 bg-ed-accent text-white text-sm font-bold rounded-lg hover:bg-ed-accent-hover transition-colors"
                  >
                    View Cart
                  </button>
                </div>
              </div>
            ) : (
              /* Configuration State */
              <>
                {/* Product Info */}
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {canvas && (
                      <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-white flex-shrink-0">
                        <img
                          src={canvas.toDataURL({ format: 'png', multiplier: 0.15 })}
                          alt="Design"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {template?.name ?? (designName || 'Custom Design')}
                      </p>
                      {template && (
                        <p className="text-xs text-gray-500">
                          {template.print_width_mm} x {template.print_height_mm}mm
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {template?.product_group?.name ?? 'Custom Sticker'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div className="px-5 py-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCartQuantity(Math.max(10, cartQuantity - 10))}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        type="number"
                        value={cartQuantity}
                        onChange={(e) => setCartQuantity(Math.max(1, Number(e.target.value) || 1))}
                        className="flex-1 text-center text-lg font-bold border border-gray-200 rounded-lg py-2 focus:ring-2 focus:ring-ed-accent/30 focus:border-ed-accent outline-none"
                        min={1}
                      />
                      <button
                        onClick={() => setCartQuantity(cartQuantity + 10)}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {/* Quick quantity buttons */}
                    <div className="flex gap-2 mt-2">
                      {[25, 50, 100, 250, 500, 1000].map((qty) => (
                        <button
                          key={qty}
                          onClick={() => setCartQuantity(qty)}
                          className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                            cartQuantity === qty
                              ? 'bg-ed-accent/10 border-ed-accent/30 text-ed-accent font-bold'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Unit price</span>
                      <span className="font-medium text-gray-700">{CURRENCY_SYMBOL}{getUnitPrice(cartQuantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal ({cartQuantity} units)</span>
                      <span className="font-medium text-gray-700">{CURRENCY_SYMBOL}{(getUnitPrice(cartQuantity) * cartQuantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">VAT ({(VAT_RATE * 100).toFixed(0)}%)</span>
                      <span className="font-medium text-gray-700">{CURRENCY_SYMBOL}{(getUnitPrice(cartQuantity) * cartQuantity * VAT_RATE).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-gray-900 text-lg">
                        {CURRENCY_SYMBOL}{(getUnitPrice(cartQuantity) * cartQuantity * (1 + VAT_RATE)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {cartQuantity >= 50 && (
                    <p className="text-xs text-green-600 text-center font-medium">
                      {cartQuantity >= 1000 ? '35% volume discount applied!' :
                       cartQuantity >= 500 ? '28% volume discount applied!' :
                       cartQuantity >= 250 ? '22% volume discount applied!' :
                       cartQuantity >= 100 ? '15% volume discount applied!' :
                       '8% volume discount applied!'}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAddToCart}
                    disabled={addingToCart}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-ed-accent to-ed-accent-hover text-white text-sm font-bold rounded-lg hover:from-ed-accent-hover hover:to-ed-accent disabled:opacity-50 transition-all"
                  >
                    {addingToCart ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={16} />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
