'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { loadJSON } from '@/lib/editor/fabricUtils'
import Toolbar from './Toolbar'
import Sidebar from './Sidebar'
import LeftSidebar from './LeftSidebar'
import StatusBar from './StatusBar'
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

interface EditorShellProps {
  templateId?: string
  designId?: string
}

export default function EditorShell({ templateId, designId }: EditorShellProps) {
  const [error, setError] = useState<{ type: 'template' | 'design'; message: string } | null>(null)
  const [loading, setLoading] = useState(!!templateId || !!designId)

  const setTemplate = useEditorStore((s) => s.setTemplate)
  const setDesign = useEditorStore((s) => s.setDesign)
  const setDesignId = useEditorStore((s) => s.setDesignId)
  const canvas = useEditorStore((s) => s.canvas)
  const template = useEditorStore((s) => s.template)

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

  // Load default design from template if no saved design exists
  useEffect(() => {
    if (!canvas || designId || !template?.template_json) return

    const tj = template.template_json as Record<string, any>
    // Support both direct Fabric JSON or a nested default_canvas_json key
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
    <div className="h-screen flex flex-col bg-ed-bg">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />
        <EditorCanvas />
        <Sidebar />
      </div>
      <StatusBar />
    </div>
  )
}
