'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { ProductTemplate, ProductGroup, TemplateParameter } from '@/types'

type TemplateDetail = ProductTemplate & {
  product_group: Pick<ProductGroup, 'id' | 'name' | 'division'> | null
  parameters: TemplateParameter[]
}

export default function AdminTemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [productGroupId, setProductGroupId] = useState('')
  const [printWidthMm, setPrintWidthMm] = useState(100)
  const [printHeightMm, setPrintHeightMm] = useState(100)
  const [bleedMm, setBleedMm] = useState(3)
  const [safeZoneMm, setSafeZoneMm] = useState(5)
  const [dpi, setDpi] = useState(300)
  const [imageUrl, setImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [parameters, setParameters] = useState<TemplateParameter[]>([])

  const [groups, setGroups] = useState<Pick<ProductGroup, 'id' | 'name'>[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [tmplRes, groupsRes] = await Promise.all([
          fetch(`/api/admin/templates/${id}`),
          fetch('/api/admin/products'),
        ])

        if (!tmplRes.ok) throw new Error('Template not found')
        const tmplData = await tmplRes.json()
        const t: TemplateDetail = tmplData.template

        setName(t.name)
        setDescription(t.description ?? '')
        setProductGroupId(t.product_group_id)
        setPrintWidthMm(t.print_width_mm)
        setPrintHeightMm(t.print_height_mm)
        setBleedMm(t.bleed_mm)
        setSafeZoneMm(t.safe_zone_mm)
        setDpi(t.dpi)
        setImageUrl(t.image_url ?? '')
        setIsActive(t.is_active)
        setParameters(t.parameters ?? [])

        if (groupsRes.ok) {
          const gData = await groupsRes.json()
          setGroups((gData.products ?? []).map((p: ProductGroup) => ({ id: p.id, name: p.name })))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load template')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_group_id: productGroupId,
          name: name.trim(),
          description: description || null,
          print_width_mm: printWidthMm,
          print_height_mm: printHeightMm,
          bleed_mm: bleedMm,
          safe_zone_mm: safeZoneMm,
          dpi,
          image_url: imageUrl || null,
          is_active: isActive,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to update template')
        return
      }
      setSuccess('Template saved successfully')
    } catch {
      setError('Failed to update template')
    } finally {
      setSaving(false)
    }
  }

  const PARAM_TYPE_LABELS: Record<string, string> = {
    select: 'Select',
    range: 'Range',
    number: 'Number',
    text: 'Text',
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/templates">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Templates
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{name}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Optional description of this template"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-group">Product Group</Label>
              <Select value={productGroupId} onValueChange={setProductGroupId}>
                <SelectTrigger id="product-group">
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

            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Print Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Print Specifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="width">Width (mm)</Label>
              <Input
                id="width"
                type="number"
                min={1}
                value={printWidthMm}
                onChange={(e) => setPrintWidthMm(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (mm)</Label>
              <Input
                id="height"
                type="number"
                min={1}
                value={printHeightMm}
                onChange={(e) => setPrintHeightMm(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dpi">DPI</Label>
              <Input
                id="dpi"
                type="number"
                min={72}
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bleed">Bleed (mm)</Label>
              <Input
                id="bleed"
                type="number"
                min={0}
                step={0.5}
                value={bleedMm}
                onChange={(e) => setBleedMm(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="safe-zone">Safe Zone (mm)</Label>
              <Input
                id="safe-zone"
                type="number"
                min={0}
                step={0.5}
                value={safeZoneMm}
                onChange={(e) => setSafeZoneMm(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Parameters (read-only display) */}
        {parameters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">Key</th>
                      <th className="px-3 py-2 text-left font-medium">Label</th>
                      <th className="px-3 py-2 text-center font-medium">Type</th>
                      <th className="px-3 py-2 text-center font-medium">Required</th>
                      <th className="px-3 py-2 text-center font-medium">Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parameters
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((param) => (
                        <tr key={param.id} className="border-b last:border-0">
                          <td className="px-3 py-2 font-mono text-xs">{param.param_key}</td>
                          <td className="px-3 py-2">{param.param_label}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant="outline" className="text-xs">
                              {PARAM_TYPE_LABELS[param.param_type] ?? param.param_type}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {param.is_required ? (
                              <span className="text-xs font-medium text-green-600">Yes</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">No</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                            {param.display_order}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Parameters are managed via the product group edit page.
              </p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save Template'}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/templates">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
