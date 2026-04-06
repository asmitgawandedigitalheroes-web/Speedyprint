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

const EditorCanvas = dynamic(() => import('./Canvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-ed-canvas">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-ed-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-ed-text-muted">Loading editor...</p>
      </div>
    </div>
  ),
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

      setTemplate(data as unknown as ProductTemplate)
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
    return (
      <div className="h-screen flex items-center justify-center bg-ed-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-ed-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ed-text-muted">Loading template...</p>
        </div>
      </div>
    )
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
