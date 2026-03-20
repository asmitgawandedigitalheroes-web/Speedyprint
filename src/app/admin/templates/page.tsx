'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
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

export default function AdminTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [groups, setGroups] = useState<Pick<ProductGroup, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [groupFilter, setGroupFilter] = useState<string>('all')
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

  // Fetch product groups for filter tabs and dialog
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
    { key: 'all', label: 'All Groups' },
    ...groups.map((g) => ({ key: g.id, label: g.name })),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage print templates and their specifications
          </p>
        </div>
        <Button onClick={() => { setDialogOpen(true); setCreateError(null) }}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Group Filter Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/50 p-1">
        {groupTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setGroupFilter(tab.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              groupFilter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-muted-foreground hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Templates Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Template</th>
              <th className="px-4 py-3 text-left font-medium">Product Group</th>
              <th className="px-4 py-3 text-center font-medium">Dimensions (mm)</th>
              <th className="px-4 py-3 text-center font-medium">Bleed / Safe</th>
              <th className="px-4 py-3 text-center font-medium">DPI</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td colSpan={7} className="px-4 py-4">
                    <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
                  </td>
                </tr>
              ))
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-muted-foreground">No templates found</p>
                </td>
              </tr>
            ) : (
              templates.map((t) => (
                <tr key={t.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {t.image_url ? (
                        <img
                          src={t.image_url}
                          alt={t.name}
                          className="h-10 w-10 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-gray-50 text-xs text-muted-foreground">
                          IMG
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{t.name}</p>
                        {t.description && (
                          <p className="max-w-xs truncate text-xs text-muted-foreground">{t.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {t.product_group?.name ?? '—'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs">
                    {t.print_width_mm} × {t.print_height_mm}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs">
                    {t.bleed_mm} / {t.safe_zone_mm}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs">
                    {t.dpi}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="secondary"
                      className={t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
                    >
                      {t.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/admin/templates/${t.id}/edit`)}
                        title="Edit template"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(t.id, t.name)}
                        disabled={deleting === t.id}
                        title="Delete template"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-template-name">Template Name *</Label>
              <Input
                id="new-template-name"
                placeholder="e.g. Standard Race Bib"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-template-group">Product Group *</Label>
              <Select value={newGroupId} onValueChange={setNewGroupId}>
                <SelectTrigger id="new-template-group">
                  <SelectValue placeholder="Select product group" />
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
              <p className="text-sm text-red-600">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create & Edit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
