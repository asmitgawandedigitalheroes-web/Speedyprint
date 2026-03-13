'use client'

import { useEffect, useState, useCallback, useRef, use } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Toolbar } from '@/components/designer/Toolbar'
import { PropertiesPanel } from '@/components/designer/PropertiesPanel'
import { LayersPanel } from '@/components/designer/LayersPanel'
import { useDesigner } from '@/hooks/useDesigner'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { generateThumbnail } from '@/lib/designer/canvas-utils'
import {
  Undo2,
  Redo2,
  Save,
  Eye,
  ShoppingCart,
  Loader2,
  ArrowLeft,
} from 'lucide-react'

// --- Dynamic import of DesignerCanvas (SSR disabled) ---

const DesignerCanvasInner = dynamic(
  () =>
    import('@/components/designer/DesignerCanvas').then(
      (mod) => mod.DesignerCanvasInner
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center bg-muted/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>Loading canvas...</span>
        </div>
      </div>
    ),
  }
)

// --- Page Props ---

interface DesignerPageProps {
  params: Promise<{ templateId: string }>
}

// --- Page Component ---

export default function DesignerPage({ params }: DesignerPageProps) {
  const { templateId } = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const { state, canvasRef, actions } = useDesigner()
  const {
    fetchTemplate,
    restoreFromLocalStorage,
    setSelectedObject,
    markDirty,
    setDesignName,
    saveDesign,
  } = actions

  const [showLayers, setShowLayers] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [initialJson, setInitialJson] = useState<Record<string, unknown> | null>(null)
  const hasFetchedRef = useRef(false)
  const hasRestoredRef = useRef(false)

  // --- Fetch template on mount ---

  useEffect(() => {
    if (templateId && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchTemplate(templateId)
    }
  }, [templateId, fetchTemplate])

  // --- Try to restore from localStorage after template loads ---

  useEffect(() => {
    if (state.template && !hasRestoredRef.current) {
      hasRestoredRef.current = true
      const backup = restoreFromLocalStorage(state.template.id)
      if (backup) {
        setInitialJson(backup)
      }
    }
  }, [state.template, restoreFromLocalStorage])

  // --- Handlers ---

  const handleSelectionChange = useCallback(
    (obj: unknown | null) => {
      setSelectedObject(obj)
    },
    [setSelectedObject]
  )

  const handleCanvasModified = useCallback(() => {
    markDirty()
  }, [markDirty])

  const handleUndo = useCallback(() => {
    canvasRef.current?.undo()
  }, [canvasRef])

  const handleRedo = useCallback(() => {
    canvasRef.current?.redo()
  }, [canvasRef])

  const handleSave = useCallback(async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to save your design')
      router.push('/login')
      return
    }
    try {
      const design = await saveDesign()
      if (design) {
        toast.success('Design saved successfully')
      } else {
        toast.error('Failed to save design')
      }
    } catch {
      toast.error('Failed to save design')
    }
  }, [isAuthenticated, saveDesign, router])

  const handlePreview = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return

    const url = generateThumbnail(canvas, 800)
    setPreviewUrl(url)
    setShowPreview(true)
  }, [canvasRef])

  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to add items to your cart')
      router.push('/login')
      return
    }

    if (!state.template) return

    try {
      // Save the design first
      const design = await saveDesign()
      if (!design) {
        toast.error('Failed to save design before adding to cart')
        return
      }

      // Add to cart
      addItem({
        product_group_id: state.template.product_group_id,
        product_template_id: state.template.id,
        product_name: state.template.product_group?.name || 'Product',
        template_name: state.template.name,
        quantity: 1,
        unit_price: 0, // Price calculated from pricing rules
        selected_params: {},
        design_id: design.id,
        thumbnail_url: design.thumbnail_url || undefined,
      })

      toast.success('Added to cart!')
      router.push('/cart')
    } catch {
      toast.error('Failed to add to cart')
    }
  }, [isAuthenticated, state.template, saveDesign, addItem, router])

  // --- Loading state ---

  if (state.isLoading && !state.template) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-lg text-muted-foreground">Loading template...</span>
        </div>
      </div>
    )
  }

  // --- Error state ---

  if (state.error && !state.template) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{state.error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          Go Back
        </Button>
      </div>
    )
  }

  // --- Template not found ---

  if (!state.template) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Template not found.</p>
        <Button variant="outline" onClick={() => router.push('/')}>
          <ArrowLeft className="size-4" />
          Back to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* --- Top Bar --- */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
        {/* Left: template info */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.back()}
            title="Back"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {state.template.product_group?.name || 'Product'}
            </span>
            <span className="text-xs text-muted-foreground">/</span>
            <Input
              value={state.designName}
              onChange={(e) => setDesignName(e.target.value)}
              className="h-7 w-48 border-none bg-transparent text-sm font-medium shadow-none focus-visible:ring-1"
              placeholder="Design name"
            />
          </div>

          {state.isDirty && (
            <span className="text-xs text-amber-500">Unsaved changes</span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="size-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Save */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={state.isSaving || !state.isDirty}
          >
            {state.isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save
          </Button>

          {/* Preview */}
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="size-4" />
            Preview
          </Button>

          {/* Add to Cart */}
          <Button size="sm" onClick={handleAddToCart}>
            <ShoppingCart className="size-4" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* --- Main Layout --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Toolbar */}
        <Toolbar
          canvasRef={canvasRef}
          onToggleLayers={() => setShowLayers(!showLayers)}
          showLayers={showLayers}
        />

        {/* Layers panel (conditionally shown between toolbar and canvas) */}
        {showLayers && (
          <LayersPanel
            canvasRef={canvasRef}
            selectedObject={state.selectedObject}
            onClose={() => setShowLayers(false)}
          />
        )}

        {/* Center: Canvas */}
        <DesignerCanvasInner
          ref={canvasRef}
          template={state.template}
          initialJson={initialJson}
          onSelectionChange={handleSelectionChange}
          onCanvasModified={handleCanvasModified}
          onSaveRequested={handleSave}
        />

        {/* Right: Properties */}
        <PropertiesPanel
          selectedObject={state.selectedObject}
          canvasRef={canvasRef}
          onObjectModified={handleCanvasModified}
        />
      </div>

      {/* --- Preview Modal --- */}
      {showPreview && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Design Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Close
              </Button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Design preview"
              className="max-h-[80vh] max-w-full rounded border"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {state.template.print_width_mm} x {state.template.print_height_mm} mm
                @ {state.template.dpi || 300} DPI
              </span>
              <span>Bleed: {state.template.bleed_mm}mm | Safe zone: {state.template.safe_zone_mm}mm</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
