'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAuth } from '@/hooks/useAuth'
import { loadJSON } from '@/lib/editor/fabricUtils'
import { toast } from 'sonner'
import type { ProductTemplate, Design } from '@/types'
import type { Canvas as FabricCanvas } from 'fabric'

// After loadJSON replaces all canvas objects, ensure the artboard rect matches
// the current template dimensions (important when a custom size overrides defaults).
function fixArtboardAfterLoad(canvas: FabricCanvas) {
  const { canvasDimensions, setArtboardSize } = useEditorStore.getState()
  if (!canvasDimensions) return

  const artboardW = canvasDimensions.widthPx
  const artboardH = canvasDimensions.heightPx

  const artboard = canvas.getObjects().find(
    (o) => (o as unknown as Record<string, unknown>).isArtboard
  )
  if (!artboard) return

  artboard.set({ left: 0, top: 0, width: artboardW, height: artboardH })
  artboard.setCoords()

  // Remove guide objects serialised at old dimensions — print-boundaries effect will redraw them
  canvas.getObjects()
    .filter((o) => !!(o as unknown as Record<string, unknown>).isGuide)
    .forEach((g) => canvas.remove(g))

  setArtboardSize(artboardW, artboardH)

  const containerW = canvas.getWidth()
  const containerH = canvas.getHeight()
  const newZoom = Math.min(
    (containerW * 0.65) / artboardW,
    (containerH * 0.65) / artboardH
  )

  const objCenter = artboard.getCenterPoint()
  const vpt = canvas.viewportTransform
  if (vpt) {
    vpt[0] = newZoom
    vpt[3] = newZoom
    vpt[4] = (containerW / 2) - (objCenter.x * newZoom)
    vpt[5] = (containerH / 2) - (objCenter.y * newZoom)
    canvas.setViewportTransform(vpt)
  }
  useEditorStore.setState({ zoom: newZoom })
}

const EditorCanvas = dynamic(() => import('./Canvas'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-ed-canvas" />,
})

const Toolbar = dynamic(() => import('./Toolbar'), { ssr: false })
const Sidebar = dynamic(() => import('./Sidebar'), { ssr: false })
const LeftSidebar = dynamic(() => import('./LeftSidebar'), { ssr: false })
const StatusBar = dynamic(() => import('./StatusBar'), { ssr: false })
import { MobileBottomBar } from './MobileBottomBar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

