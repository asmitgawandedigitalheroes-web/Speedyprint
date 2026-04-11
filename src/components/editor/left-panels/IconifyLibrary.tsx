'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, ChevronLeft, Loader2, Grid3X3, Star } from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { addImageFromURL } from '@/lib/editor/fabricUtils'

/* ─────────────────────────────────────────────
   Iconify – proxied through /api/iconify
   to avoid CORS issues in the browser
───────────────────────────────────────────── */

const PROXY = '/api/iconify'

interface IconResult {
  prefix: string
  name: string  // full: "prefix:name"
}

async function searchIcons(query: string, limit = 96): Promise<IconResult[]> {
  const res = await fetch(
    `${PROXY}?path=search&query=${encodeURIComponent(query)}&limit=${limit}`
  )
  if (!res.ok) return []
  const json = await res.json()
  return (json.icons || []).map((id: string) => {
    const [prefix, ...rest] = id.split(':')
    return { prefix, name: id, short: rest.join(':') }
  })
}

async function fetchCollectionIcons(prefix: string, fallbackQuery: string, limit = 96): Promise<IconResult[]> {
  try {
    const res = await fetch(`${PROXY}?path=collection&prefix=${prefix}`)
    if (!res.ok) throw new Error('collection fetch failed')
    const json = await res.json()

    // Iconify collection API can return names in several places
    const uncategorized: string[] = Array.isArray(json.uncategorized) ? json.uncategorized : []
    const categorized: string[] = json.categories
      ? (Object.values(json.categories) as string[][]).flat()
      : []
    // Some collections put icon names directly in an "icons" array
    const direct: string[] = Array.isArray(json.icons) ? json.icons : []

    const all = [...new Set([...direct, ...uncategorized, ...categorized])].slice(0, limit)

    if (all.length > 0) {
      return all.map((name: string) => ({ prefix, name: `${prefix}:${name}`, short: name }))
    }
  } catch {
    // fall through to search fallback
  }

  // Fallback: use search API with the category query term
  return searchIcons(fallbackQuery, limit)
}

function getIconSvgUrl(iconId: string, color = '000000'): string {
  // iconId = "prefix:name" → proxy path = "prefix/name.svg"
  const [prefix, ...rest] = iconId.split(':')
  const name = rest.join(':')
  return `${PROXY}?path=${prefix}/${name}.svg&color=%23${color}`
}

/* ─── Curated categories ─── */
const CATEGORIES = [
  { id: 'shapes',     label: 'Shapes & Geometric',  query: 'shape',      icon: '⬡' },
  { id: 'stars',      label: 'Stars & Badges',       query: 'star',       icon: '⭐' },
  { id: 'arrows',     label: 'Arrows',               query: 'arrow',      icon: '→' },
  { id: 'flower',     label: 'Nature & Plants',      query: 'flower',     icon: '🌿' },
  { id: 'sports',     label: 'Sports & Events',      query: 'trophy',     icon: '🏆' },
  { id: 'food',       label: 'Food & Drink',         query: 'coffee',     icon: '☕' },
  { id: 'business',   label: 'Business',             query: 'business',   icon: '💼' },
  { id: 'frame',      label: 'Frames & Borders',     query: 'frame',      icon: '🎨' },
  { id: 'smile',      label: 'Emoji & Faces',        query: 'smile',      icon: '😊' },
  { id: 'animals',    label: 'Animals & Pets',       query: 'animal',     icon: '🐾' },
  { id: 'car',        label: 'Transport & Travel',   query: 'car',        icon: '🚗' },
  { id: 'tech',       label: 'Tech & Digital',       query: 'phone',      icon: '💻' },
]

/* ─── Color options ─── */
const ICON_COLORS = [
  { label: 'Black', value: '000000' },
  { label: 'White', value: 'FFFFFF' },
  { label: 'Red', value: 'E53E3E' },
  { label: 'Blue', value: '3182CE' },
  { label: 'Green', value: '38A169' },
  { label: 'Gold', value: 'D69E2E' },
  { label: 'Orange', value: 'DD6B20' },
  { label: 'Purple', value: '805AD5' },
]

