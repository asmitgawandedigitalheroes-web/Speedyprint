'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { getCanvasJSON, generateThumbnail } from '@/lib/designer/canvas-utils'
import type { ProductTemplate, Design } from '@/types'

const AUTO_SAVE_INTERVAL = 30_000 // 30 seconds
const LOCAL_STORAGE_KEY = 'sp-designer-backup'

export interface DesignerState {
  template: ProductTemplate | null
  design: Design | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedObject: any | null
  isDirty: boolean
  isSaving: boolean
  isLoading: boolean
  error: string | null
  designName: string
}

export interface DesignerActions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelectedObject: (obj: any | null) => void
  setDesignName: (name: string) => void
  markDirty: () => void
  saveDesign: () => Promise<Design | null>
  loadDesign: (designId: string) => Promise<void>
  fetchTemplate: (templateId: string) => Promise<ProductTemplate | null>
  backupToLocalStorage: () => void
  restoreFromLocalStorage: (templateId: string) => Record<string, unknown> | null
  clearLocalBackup: (templateId: string) => void
}

export interface DesignerCanvasRef {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCanvas: () => any | null
  addText: (options?: Record<string, unknown>) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addImage: (url: string, options?: Record<string, unknown>) => Promise<any>
  addShape: (type: 'rect' | 'circle' | 'line', options?: Record<string, unknown>) => void
  undo: () => void
  redo: () => void
  saveJSON: () => Record<string, unknown>
  loadJSON: (json: Record<string, unknown>) => void
  exportImage: (format?: string) => string
  zoomIn: () => void
  zoomOut: () => void
  zoomFit: () => void
  deleteSelected: () => void
}

export function useDesigner() {
  const { user } = useAuth()
  const canvasRef = useRef<DesignerCanvasRef | null>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [state, setState] = useState<DesignerState>({
    template: null,
    design: null,
    selectedObject: null,
    isDirty: false,
    isSaving: false,
    isLoading: false,
    error: null,
    designName: 'Untitled Design',
  })

  // --- Setters ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setSelectedObject = useCallback((obj: any | null) => {
    setState((prev) => ({ ...prev, selectedObject: obj }))
  }, [])

  const setDesignName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, designName: name, isDirty: true }))
  }, [])

  const markDirty = useCallback(() => {
    setState((prev) => ({ ...prev, isDirty: true }))
  }, [])

  // --- Template Fetching ---

  const fetchTemplate = useCallback(async (templateId: string): Promise<ProductTemplate | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('product_templates')
        .select('*, product_group:product_groups(*)')
        .eq('id', templateId)
        .single()

      if (error) throw error

      setState((prev) => ({
        ...prev,
        template: data as ProductTemplate,
        isLoading: false,
      }))

      return data as ProductTemplate
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load template'
      setState((prev) => ({ ...prev, error: message, isLoading: false }))
      return null
    }
  }, [])

  // --- Save Design ---

  const saveDesign = useCallback(async (): Promise<Design | null> => {
    if (!user || !state.template || !canvasRef.current) return null

    setState((prev) => ({ ...prev, isSaving: true }))

    try {
      const canvas = canvasRef.current.getCanvas()
      if (!canvas) throw new Error('Canvas not initialized')

      const canvasJson = getCanvasJSON(canvas)
      const thumbnail = generateThumbnail(canvas)

      const body = {
        product_template_id: state.template.id,
        name: state.designName,
        canvas_json: canvasJson,
        thumbnail_url: thumbnail,
      }

      let res: Response

      if (state.design) {
        // Update existing design
        res = await fetch(`/api/designs/${state.design.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        // Create new design
        res = await fetch('/api/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save design')
      }

      const savedDesign = (await res.json()) as Design

      setState((prev) => ({
        ...prev,
        design: savedDesign,
        isDirty: false,
        isSaving: false,
      }))

      // Clear local backup on successful save
      clearLocalBackup(state.template.id)

      return savedDesign
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save design'
      setState((prev) => ({ ...prev, error: message, isSaving: false }))
      return null
    }
  }, [user, state.template, state.design, state.designName])

  // --- Load Design ---

  const loadDesign = useCallback(async (designId: string): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const res = await fetch(`/api/designs/${designId}`)
      if (!res.ok) throw new Error('Failed to load design')

      const design = (await res.json()) as Design

      setState((prev) => ({
        ...prev,
        design,
        designName: design.name,
        isLoading: false,
        isDirty: false,
      }))

      // Load canvas JSON
      if (canvasRef.current && design.canvas_json) {
        canvasRef.current.loadJSON(design.canvas_json)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load design'
      setState((prev) => ({ ...prev, error: message, isLoading: false }))
    }
  }, [])

  // --- Local Storage Backup ---

  const backupToLocalStorage = useCallback(() => {
    if (!state.template || !canvasRef.current) return

    try {
      const canvas = canvasRef.current.getCanvas()
      if (!canvas) return

      const canvasJson = getCanvasJSON(canvas)
      const key = `${LOCAL_STORAGE_KEY}-${state.template.id}`

      localStorage.setItem(
        key,
        JSON.stringify({
          canvasJson,
          designName: state.designName,
          timestamp: Date.now(),
        })
      )
    } catch {
      // Silently fail on localStorage errors
    }
  }, [state.template, state.designName])

  const restoreFromLocalStorage = useCallback(
    (templateId: string): Record<string, unknown> | null => {
      try {
        const key = `${LOCAL_STORAGE_KEY}-${templateId}`
        const data = localStorage.getItem(key)
        if (!data) return null

        const parsed = JSON.parse(data) as {
          canvasJson: Record<string, unknown>
          designName: string
          timestamp: number
        }

        // Only restore if backup is less than 24 hours old
        const maxAge = 24 * 60 * 60 * 1000
        if (Date.now() - parsed.timestamp > maxAge) {
          localStorage.removeItem(key)
          return null
        }

        setState((prev) => ({ ...prev, designName: parsed.designName }))
        return parsed.canvasJson
      } catch {
        return null
      }
    },
    []
  )

  const clearLocalBackup = useCallback((templateId: string) => {
    try {
      const key = `${LOCAL_STORAGE_KEY}-${templateId}`
      localStorage.removeItem(key)
    } catch {
      // Silently fail
    }
  }, [])

  // --- Auto-save Timer ---

  useEffect(() => {
    if (!state.template || !user) return

    autoSaveTimerRef.current = setInterval(() => {
      if (state.isDirty) {
        backupToLocalStorage()
        // Only auto-save to server if we have a design ID
        if (state.design) {
          saveDesign()
        }
      }
    }, AUTO_SAVE_INTERVAL)

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [state.template, state.isDirty, state.design, user, backupToLocalStorage, saveDesign])

  // --- Window event listeners: beforeunload warning + reconnect sync ---
  // Merged into one effect to keep the hook count stable.

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isDirty) {
        e.preventDefault()
        backupToLocalStorage()
      }
    }

    // When the browser comes back online, push any pending changes to the server
    const handleOnline = () => {
      if (state.isDirty && state.design && user) {
        saveDesign()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('online', handleOnline)
    }
  }, [state.isDirty, state.design, user, backupToLocalStorage, saveDesign])

  return {
    state,
    canvasRef,
    actions: {
      setSelectedObject,
      setDesignName,
      markDirty,
      saveDesign,
      loadDesign,
      fetchTemplate,
      backupToLocalStorage,
      restoreFromLocalStorage,
      clearLocalBackup,
    } satisfies DesignerActions,
  }
}
