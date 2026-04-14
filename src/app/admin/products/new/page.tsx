'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Tag, Hash, Bike, Zap, Trophy, Printer,
  ImagePlus, Loader2, CheckCircle2, AlertCircle,
  Info, Eye, Package, Sparkles,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { DIVISIONS } from '@/lib/utils/constants'
import { slugify } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

/* ── Division icon map ── */
const DIVISION_ICONS: Record<string, React.ElementType> = {
  labels: Tag,
  'race-numbers': Hash,
  'mtb-boards': Bike,
  laser: Zap,
  trophies: Trophy,
  print: Printer,
}

const DIVISION_COLORS: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  labels: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-brand-primary', badge: 'bg-red-100 text-red-700' },
  'race-numbers': { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' },
  'mtb-boards': { bg: 'bg-sky-50', border: 'border-sky-200', icon: 'text-sky-600', badge: 'bg-sky-100 text-sky-700' },
  laser: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
  trophies: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  print: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
}

export default function AdminProductNewPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [division, setDivision] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugEdited) setSlug(slugify(value))
  }

  const handleSlugChange = (value: string) => {
    setSlugEdited(true)
    setSlug(slugify(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !division) {
      setError('Product name and division are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug || slugify(name),
          description: description.trim() || null,
          division,
          image_url: images[0] || null,
          images: images.length > 0 ? images : null,
          display_order: displayOrder,
          is_active: isActive,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create product')
      router.push(`/admin/products/${data.product.id}/edit`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  /* Derived values for live preview */
  const selectedDiv = DIVISIONS.find((d) => d.key === division)
  const DivIcon = division ? DIVISION_ICONS[division] : Package
  const divColors = division ? DIVISION_COLORS[division] : null
  const previewImage = images[0] || null
  const isComplete = !!name.trim() && !!division

  return (
    <div className="min-h-screen bg-[#F5F6F7]">

      {/* ── Action bar — anchored below the admin's h-14 top bar ── */}
      <div className="sticky border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">

          {/* Left — breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/admin/products"
              className="group flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Products</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="truncate text-sm font-semibold text-gray-900">
              {name.trim() ? name.trim() : 'New Product'}
            </span>
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/products"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-primary-dark hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
              ) : (
                'Create Product'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* ── Page header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new product group to your catalog. You can add templates and pricing rules after creation.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ══════════════════════════════════════
              Left column — form (2/3 width)
          ══════════════════════════════════════ */}
          <div className="space-y-6 lg:col-span-2">

            {/* ── Basic info card ── */}
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b bg-gray-50/60 px-6 py-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary/10">
                  <Package className="h-3.5 w-3.5 text-brand-primary" />
                </div>
                <h2 className="text-sm font-semibold text-gray-800">Basic Information</h2>
              </div>

              <div className="space-y-5 p-6">
                {/* Product Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Product Name <span className="text-brand-primary">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Custom Labels"
                    className="focus-visible:ring-brand-primary/30 h-10"
                  />
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-400">This is displayed to customers in the catalog.</p>
                    <span className={cn('text-xs tabular-nums', name.length > 60 ? 'text-red-500' : 'text-gray-400')}>
                      {name.length}/80
                    </span>
                  </div>
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slug" className="text-sm font-medium text-gray-700">URL Slug</Label>
                    {!slugEdited && name && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <Sparkles className="h-3 w-3" /> Auto-generated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center overflow-hidden rounded-lg border bg-gray-50 focus-within:border-gray-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-primary/20">
                    <span className="border-r bg-gray-100 px-3 py-2 text-xs font-mono text-gray-400 select-none">/products/</span>
                    <input
                      id="slug"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="auto-generated-from-name"
                      className="flex-1 bg-transparent px-3 py-2 text-sm font-mono text-gray-700 outline-none placeholder:text-gray-300"
                    />
                  </div>
                  <p className="text-xs text-gray-400">URL-friendly identifier used in links and the API.</p>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what makes this product special — materials, use-cases, custom options…"
                    rows={4}
                    maxLength={500}
                    className="w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                  <div className="flex justify-end">
                    <span className={cn('text-xs tabular-nums', description.length > 450 ? 'text-amber-500' : 'text-gray-400')}>
                      {description.length}/500
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Division picker card ── */}
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b bg-gray-50/60 px-6 py-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                  <Tag className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Division <span className="text-brand-primary">*</span>
                  </h2>
                  <p className="text-xs text-gray-400">Choose the category this product belongs to</p>
                </div>
                {division && (
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', divColors?.badge)}>
                    {selectedDiv?.name}
                  </span>
                )}
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {DIVISIONS.map((d) => {
                    const Icon = DIVISION_ICONS[d.key] || Package
                    const colors = DIVISION_COLORS[d.key]
                    const selected = division === d.key
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setDivision(d.key)}
                        className={cn(
                          'group relative flex flex-col items-start gap-2.5 rounded-xl border-2 p-4 text-left transition-all duration-150',
                          selected
                            ? `${colors.bg} ${colors.border} shadow-sm`
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/80'
                        )}
                      >
                        {/* Selected check */}
                        {selected && (
                          <div className="absolute right-3 top-3">
                            <CheckCircle2 className={cn('h-4 w-4', colors.icon)} />
                          </div>
                        )}

                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                          selected ? `${colors.bg} border ${colors.border}` : 'bg-gray-100 group-hover:bg-gray-200'
                        )}>
                          <Icon className={cn('h-4 w-4', selected ? colors.icon : 'text-gray-500')} />
                        </div>

                        <div>
                          <p className={cn('text-sm font-semibold', selected ? 'text-gray-900' : 'text-gray-700')}>
                            {d.name}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-gray-400">
                            {d.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── Images card ── */}
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b bg-gray-50/60 px-6 py-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50">
                  <ImagePlus className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">Product Images</h2>
                  <p className="text-xs text-gray-400">Up to 3 images — first image is used as the main thumbnail</p>
                </div>
              </div>

              <div className="p-6">
                <ImageUploader value={images} onChange={setImages} maxImages={3} />

                {images.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    The first image will appear as the product card thumbnail in the catalog.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════
              Right column — preview + settings (1/3)
          ══════════════════════════════════════ */}
          <div className="space-y-5">

            {/* ── Live preview card ── */}
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b bg-gray-50/60 px-5 py-3.5">
                <Eye className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600">Catalog Preview</span>
              </div>

              <div className="p-5">
                {/* Simulated product card */}
                <div className="overflow-hidden rounded-xl border bg-gray-50 shadow-inner">
                  {/* Image area */}
                  <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1.5 text-gray-300">
                        <ImagePlus className="h-8 w-8" />
                        <span className="text-[11px]">No image yet</span>
                      </div>
                    )}

                    {/* Division badge overlay */}
                    {division && divColors && (
                      <div className="absolute left-2.5 top-2.5">
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', divColors.badge)}>
                          {selectedDiv?.name}
                        </span>
                      </div>
                    )}

                    {/* Active/Inactive indicator */}
                    <div className="absolute right-2.5 top-2.5">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold',
                        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      )}>
                        {isActive ? 'Active' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-3">
                    <p className={cn(
                      'text-sm font-semibold leading-tight',
                      name ? 'text-gray-900' : 'text-gray-300 italic'
                    )}>
                      {name || 'Product name…'}
                    </p>
                    {description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-400">{description}</p>
                    )}
                    {slug && (
                      <p className="mt-2 font-mono text-[10px] text-gray-300">/products/{slug}</p>
                    )}
                  </div>
                </div>

                {/* Completeness indicator */}
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Required fields</p>
                  {[
                    { label: 'Product name', done: !!name.trim() },
                    { label: 'Division selected', done: !!division },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full',
                        done ? 'bg-green-500' : 'bg-gray-200'
                      )}>
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      <span className={cn('text-xs', done ? 'text-gray-700' : 'text-gray-400')}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Settings card ── */}
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b bg-gray-50/60 px-5 py-3.5">
                <span className="text-xs font-semibold text-gray-600">Settings</span>
              </div>

              <div className="divide-y">
                {/* Visibility toggle */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Visibility</p>
                    <p className="text-xs text-gray-400">
                      {isActive ? 'Visible in catalog' : 'Hidden from customers'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive((v) => !v)}
                    className={cn(
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      isActive ? 'bg-green-500' : 'bg-gray-200'
                    )}
                    role="switch"
                    aria-checked={isActive}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        isActive ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

                {/* Display order */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Display Order</p>
                      <p className="text-xs text-gray-400">Lower = appears first</p>
                    </div>
                    <input
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                      min={0}
                      className="w-16 rounded-lg border bg-gray-50 px-2 py-1.5 text-center text-sm font-semibold text-gray-800 focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── What happens next ── */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">After creation</p>
              <ul className="space-y-1.5 text-xs text-blue-700">
                {[
                  'Add print templates with dimensions',
                  'Configure pricing rules',
                  'Set up template parameters',
                  'Publish to the live catalog',
                ].map((step, i) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-200 text-[9px] font-bold text-blue-700">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Submit (mobile CTA) ── */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                ) : (
                  'Create Product'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