/* ─── Main component ─── */
export default function IconifyLibrary({ onClose }: { onClose: () => void }) {
  const canvas = useEditorStore((s) => s.canvas)

  const [view, setView] = useState<'categories' | 'grid'>('categories')
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[0] | null>(null)
  const [icons, setIcons] = useState<IconResult[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [iconColor, setIconColor] = useState('000000')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search])

  // Load icons when search changes
  useEffect(() => {
    if (!debouncedSearch) {
      if (activeCategory) loadCategory(activeCategory)
      return
    }
    setLoading(true)
    searchIcons(debouncedSearch, 96)
      .then(setIcons)
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const loadCategory = useCallback(async (cat: typeof CATEGORIES[0]) => {
    setLoading(true)
    setIcons([])
    try {
      const results = await searchIcons(cat.query, 96)
      setIcons(results)
    } finally {
      setLoading(false)
    }
  }, [])

  const openCategory = useCallback((cat: typeof CATEGORIES[0]) => {
    setActiveCategory(cat)
    setView('grid')
    setSearch('')
    setDebouncedSearch('')
    loadCategory(cat)
  }, [loadCategory])

  const handleAdd = useCallback(async (icon: IconResult) => {
    if (!canvas) return
    setAdding(icon.name)
    try {
      const url = getIconSvgUrl(icon.name, iconColor)
      await addImageFromURL(canvas, url, 0.5)
    } catch {
      /* silent */
    } finally {
      setAdding(null)
    }
  }, [canvas, iconColor])

  /* ── Header shared ── */
  const Header = (
    <div className="px-3 pt-3 pb-2 border-b border-ed-border">
      <div className="flex items-center gap-2 mb-2.5">
        <button
          onClick={() => {
            if (view === 'grid' && !debouncedSearch) {
              setView('categories')
              setActiveCategory(null)
              setIcons([])
            } else if (debouncedSearch) {
              setSearch('')
              setDebouncedSearch('')
              if (activeCategory) {
                loadCategory(activeCategory)
              } else {
                setView('categories')
              }
            } else {
              onClose()
            }
          }}
          className="p-1 rounded hover:bg-ed-surface-hover text-ed-text-dim transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-ed-text leading-tight">
            {debouncedSearch
              ? `Results for "${debouncedSearch}"`
              : activeCategory
              ? activeCategory.label
              : 'Element Library'}
          </h2>
          <p className="text-[10px] text-ed-text-dim">200,000+ free icons & elements</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-2">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ed-text-dim" />
        <input
          type="text"
          placeholder="Search icons, shapes, symbols..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full !pl-8 pr-3 py-1.5 editor-input text-xs"
        />
      </div>

      {/* Color picker row */}
      {view === 'grid' && (
        <div className="flex items-center gap-1.5 py-1">
          <span className="text-[10px] text-ed-text-dim shrink-0">Colour:</span>
          {ICON_COLORS.map((c) => (
            <button
              key={c.value}
              title={c.label}
              onClick={() => setIconColor(c.value)}
              className={`h-5 w-5 rounded-full border-2 transition-all ${
                iconColor === c.value ? 'border-ed-accent scale-110' : 'border-ed-border hover:border-ed-text-dim'
              }`}
              style={{ backgroundColor: `#${c.value}` }}
            />
          ))}
        </div>
      )}
    </div>
  )

  /* ── Category list ── */
  if (view === 'categories' && !debouncedSearch) {
    return (
      <div className="flex flex-col h-full">
        {Header}
        <div className="flex-1 overflow-y-auto px-3 py-3 editor-scrollbar">
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => openCategory(cat)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-ed-border bg-ed-surface hover:border-ed-accent/50 hover:bg-ed-accent/5 transition-all group"
              >
                <span className="text-2xl leading-none">{cat.icon}</span>
                <span className="text-[10px] font-medium text-ed-text text-center leading-tight group-hover:text-ed-accent transition-colors">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-4 text-[10px] text-ed-text-dim text-center leading-relaxed px-2">
            Powered by Iconify — 200,000+ free icons from 100+ open-source icon sets
          </p>
        </div>
      </div>
    )
  }

  /* ── Icons grid ── */
  return (
    <div className="flex flex-col h-full">
      {Header}

      <div className="flex-1 overflow-y-auto px-3 pb-4 editor-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 size={20} className="animate-spin text-ed-accent" />
            <span className="text-xs text-ed-text-dim">Loading elements...</span>
          </div>
        ) : icons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <Grid3X3 size={24} className="text-ed-text-dim" />
            <p className="text-xs text-ed-text-dim">No results found.<br />Try a different search term.</p>
          </div>
        ) : (
          <>
            <p className="text-[10px] text-ed-text-dim mb-2 mt-2">
              {icons.length} elements — click to add to canvas
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {icons.map((icon) => {
                const thumbUrl = getIconSvgUrl(icon.name, iconColor)
                const isAdding = adding === icon.name
                return (
                  <button
                    key={icon.name}
                    onClick={() => handleAdd(icon)}
                    disabled={!!adding}
                    title={icon.name.split(':').pop()?.replace(/-/g, ' ')}
                    className="group relative aspect-square rounded-lg border border-ed-border bg-white hover:border-ed-accent/50 hover:shadow-sm transition-all disabled:opacity-50 overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl}
                      alt={icon.name}
                      className="w-full h-full object-contain p-1.5"
                      loading="lazy"
                    />
                    {isAdding ? (
                      <div className="absolute inset-0 bg-ed-accent/20 flex items-center justify-center">
                        <Loader2 size={12} className="animate-spin text-ed-accent" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-ed-accent/0 group-hover:bg-ed-accent/10 transition-colors" />
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