function SkeletonBox({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-ed-surface/60 animate-pulse rounded ${className ?? ''}`} style={style} />
}

function EditorSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-ed-bg overflow-hidden">
      {/* Toolbar — breadcrumb left, title centre, icon buttons + Save/Export/AddToCart right */}
      <div className="h-11 border-b border-ed-border bg-ed-surface flex items-center gap-2 px-3 shrink-0">
        <SkeletonBox className="w-28 h-5 rounded" />
        <SkeletonBox className="w-px h-5 rounded-none" />
        <SkeletonBox className="w-36 h-5 rounded" />
        <div className="flex-1" />
        <SkeletonBox className="w-7 h-7 rounded" />
        <SkeletonBox className="w-7 h-7 rounded" />
        <SkeletonBox className="w-7 h-7 rounded" />
        <SkeletonBox className="w-7 h-7 rounded" />
        <SkeletonBox className="w-px h-5 rounded-none mx-1" />
        <SkeletonBox className="w-16 h-7 rounded-md" />
        <SkeletonBox className="w-20 h-7 rounded-md" />
        <SkeletonBox className="w-24 h-7 rounded-md" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left icon rail — narrow, icon + label for each tool */}
        <div className="w-14 border-r border-ed-border bg-ed-surface flex flex-col items-center gap-0 py-2 shrink-0">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-2 w-full px-1">
              <SkeletonBox className="w-5 h-5 rounded" />
              <SkeletonBox className="w-9 h-2 rounded" />
            </div>
          ))}
        </div>

        {/* Canvas — checkered background matching actual editor */}
        <div
          className="flex-1 flex items-center justify-center"
          style={{
            backgroundImage:
              'repeating-conic-gradient(#b0b0b0 0% 25%, #c8c8c8 0% 50%)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* Artboard placeholder */}
          <div className="bg-white shadow-2xl" style={{ width: '42%', aspectRatio: '1 / 1' }} />
        </div>

        {/* Right sidebar — PREVIEW / BACKGROUND / CMYK COLOURS sections */}
        <div className="w-64 border-l border-ed-border bg-ed-surface flex flex-col gap-0 shrink-0 overflow-hidden">
          {/* PREVIEW section */}
          <div className="p-3 border-b border-ed-border">
            <SkeletonBox className="w-16 h-3 rounded mb-3" />
            <SkeletonBox className="w-full rounded" style={{ aspectRatio: '1 / 1' }} />
          </div>
          {/* BACKGROUND section */}
          <div className="p-3 border-b border-ed-border">
            <SkeletonBox className="w-24 h-3 rounded mb-3" />
            <div className="flex items-center gap-2">
              <SkeletonBox className="w-8 h-8 rounded" />
              <SkeletonBox className="flex-1 h-8 rounded" />
            </div>
          </div>
          {/* CMYK COLOURS section */}
          <div className="p-3">
            <SkeletonBox className="w-28 h-3 rounded mb-3" />
            <div className="grid grid-cols-6 gap-1">
              {[...Array(30)].map((_, i) => (
                <SkeletonBox key={i} className="w-full rounded" style={{ aspectRatio: '1 / 1' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status bar — object count + coords left, zoom right */}
      <div className="h-7 border-t border-ed-border bg-ed-surface flex items-center gap-3 px-3 shrink-0">
        <SkeletonBox className="w-16 h-3 rounded" />
        <SkeletonBox className="w-24 h-3 rounded" />
        <div className="flex-1" />
        <SkeletonBox className="w-10 h-3 rounded" />
        <SkeletonBox className="w-10 h-3 rounded" />
      </div>
    </div>
  )
}

interface EditorShellProps {
  templateId?: string
  designId?: string
  mode?: 'upload'
}

export default function EditorShell({ templateId, designId, mode }: EditorShellProps) {
  const [error, setError] = useState<{ type: 'template' | 'design'; message: string } | null>(null)
  const [loading, setLoading] = useState(!!templateId || !!designId)

  const setTemplate = useEditorStore((s) => s.setTemplate)
  const setDesign = useEditorStore((s) => s.setDesign)
  const setDesignId = useEditorStore((s) => s.setDesignId)
  const saveTemplateOverride = useEditorStore((s) => s.saveTemplateOverride)
  const canvas = useEditorStore((s) => s.canvas)
  const template = useEditorStore((s) => s.template)
  const isMobile = useIsMobile()
  const activeObject = useEditorStore((s) => s.activeObject)
  const leftPanel = useEditorStore((s) => s.leftPanel)
  const setLeftPanel = useEditorStore((s) => s.setLeftPanel)
  const setDesignName = useEditorStore((s) => s.setDesignName)
  const { isAuthenticated } = useAuth()

  const [leftSheetOpen, setLeftSheetOpen] = useState(false)
  const [rightSheetOpen, setRightSheetOpen] = useState(false)

  const saveStatus = useEditorStore((s) => s.saveStatus)

  // Sync left panel state with mobile sheet
  useEffect(() => {
    if (isMobile) {
      setLeftSheetOpen(!!leftPanel)
    }
  }, [leftPanel, isMobile])

  // Handle 'upload' mode intent
  useEffect(() => {
    if (mode === 'upload') {
      // Auto-open 'My Uploads' panel
      setLeftPanel('my')
    }
  }, [mode, setLeftPanel])

  // Browser navigation guard: warn if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault()
        e.returnValue = '' // Standard browser prompt
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveStatus])

  const handleOpenPanel = (panel: 'left' | 'right' | 'layers' | 'template' | 'text' | 'material' | 'my') => {
    if (panel === 'left') {
      if (!leftPanel || leftPanel === 'layers') setLeftPanel('template')
      setLeftSheetOpen(true)
    } else if (panel === 'template' || panel === 'text' || panel === 'material' || panel === 'my') {
      setLeftPanel(panel)
      setLeftSheetOpen(true)
    } else if (panel === 'layers') {
      setLeftPanel('layers')
      setLeftSheetOpen(true)
    } else if (panel === 'right') {
      setRightSheetOpen(true)
    }
  }

  useEffect(() => {
    if (!templateId) return

    const supabase = createClient()

    async function fetchTemplate() {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('product_templates')
        .select('*, product_group:product_groups(*), parameters:template_parameters(*)')
        .eq('id', templateId)
        .eq('is_active', true)
        .single()

      if (err || !data) {
        setError({ type: 'template', message: 'The template you requested could not be found. It may have been removed or is no longer available.' })
        setLoading(false)
        return
      }

      // Apply custom width/height (mm) chosen on the product page, if any.
      // These are saved in sessionStorage by ProductConfigurator before navigating here.
      let templateToUse = data as unknown as ProductTemplate
      try {
        const raw = sessionStorage.getItem(`speedy_params_${templateId}`)
        if (raw) {
          const { params } = JSON.parse(raw) as { params: Record<string, unknown> }
          const customW = params?.width_mm ? Number(params.width_mm) : null
          const customH = params?.height_mm ? Number(params.height_mm) : null
          if (customW && customH && customW > 0 && customH > 0) {
            templateToUse = { ...templateToUse, print_width_mm: customW, print_height_mm: customH }
          }
        }
      } catch {
        // sessionStorage unavailable or malformed — use template defaults
      }

      setTemplate(templateToUse)
      // Immediately persist the (possibly custom-sized) template so it survives template switches
      saveTemplateOverride(templateToUse)
      setLoading(false)
    }

    fetchTemplate()

    return () => {
      setTemplate(null)
      setDesign(null)
      setDesignId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId])

  useEffect(() => {
    if (!designId) return

    const supabase = createClient()

    async function fetchDesign() {
      const { data, error: err } = await supabase
        .from('designs')
        .select('*, product_template:product_templates(*, product_group:product_groups(*))')
        .eq('id', designId)
        .single()

      if (err || !data) {
        setError({ type: 'design', message: 'The saved design could not be loaded. It may have been deleted or you may not have permission to access it.' })
        return
      }

      const design = data as unknown as Design
      setDesign(design)
      setDesignId(design.id)

      if (design.product_template) {
        setTemplate(design.product_template)
      }
    }

    fetchDesign()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designId])

  const design = useEditorStore((s) => s.design)

  useEffect(() => {
    if (!canvas || !design?.canvas_json) return

    const json = typeof design.canvas_json === 'string'
      ? design.canvas_json
      : JSON.stringify(design.canvas_json)

    useEditorStore.setState({ isRestoring: true })
    loadJSON(canvas, json).then(() => {
      // Re-mark first object as artboard (custom props are lost during JSON serialization)
      const objs = canvas.getObjects()
      if (objs.length > 0) {
        ;(objs[0] as unknown as Record<string, unknown>).isArtboard = true
        // Make artboard non-selectable
        objs[0].set({ selectable: false, evented: false, hoverCursor: 'default' })
      }
      fixArtboardAfterLoad(canvas)
      canvas.renderAll()
      useEditorStore.setState({ isRestoring: false })
      useEditorStore.getState().refreshObjects()
    })
  }, [canvas, design])

  // Handle restoration of pending design after login
  useEffect(() => {
    if (!canvas || !isAuthenticated) return

    const pending = localStorage.getItem('sp_pending_design')
    if (pending) {
      try {
        const { canvas_json, name, product_template_id } = JSON.parse(pending)
        
        // Safety check: ensure template matches if it was a template-specific design
        if (product_template_id && templateId && product_template_id !== templateId) {
          // If template mismatched, we might want to warn, but for now we'll load it 
          // as most designs are cross-compatible in our fabric setup
        }

        useEditorStore.setState({ isRestoring: true })
        loadJSON(canvas, JSON.stringify(canvas_json)).then(() => {
          const objs = canvas.getObjects()
          if (objs.length > 0) {
            ;(objs[0] as unknown as Record<string, unknown>).isArtboard = true
            objs[0].set({ selectable: false, evented: false, hoverCursor: 'default' })
          }
          canvas.renderAll()
          setDesignName(name)
          useEditorStore.setState({ isRestoring: false })
          useEditorStore.getState().refreshObjects()
          
          toast.success("Welcome back! Your unsaved design has been restored.")
          localStorage.removeItem('sp_pending_design')
        })
      } catch (e) {
        console.error('Failed to restore pending design:', e)
        localStorage.removeItem('sp_pending_design')
      }
    }
  }, [canvas, isAuthenticated, templateId, setDesignName])

  // Load default design from template if no saved design exists
  useEffect(() => {
    // Only load default if:
    // 1. Canvas is ready
    // 2. We aren't already loading a saved design (designId)
    // 3. We aren't currently restoring a pending design
    // 4. There is no pending design in localStorage
    if (!canvas || designId || !template?.template_json) return
    if (localStorage.getItem('sp_pending_design')) return

    const tj = template.template_json as Record<string, any>
    const defaultJson = tj.default_canvas_json || (tj.objects ? tj : null)
    if (!defaultJson) return

    const json = typeof defaultJson === 'string'
      ? defaultJson
      : JSON.stringify(defaultJson)

    // Only load if canvas is essentially empty (only artboard)
    const currentObjs = canvas.getObjects()
    if (currentObjs.length > 1) return

    useEditorStore.setState({ isRestoring: true })
    loadJSON(canvas, json).then(() => {
      const objs = canvas.getObjects()
      if (objs.length > 0) {
        ;(objs[0] as unknown as Record<string, unknown>).isArtboard = true
        objs[0].set({ selectable: false, evented: false, hoverCursor: 'default' })
      }
      canvas.renderAll()
      useEditorStore.setState({ isRestoring: false })
      useEditorStore.getState().refreshObjects()
    })
  }, [canvas, template, designId])

  if (loading && !template) {
    return <EditorSkeleton />
  }

  if (error) {
    const isDesignError = error.type === 'design'
    return (
      <div className="h-screen flex items-center justify-center bg-ed-bg">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">{isDesignError ? '📄' : '😕'}</div>
          <h2 className="text-xl font-semibold text-ed-text mb-2">
            {isDesignError ? 'Design not found' : 'Template not found'}
          </h2>
          <p className="text-sm text-ed-text-muted mb-4">{error.message}</p>
          <a
            href={isDesignError ? '/account/designs' : '/products'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ed-accent text-white rounded-md text-sm hover:bg-ed-accent-hover transition-colors"
          >
            {isDesignError ? 'My Designs' : 'Browse Products'}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-ed-bg overflow-hidden relative">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden relative">
        {!isMobile && <LeftSidebar />}
        
        <EditorCanvas />
        
        {!isMobile && <Sidebar />}

        {/* Mobile Sidebars inside Sheets */}
        {isMobile && (
          <>
            <Sheet open={leftSheetOpen} onOpenChange={(open) => {
              setLeftSheetOpen(open)
              if (!open) setLeftPanel(null)
            }}>
              <SheetContent side="left" className="p-0 w-[90%] max-w-[360px] border-r-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Editor Tools</SheetTitle>
                  <SheetDescription>Access templates, elements, and other design tools.</SheetDescription>
                </SheetHeader>
                <div className="h-full pt-10">
                   <LeftSidebar />
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={rightSheetOpen} onOpenChange={setRightSheetOpen}>
              <SheetContent side="bottom" className="p-0 h-[80vh] rounded-t-2xl">
                <SheetHeader className="sr-only">
                  <SheetTitle>Object Properties</SheetTitle>
                  <SheetDescription>Modify the properties of the selected object.</SheetDescription>
                </SheetHeader>
                <div className="h-full pt-10">
                   <Sidebar />
                </div>
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>
      
      {!isMobile && <StatusBar />}
      {isMobile && (
        <MobileBottomBar 
          onOpenPanel={handleOpenPanel} 
          isObjectSelected={!!activeObject} 
        />
      )}
    </div>
  )
}
