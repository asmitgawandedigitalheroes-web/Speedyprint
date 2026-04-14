'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Pencil, Trash2, FileText, LayoutGrid, List,
  Search, X, SlidersHorizontal, CheckCircle2, CircleDashed,
  Layers, ChevronRight, Ruler, Crosshair, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { ProductTemplate, ProductGroup } from '@/types'

type TemplateRow = ProductTemplate & { product_group: Pick<ProductGroup, 'id' | 'name' | 'division'> | null }
type ViewMode = 'grid' | 'list'

export default function AdminTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [groups, setGroups] = useState<Pick<ProductGroup, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [deleting, setDeleting] = useState<string | null>(null)

  // New template dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGroupId, setNewGroupId] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (groupFilter !== 'all') params.set('group_id', groupFilter)
      const res = await fetch(`/api/admin/templates?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setTemplates(data.templates ?? [])
    } catch {
      console.error('Templates fetch error')
    } finally {
      setLoading(false)
    }
  }, [groupFilter])

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch('/api/admin/products')
        if (!res.ok) return
        const data = await res.json()
        setGroups((data.products ?? []).map((p: ProductGroup) => ({ id: p.id, name: p.name })))
      } catch { /* silent */ }
    }
    fetchGroups()
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Client-side filtering
  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.product_group?.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && t.is_active) ||
        (statusFilter === 'inactive' && !t.is_active)
      return matchesSearch && matchesStatus
    })
  }, [templates, searchQuery, statusFilter])

  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter((t) => t.is_active).length,
    inactive: templates.filter((t) => !t.is_active).length,
    groups: new Set(templates.map((t) => t.product_group?.id).filter(Boolean)).size,
  }), [templates])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch {
      alert('Failed to delete template. It may be in use by existing orders.')
    } finally {
      setDeleting(null)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim() || !newGroupId) {
      setCreateError('Name and product group are required.')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), product_group_id: newGroupId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error ?? 'Failed to create template')
        return
      }
      setDialogOpen(false)
      setNewName('')
      setNewGroupId('')
      router.push(`/admin/templates/${data.template.id}/edit`)
    } catch {
      setCreateError('Failed to create template')
    } finally {
      setCreating(false)
    }
  }

  const groupTabs = [
    { key: 'all', label: 'All Groups', count: templates.length },
    ...groups.map((g) => ({
      key: g.id,
      label: g.name,
      count: templates.filter((t) => t.product_group?.id === g.id).length,
    })),
  ]

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage print templates and their specifications
          </p>
        </div>
        <Button
          className="shrink-0 bg-brand-primary text-white hover:bg-brand-primary-dark shadow-sm shadow-red-100 transition-all"
          onClick={() => { setDialogOpen(true); setCreateError(null) }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Inactive', value: stats.inactive, icon: CircleDashed, color: 'text-gray-500', bg: 'bg-gray-50' },
          { label: 'Groups', value: stats.groups, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
              <p className="mt-0.5 text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar: search + status filter + view toggle ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search templates…"
            className="pl-9 pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 rounded-lg border bg-gray-50 p-1">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'all' ? 'All Status' : s}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border bg-gray-50 p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Group filter tabs ── */}
      <div className="flex flex-wrap gap-1.5">
        {groupTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setGroupFilter(tab.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              groupFilter === tab.key
                ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              groupFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Result count ── */}
      {!loading && (
        <p className="text-xs text-gray-400">
          Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{' '}
          <span className="font-semibold text-gray-600">{templates.length}</span> templates
          {searchQuery && <> matching "<span className="italic">{searchQuery}</span>"</>}
        </p>
      )}

      {/* ── Content ── */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border bg-white p-4">
                <div className="mb-3 h-40 rounded-lg bg-gray-100" />
                <div className="h-4 w-3/4 rounded bg-gray-100" />
                <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 border-b px-5 py-4 last:border-b-0">
                <div className="h-12 w-12 rounded-lg bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-gray-100" />
                  <div className="h-3 w-32 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <FileText className="h-7 w-7 text-gray-300" />
          </div>
          <p className="mt-4 text-base font-semibold text-gray-700">No templates found</p>
          <p className="mt-1 text-sm text-gray-400">
            {searchQuery ? 'Try adjusting your search or filters.' : 'Create your first template to get started.'}
          </p>
          {!searchQuery && (
            <Button
              className="mt-5 bg-brand-primary text-white hover:bg-brand-primary-dark shadow-sm shadow-red-100 transition-all"
              onClick={() => { setDialogOpen(true); setCreateError(null) }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid view ── */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Thumbnail */}
              <div className="relative h-44 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                {t.image_url ? (
                  <img
                    src={t.image_url}
                    alt={t.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-300">
                    <FileText className="h-10 w-10" />
                    <span className="text-xs font-medium">No Preview</span>
                  </div>
                )}
                {/* Status pill */}
                <div className="absolute right-3 top-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
                    t.is_active
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${t.is_active ? 'bg-white' : 'bg-gray-400'}`} />
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/30 group-hover:opacity-100">
                  <button
                    onClick={() => router.push(`/admin/templates/${t.id}/edit`)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition-all hover:bg-brand-primary hover:text-white"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    disabled={deleting === t.id}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Card body */}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 line-clamp-1">{t.name}</p>
                  {t.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">{t.description}</p>
                  )}
                </div>

                {/* Group badge */}
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    <Layers className="h-3 w-3" />
                    {t.product_group?.name ?? 'No Group'}
                  </span>
                </div>

                {/* Specs row */}
                <div className="mt-3 flex items-center justify-between border-t pt-3 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Ruler className="h-3 w-3 text-gray-400" />
                    {t.print_width_mm}×{t.print_height_mm}mm
                  </span>
                  <span className="flex items-center gap-1">
                    <Crosshair className="h-3 w-3 text-gray-400" />
                    {t.bleed_mm}/{t.safe_zone_mm}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-gray-400" />
                    {t.dpi} dpi
                  </span>
                </div>
              </div>

              {/* Edit footer button */}
              <button
                onClick={() => router.push(`/admin/templates/${t.id}/edit`)}
                className="flex w-full items-center justify-between border-t bg-gray-50 px-4 py-2.5 text-xs font-medium text-gray-500 transition-all hover:bg-brand-primary/5 hover:text-brand-primary"
              >
                Edit template
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* ── List view ── */
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Template</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Product Group</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Dimensions</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Bleed / Safe</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">DPI</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((t) => (
                <tr key={t.id} className="group transition-colors hover:bg-gray-50/70">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {t.image_url ? (
                        <img
                          src={t.image_url}
                          alt={t.name}
                          className="h-11 w-11 rounded-lg border object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br from-gray-50 to-gray-100">
                          <FileText className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                        {t.description && (
                          <p className="max-w-xs truncate text-xs text-gray-400">{t.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      <Layers className="h-3 w-3" />
                      {t.product_group?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono text-xs text-gray-600">
                    {t.print_width_mm} × {t.print_height_mm}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono text-xs text-gray-600">
                    {t.bleed_mm} / {t.safe_zone_mm}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono text-xs text-gray-600">
                    {t.dpi}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      t.is_active
                        ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                        : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${t.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg p-0 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => router.push(`/admin/templates/${t.id}/edit`)}
                        title="Edit template"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg p-0 text-red-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDelete(t.id, t.name)}
                        disabled={deleting === t.id}
                        title="Delete template"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── New Template Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
                <Plus className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">New Template</DialogTitle>
                <p className="text-sm text-gray-500">You'll be taken to the full editor after creation.</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-template-name" className="text-sm font-medium">
                Template Name <span className="text-brand-primary">*</span>
              </Label>
              <Input
                id="new-template-name"
                placeholder="e.g. Standard Race Bib"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="focus-visible:ring-brand-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-template-group" className="text-sm font-medium">
                Product Group <span className="text-brand-primary">*</span>
              </Label>
              <Select value={newGroupId} onValueChange={setNewGroupId}>
                <SelectTrigger id="new-template-group" className="focus:ring-brand-primary">
                  <SelectValue placeholder="Select product group…" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {createError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
                <X className="h-4 w-4 shrink-0" />
                {createError}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 bg-brand-primary text-white hover:bg-brand-primary-dark shadow-sm shadow-red-100 transition-all sm:flex-none"
            >
              {creating ? 'Creating…' : 'Create & Edit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
