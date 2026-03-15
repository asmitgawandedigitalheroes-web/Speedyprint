'use client'

import { useEffect, useState, useCallback, useRef, use } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Toolbar } from '@/components/designer/Toolbar'
import { PropertiesPanel } from '@/components/designer/PropertiesPanel'
import { EditorLayout } from '@/components/designer/EditorLayout'
import { TopBar } from '@/components/designer/TopBar'
import { useDesigner } from '@/hooks/useDesigner'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { generateThumbnail } from '@/lib/designer/canvas-utils'
import { Loader2, ArrowLeft } from 'lucide-react'

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
        unit_price: 0,
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
    <>
      <EditorLayout
        topBar={
          <TopBar
            template={state.template}
            designName={state.designName}
            isDirty={state.isDirty}
            isSaving={state.isSaving}
            isAuthenticated={isAuthenticated}
            onSetDesignName={setDesignName}
            onSave={handleSave}
            onPreview={handlePreview}
            onAddToCart={handleAddToCart}
          />
        }
        leftPanel={
          <Toolbar canvasRef={canvasRef} />
        }
        canvas={
          <DesignerCanvasInner
            ref={canvasRef}
            template={state.template}
            initialJson={initialJson}
            onSelectionChange={handleSelectionChange}
            onCanvasModified={handleCanvasModified}
            onSaveRequested={handleSave}
          />
        }
        rightPanel={
          <PropertiesPanel
            selectedObject={state.selectedObject}
            canvasRef={canvasRef}
            onObjectModified={handleCanvasModified}
          />
        }
      />

      {/* --- Preview Modal --- */}
      {showPreview && previewUrl && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70"
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
    </>
  )
}
