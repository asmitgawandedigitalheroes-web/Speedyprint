'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, ChevronRight, ChevronLeft, Loader2, Download } from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { addImageFromURL } from '@/lib/editor/fabricUtils'

/* ───── Types ───── */

interface StrapiMaterialType {
  id: number
  attributes: {
    name: string
    sort: number
    type: string
  }
}

interface StrapiMaterial {
  id: number
  attributes: {
    name: string
    desc: string | null
    img?: {
      data?: {
        id: number
        attributes: {
          url: string
          width: number
          height: number
          formats?: {
            thumbnail?: { url: string }
            small?: { url: string }
          }
        }
      }
    }
  }
}

/* ───── API helpers (via local proxy) ───── */

async function fetchMaterialTypes(): Promise<StrapiMaterialType[]> {
  const res = await fetch('/api/strapi/materials?endpoint=material-types&pagination[pageSize]=100&sort=sort:asc')
  const json = await res.json()
  return json.data || []
}

async function fetchMaterials(
  typeId: number,
  page = 1,
  pageSize = 24
): Promise<{ items: StrapiMaterial[]; total: number; pageCount: number }> {
  const params = new URLSearchParams({
    endpoint: 'materials',
    'populate': 'img',
    'filters[material_type][id][$eq]': String(typeId),
    'pagination[page]': String(page),
    'pagination[pageSize]': String(pageSize),
    'sort': 'sort:asc',
  })
  const res = await fetch(`/api/strapi/materials?${params}`)
  const json = await res.json()
  return {
    items: json.data || [],
    total: json.meta?.pagination?.total || 0,
    pageCount: json.meta?.pagination?.pageCount || 0,
  }
}

function getThumbUrl(material: StrapiMaterial): string | null {
  const attrs = material.attributes.img?.data?.attributes
  if (!attrs) return null
  if (attrs.formats?.thumbnail?.url) return `https://github.kuaitu.cc${attrs.formats.thumbnail.url}`
  if (attrs.formats?.small?.url) return `https://github.kuaitu.cc${attrs.formats.small.url}`
  return `https://github.kuaitu.cc${attrs.url}`
}

function getFullUrl(material: StrapiMaterial): string | null {
  const attrs = material.attributes.img?.data?.attributes
  if (!attrs) return null
  return `https://github.kuaitu.cc${attrs.url}`
}

/* ───── Translations ───── */

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  '卡通纹理': 'Cartoon Patterns',
  '星点彩带': 'Star Ribbons',
  '吧唧设计': 'Badge Designs',
  '花草纹理': 'Floral Patterns',
  '萌宠印花': 'Cute Pet Prints',
  '卡通印花': 'Cartoon Prints',
  '趣味卡通': 'Fun Cartoons',
  '装饰元素': 'Decorative Elements',
  '标签背景': 'Label Backgrounds',
  '装饰素材': 'Creative Assets',
  '卡通贴图': 'Cartoon Stickers',
  '科技数码': 'Tech & Digital',
  '卡通人物': 'Cartoon Characters',
  '通用素材': 'General Assets',
  '节日边框': 'Holiday Borders',
  '背景底纹': 'Background Patterns',
  '线条元素': 'Line Elements',
  '可爱插画': 'Cute Illustrations',
  '商务办公': 'Business & Office',
  '表情天气': 'Emoji & Weather',
  '贴纸装饰': 'Stickers & Decor',
  '食物饮料': 'Food & Drinks',
  '中国元素': 'Chinese Elements',
  '趣味手势': 'Fun Gestures',
  '轮廓形状': 'Outline Shapes',
  '传统印章': 'Traditional Seals',
  '卡通萌宠': 'Cute Cartoons',
  '植物花朵': 'Plants & Flowers',
  '箭头线条': 'Arrows & Lines',
  '文字标签': 'Text Labels',
}

function translateName(name: string): string {
  return CATEGORY_TRANSLATIONS[name] || name
}

/* ───── Component ───── */

