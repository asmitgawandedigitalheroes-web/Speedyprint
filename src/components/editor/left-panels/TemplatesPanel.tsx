'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEditorStore, computeCanvasDimensions } from '@/lib/editor/useEditorStore'
import type { ProductTemplate, ProductGroup } from '@/types'

/* ───── Color palette for product group cards ───── */

const GROUP_COLORS: Record<string, { bg: string; stroke: string; text: string }> = {}
const PALETTE = [
  { bg: '#EDE7F6', stroke: '#7C4DFF', text: '#7C4DFF' },
  { bg: '#E3F2FD', stroke: '#2196F3', text: '#2196F3' },
  { bg: '#E8F5E9', stroke: '#4CAF50', text: '#4CAF50' },
  { bg: '#FFF3E0', stroke: '#FF9800', text: '#FF9800' },
  { bg: '#FCE4EC', stroke: '#E91E63', text: '#E91E63' },
  { bg: '#F3E5F5', stroke: '#9C27B0', text: '#9C27B0' },
  { bg: '#E0F7FA', stroke: '#00BCD4', text: '#00BCD4' },
  { bg: '#FFF8E1', stroke: '#FFC107', text: '#F57F17' },
  { bg: '#EFEBE9', stroke: '#795548', text: '#795548' },
  { bg: '#E8EAF6', stroke: '#3F51B5', text: '#3F51B5' },
  { bg: '#FBE9E7', stroke: '#E64A19', text: '#E64A19' },
  { bg: '#E0F2F1', stroke: '#00695C', text: '#00695C' },
]

let colorIdx = 0
function getGroupColor(groupId: string) {
  if (!GROUP_COLORS[groupId]) {
    GROUP_COLORS[groupId] = PALETTE[colorIdx % PALETTE.length]
    colorIdx++
  }
  return GROUP_COLORS[groupId]
}

/* ───── SVG preview generator ───── */

function generatePreviewSvg(t: ProductTemplate, color: { stroke: string; text: string }): string {
  const w = t.print_width_mm
  const h = t.print_height_mm
  const isCircle = w === h && (t.name.toLowerCase().includes('circle') || t.name.toLowerCase().includes('round'))
  const isSquare = w === h

  // Scale to fit in 80x80 viewBox with padding
  const maxDim = Math.max(w, h)
  const scale = 56 / maxDim
  const rw = Math.round(w * scale)
  const rh = Math.round(h * scale)
  const rx = Math.round((80 - rw) / 2)
  const ry = Math.round((80 - rh) / 2)

  let shape: string
  if (isCircle) {
    const r = Math.round(rw / 2)
    shape = `<circle cx="40" cy="40" r="${r}" fill="white" stroke="${color.stroke}" stroke-width="2"/>`
  } else {
    shape = `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="3" fill="white" stroke="${color.stroke}" stroke-width="2"/>`
  }

  const label = isCircle
    ? `⌀${w}`
    : isSquare
      ? `${w}×${h}`
      : `${w}×${h}`

  const text = `<text x="40" y="44" text-anchor="middle" fill="${color.text}" font-size="${label.length > 6 ? 7 : 8}" font-weight="bold">${label}</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">${shape}${text}</svg>`
}

/* ───── Component ───── */

interface TemplateWithGroup extends ProductTemplate {
  product_group?: ProductGroup
}

