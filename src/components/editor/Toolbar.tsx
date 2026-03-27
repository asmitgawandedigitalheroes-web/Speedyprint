'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import {
  ArrowLeft,
  Undo2,
  Redo2,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
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
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { exportJSON, exportPNG, exportSVG, loadJSON } from '@/lib/editor/fabricUtils'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/hooks/useCart'
import { useIsMobile } from '@/hooks/useIsMobile'
import { CURRENCY_SYMBOL, VAT_RATE } from '@/lib/utils/constants'
import type { ProductTemplate } from '@/types'

export default function Toolbar() {
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'unsaved' | 'saving' | 'saved'>('unsaved')
  const [designName, setDesignName] = useState('Untitled Design')
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
  const addItem = useCart((s) => s.addItem)

  const noCanvas = !canvas
  const groupName = template?.product_group?.name ?? template?.name ?? null

  useEffect(() => {
    if (!template?.product_group_id) {
      setSiblingTemplates([])
      return
    }

    const supabase = createClient()
    supabase
      .from('product_templates')
      .select('*, product_group:product_groups(*)')
      .eq('product_group_id', template.product_group_id)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data && data.length > 1) {
          setSiblingTemplates(data as unknown as ProductTemplate[])
        } else {
          setSiblingTemplates([])
        }
      })
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

      if (designId) {
        await fetch(`/api/designs/${designId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        const res = await fetch('/api/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data?.id) setDesignId(data.id)
      }
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
      setSaveStatus('saved')
    }
  }, [canvas, template, designId, setDesignId, designName])

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
      alert('Default design saved successfully!')
    } catch (err) {
      console.error('Save as default failed:', err)
      alert('Failed to save default design. Check console for details.')
    } finally {
      setSaving(false)
      setSaveStatus('saved')
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
        if (currentDesignId) {
          await fetch(`/api/designs/${currentDesignId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        } else {
          const res = await fetch('/api/designs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const data = await res.json()
          if (data?.id) useEditorStore.getState().setDesignId(data.id)
        }
        setSaveStatus('saved')
      } catch {
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
    const markUnsaved = () => setSaveStatus('unsaved')
    canvas.on('object:modified', markUnsaved)
    canvas.on('object:added', markUnsaved)
    canvas.on('object:removed', markUnsaved)
    return () => {
      canvas.off('object:modified', markUnsaved)
      canvas.off('object:added', markUnsaved)
      canvas.off('object:removed', markUnsaved)
    }
  }, [canvas])

  const handleExport = useCallback(() => {
    if (!canvas) return
    const dataUrl = exportPNG(canvas)
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${designName || 'design'}.png`
    a.click()
  }, [canvas, designName])

  const handlePreview = useCallback(() => {
    if (!canvas) return
    const dataUrl = exportPNG(canvas)
    const win = window.open()
    if (win) {
      win.document.write(`<img src="${dataUrl}" style="max-width:100%;background:#f1f5f9"/>`)
    }
  }, [canvas])

  const handleExportPDF = useCallback(async () => {
    if (!canvas) return
    try {
      const canvasJson = JSON.parse(exportJSON(canvas))
      // Remove the artboard rect from PDF export (it's just the white background)
      if (canvasJson.objects?.length) {
        // Keep the artboard as a white background but filter guides
        canvasJson.objects = canvasJson.objects.filter(
          (o: Record<string, unknown>) => !o.isGuide
        )
      }
      const printSpecs = template
        ? {
            print_width_mm: template.print_width_mm,
            print_height_mm: template.print_height_mm,
            bleed_mm: template.bleed_mm || 0,
          }
        : { print_width_mm: 210, print_height_mm: 297, bleed_mm: 0 }

      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvas_json: canvasJson, print_specs: printSpecs }),
      })

      if (!res.ok) throw new Error('PDF export failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${designName || 'design'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
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
    setCartAdded(false)
    setShowCartModal(true)
  }, [canvas])

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

      if (designId) {
        await fetch(`/api/designs/${designId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        const res = await fetch('/api/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data?.id) {
          savedDesignId = data.id
          setDesignId(data.id)
        }
      }

      const unitPrice = getUnitPrice(cartQuantity)

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
        },
        design_id: savedDesignId ?? undefined,
        thumbnail_url: thumbnailUrl,
      })

      setCartAdded(true)
    } catch (err) {
      console.error('Add to cart failed:', err)
    } finally {
      setAddingToCart(false)
    }
  }, [canvas, designId, designName, template, cartQuantity, setDesignId, addItem, getUnitPrice])

  const iconBtn = 'p-1.5 text-ed-text-muted hover:text-ed-text hover:bg-ed-surface-hover rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95'
  const ghostBtn = 'flex items-center gap-1.5 px-3 py-1.5 border border-ed-border text-ed-text-muted text-xs font-medium rounded-md hover:text-ed-text hover:border-ed-border-light hover:bg-ed-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors'

  const isMobile = useIsMobile()

  return (
    <div className="h-11 bg-ed-surface border-b border-ed-border flex items-center px-3 gap-1 flex-shrink-0">
      {/* LEFT: Back + Breadcrumb + Name + Status */}
      <div className="flex items-center gap-2 min-w-0 flex-1 lg:flex-none">
        <button onClick={() => window.history.back()} title="Back" className={iconBtn}>
          <ArrowLeft size={16} />
        </button>
        
        {!isMobile && groupName && (
          <>
            <span className="text-xs text-ed-text-dim whitespace-nowrap">{groupName}</span>
            <span className="text-xs text-ed-border-light">/</span>
          </>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center min-w-0">
          <input
            type="text"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            className="text-sm font-semibold text-ed-text bg-transparent border-none outline-none min-w-[80px] max-w-[120px] lg:max-w-[180px] hover:bg-ed-surface-hover focus:bg-ed-surface-hover px-2 py-0.5 rounded-md transition-all truncate"
            placeholder="Untitled"
          />
          
          {/* Save status - always show but minimal on mobile */}
          <span className="flex items-center gap-1 ml-1 scale-75 origin-left lg:scale-100">
            <span className={`w-1.5 h-1.5 rounded-full ${
              saveStatus === 'saving' || saving ? 'bg-blue-400 animate-pulse' :
              saveStatus === 'saved' ? 'bg-emerald-400' : 'bg-amber-400'
            }`} />
            <span className="text-[10px] text-ed-text-dim hidden lg:inline">
              {saving || saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
            </span>
          </span>
        </div>
      </div>

      {/* CENTER: Undo/Redo + Zoom (Desktop Only, or hidden on mobile) */}
      {!isMobile && (
        <div className="flex-1 flex items-center justify-center gap-0.5">
          <button onClick={undo} disabled={noCanvas} title="Undo (Ctrl+Z)" className={iconBtn}>
            <Undo2 size={15} />
          </button>
          <button onClick={redo} disabled={noCanvas} title="Redo (Ctrl+Y)" className={iconBtn}>
            <Redo2 size={15} />
          </button>

          <div className="w-px h-4 bg-ed-border mx-2" />

          <div className="flex items-center bg-ed-bg rounded-md px-1">
            <button onClick={zoomOut} disabled={noCanvas} title="Zoom Out" className={iconBtn}>
              <ZoomOutIcon size={15} />
            </button>
            <span className="text-[11px] text-ed-text-muted font-mono min-w-[3rem] text-center tabular-nums select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={zoomIn} disabled={noCanvas} title="Zoom In" className={iconBtn}>
              <ZoomInIcon size={15} />
            </button>
          </div>
          <button onClick={zoomToFit} disabled={noCanvas} title="Fit to View" className={iconBtn}>
            <Maximize2 size={15} />
          </button>
        </div>
      )}

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-1">
        {!isMobile && (
          <>
            <button onClick={handlePreview} disabled={noCanvas} title="Preview" className={iconBtn}>
              <Eye size={16} />
            </button>
            <div className="w-px h-4 bg-ed-border mx-0.5" />
            <button onClick={handleSave} disabled={noCanvas || saving} title="Save Design" className={ghostBtn}>
              <Save size={14} />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={handleExport} disabled={noCanvas} title="Export PNG" className={ghostBtn}>
              <Download size={14} />
              Export
            </button>
          </>
        )}
        
        {/* Shopping Cart - always visible */}
        <button
          onClick={handleOpenCartModal}
          disabled={noCanvas}
          title="Add to Cart"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-md hover:bg-brand-primary-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-primary/20 active:scale-95 whitespace-nowrap lg:px-4"
        >
          <ShoppingCart size={14} />
          <span className={isMobile ? 'hidden sm:inline' : ''}>Add to Cart</span>
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