export default function StrapiMaterialsBrowser({ onClose }: { onClose: () => void }) {
  const canvas = useEditorStore((s) => s.canvas)

  const [categories, setCategories] = useState<StrapiMaterialType[]>([])
  const [selectedCategory, setSelectedCategory] = useState<StrapiMaterialType | null>(null)
  const [materials, setMaterials] = useState<StrapiMaterial[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [matLoading, setMatLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [catSearch, setCatSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load categories on mount
  useEffect(() => {
    setCatLoading(true)
    setError(null)
    fetchMaterialTypes()
      .then(setCategories)
      .catch(() => setError('Failed to load categories'))
      .finally(() => setCatLoading(false))
  }, [])

  // Load materials when category selected
  useEffect(() => {
    if (!selectedCategory) {
      setMaterials([])
      return
    }
    setMatLoading(true)
    setPage(1)
    fetchMaterials(selectedCategory.id, 1, 24)
      .then((res) => {
        setMaterials(res.items)
        setTotalPages(res.pageCount)
        setTotalItems(res.total)
      })
      .catch(() => setError('Failed to load materials'))
      .finally(() => setMatLoading(false))
  }, [selectedCategory])

  const loadMore = useCallback(async () => {
    if (!selectedCategory || loadingMore || page >= totalPages) return
    setLoadingMore(true)
    try {
      const next = page + 1
      const res = await fetchMaterials(selectedCategory.id, next, 24)
      setMaterials((prev) => [...prev, ...res.items])
      setPage(next)
    } catch {
      /* silent */
    } finally {
      setLoadingMore(false)
    }
  }, [selectedCategory, loadingMore, page, totalPages])

  const handleAdd = useCallback(
    async (mat: StrapiMaterial) => {
      if (!canvas) return
      const url = getFullUrl(mat)
      if (!url) return
      setAddingId(mat.id)
      try {
        await addImageFromURL(canvas, url, 0.4)
      } catch {
        /* silent */
      } finally {
        setAddingId(null)
      }
    },
    [canvas]
  )

  const filtered = categories.filter(
    (cat) =>
      cat.attributes.name &&
      cat.attributes.name.trim() !== '' &&
      cat.attributes.sort !== undefined &&
      ['pod_only', 'img_only', 'img_pod'].includes(cat.attributes.type?.toLowerCase())
  ).filter(
    (cat) => !catSearch || cat.attributes.name.toLowerCase().includes(catSearch.toLowerCase())
  )

  /* ── Category list ── */
  if (!selectedCategory) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-ed-surface-hover text-ed-text-dim"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-ed-text">Online Library</h2>
            <span className="text-[10px] text-ed-text-dim ml-auto">
              {categories.length > 0 ? `${categories.length} categories` : ''}
            </span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ed-text-dim" />
            <input
              type="text"
              placeholder="Search categories..."
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              className="w-full !pl-8 pr-3 py-1.5 editor-input"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 editor-scrollbar">
          {catLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-ed-accent" />
              <span className="ml-2 text-xs text-ed-text-dim">Loading categories...</span>
            </div>
          ) : error ? (
            <p className="text-xs text-red-500 text-center py-8">{error}</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat); setError(null) }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-ed-surface-hover transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-ed-accent/10 flex items-center justify-center text-ed-accent">
                      <Download size={14} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium text-ed-text">{translateName(cat.attributes.name)}</p>
                      <p className="text-[10px] text-ed-text-dim capitalize">
                        {cat.attributes.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-ed-text-dim group-hover:text-ed-accent transition-colors" />
                </button>
              ))}
              {filtered.length === 0 && !catLoading && (
                <p className="text-xs text-ed-text-dim text-center py-8">No categories found</p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ── Materials grid ── */
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => { setSelectedCategory(null); setError(null) }}
            className="p-1 rounded hover:bg-ed-surface-hover text-ed-text-dim"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-ed-text truncate">
              {translateName(selectedCategory.attributes.name)}
            </h2>
            <p className="text-[10px] text-ed-text-dim">{totalItems} items</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 editor-scrollbar">
        {matLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-ed-accent" />
            <span className="ml-2 text-xs text-ed-text-dim">Loading...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {materials.map((mat, idx) => {
                const thumb = getThumbUrl(mat)
                if (!thumb) return null
                const isAdding = addingId === mat.id
                return (
                  <button
                    key={`${mat.id}-${idx}`}
                    onClick={() => handleAdd(mat)}
                    disabled={isAdding}
                    title={translateName(mat.attributes.name)}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-ed-border hover:border-ed-accent/40 hover:shadow-sm transition-all bg-white disabled:opacity-60"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb}
                      alt={translateName(mat.attributes.name)}
                      className="w-full h-full object-contain p-1"
                      loading="lazy"
                    />
                    {isAdding ? (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 size={16} className="animate-spin text-white" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-[9px] text-white font-medium">Add</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {page < totalPages && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full mt-3 py-2 rounded-lg border border-ed-border hover:border-ed-accent/40 text-xs font-medium text-ed-text-dim hover:text-ed-accent transition-colors flex items-center justify-center gap-1.5"
              >
                {loadingMore ? (
                  <><Loader2 size={12} className="animate-spin" /> Loading...</>
                ) : (
                  <>Load More ({materials.length} / {totalItems})</>
                )}
              </button>
            )}

            {materials.length === 0 && !matLoading && (
              <p className="text-xs text-ed-text-dim text-center py-8">No materials found</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