export default function TemplatesPanel() {
  const [search, setSearch] = useState('')
  const [templates, setTemplates] = useState<TemplateWithGroup[]>([])
  const [loading, setLoading] = useState(true)

  const canvas = useEditorStore((s) => s.canvas)
  const setTemplate = useEditorStore((s) => s.setTemplate)

  // Fetch product templates that belong to a product group
  useEffect(() => {
    const supabase = createClient()

    async function fetchTemplates() {
      setLoading(true)
      const { data, error } = await supabase
        .from('product_templates')
        .select('*, product_group:product_groups!inner(*)')
        .eq('is_active', true)
        .eq('product_groups.is_active', true)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setTemplates(data as TemplateWithGroup[])
      }
      setLoading(false)
    }

    fetchTemplates()
  }, [])

  // Filter by search
  const filtered = templates.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      (t.product_group?.name || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    )
  })

  // Group by product_group
  const groupMap = new Map<string, { group: ProductGroup; templates: TemplateWithGroup[] }>()
  for (const t of filtered) {
    if (!t.product_group) continue
    const gid = t.product_group.id
    if (!groupMap.has(gid)) {
      groupMap.set(gid, { group: t.product_group, templates: [] })
    }
    groupMap.get(gid)!.templates.push(t)
  }
  const groups = Array.from(groupMap.values()).sort(
    (a, b) => a.group.display_order - b.group.display_order
  )

  const handleApply = useCallback(
    (tmpl: ProductTemplate) => {
      if (!canvas) return
      setTemplate(tmpl)

      // Compute pixel dimensions and resize the artboard
      const dims = computeCanvasDimensions(tmpl)
      const { setArtboardSize } = useEditorStore.getState()

      // Find artboard object and resize it
      const artboard = canvas.getObjects().find(
        (o) => (o as unknown as Record<string, unknown>).isArtboard
      )
      if (artboard) {
        const maxDisplay = 800
        const scale = Math.min(maxDisplay / dims.widthPx, maxDisplay / dims.heightPx, 1)
        const displayW = Math.round(dims.widthPx * scale)
        const displayH = Math.round(dims.heightPx * scale)

        artboard.set({ width: displayW, height: displayH, fill: '#ffffff' })
        setArtboardSize(displayW, displayH)

        // Re-center the artboard in the viewport
        const canvasW = canvas.getWidth()
        const canvasH = canvas.getHeight()
        const padding = 0.85
        const zoom = Math.min(
          (canvasW * padding) / displayW,
          (canvasH * padding) / displayH,
          1
        )
        canvas.setZoom(zoom)
        const vpLeft = (canvasW - displayW * zoom) / 2
        const vpTop = (canvasH - displayH * zoom) / 2
        canvas.absolutePan({ x: -vpLeft / zoom, y: -vpTop / zoom } as never)
        canvas.renderAll()
      }
    },
    [canvas, setTemplate]
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2">
        <h2 className="text-sm font-semibold text-ed-text mb-3">Product Templates</h2>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ed-text-dim" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-ed-border rounded-lg text-sm focus:outline-none editor-input"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 editor-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-ed-text-dim">
            <Loader2 size={24} className="animate-spin mb-2" />
            <p className="text-xs">Loading templates...</p>
          </div>
        ) : groups.length === 0 ? (
          <p className="text-xs text-ed-text-dim text-center py-8">
            {search ? 'No templates found' : 'No product templates available'}
          </p>
        ) : (
          groups.map(({ group, templates: groupTemplates }) => (
            <div key={group.id} className="mb-5">
              <p className="text-xs font-semibold text-ed-text-dim uppercase tracking-wide mb-2">
                {group.name}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {groupTemplates.map((t) => {
                  const color = getGroupColor(group.id)
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleApply(t)}
                      className="group bg-ed-bg border border-ed-border rounded-lg overflow-hidden hover:border-ed-accent/40 hover:shadow-sm transition-all text-left"
                    >
                      <div
                        className="w-full h-20 flex items-center justify-center"
                        style={{ backgroundColor: color.bg }}
                      >
                        <div
                          className="w-[80%] h-[80%] flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: generatePreviewSvg(t, color) }}
                        />
                      </div>
                      <div className="px-2 py-1.5">
                        <p className="text-[11px] font-medium text-ed-text truncate">{t.name}</p>
                        <p className="text-[9px] text-ed-text-dim">
                          {t.print_width_mm} × {t.print_height_mm} mm
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
