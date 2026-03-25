'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { DIVISIONS } from '@/lib/utils/constants'
import { slugify } from '@/lib/utils/format'
import type {
  ProductGroup,
  ProductTemplate,
  PricingRule,
  PricingRuleType,
} from '@/types'

const PRICING_RULE_TYPES: { value: PricingRuleType; label: string }[] = [
  { value: 'base_price', label: 'Base Price' },
  { value: 'quantity_break', label: 'Quantity Break' },
  { value: 'size_tier', label: 'Size Tier' },
  { value: 'material_addon', label: 'Material Add-on' },
  { value: 'option_addon', label: 'Option Add-on' },
  { value: 'finish_addon', label: 'Finish Add-on' },
]

interface TemplateForm {
  id?: string
  name: string
  description: string
  image_url: string
  print_width_mm: number
  print_height_mm: number
  bleed_mm: number
  safe_zone_mm: number
  dpi: number
  is_active: boolean
  // Adjustable dimensions (stored in template_json)
  min_width_mm: string
  max_width_mm: string
  width_step_mm: string
  min_height_mm: string
  max_height_mm: string
  height_step_mm: string
  // Sponsor zones (stored in template_json as JSON)
  sponsor_zones_json: string
}

interface PricingRuleForm {
  id?: string
  rule_type: PricingRuleType
  conditions: string // JSON string for editing
  price_value: number
  is_active: boolean
  display_order: number
}

const emptyTemplate: TemplateForm = {
  name: '',
  description: '',
  image_url: '',
  print_width_mm: 100,
  print_height_mm: 100,
  bleed_mm: 3,
  safe_zone_mm: 5,
  dpi: 300,
  is_active: true,
  min_width_mm: '',
  max_width_mm: '',
  width_step_mm: '1',
  min_height_mm: '',
  max_height_mm: '',
  height_step_mm: '1',
  sponsor_zones_json: '[]',
}

function templateToForm(tmpl: ProductTemplate): TemplateForm {
  const tj = (tmpl.template_json ?? {}) as Record<string, unknown>
  return {
    id: tmpl.id,
    name: tmpl.name,
    description: tmpl.description || '',
    image_url: tmpl.image_url || '',
    print_width_mm: tmpl.print_width_mm,
    print_height_mm: tmpl.print_height_mm,
    bleed_mm: tmpl.bleed_mm,
    safe_zone_mm: tmpl.safe_zone_mm,
    dpi: tmpl.dpi,
    is_active: tmpl.is_active,
    min_width_mm: tj.min_width_mm != null ? String(tj.min_width_mm) : '',
    max_width_mm: tj.max_width_mm != null ? String(tj.max_width_mm) : '',
    width_step_mm: tj.width_step_mm != null ? String(tj.width_step_mm) : '1',
    min_height_mm: tj.min_height_mm != null ? String(tj.min_height_mm) : '',
    max_height_mm: tj.max_height_mm != null ? String(tj.max_height_mm) : '',
    height_step_mm: tj.height_step_mm != null ? String(tj.height_step_mm) : '1',
    sponsor_zones_json: Array.isArray(tj.sponsor_zones)
      ? JSON.stringify(tj.sponsor_zones, null, 2)
      : '[]',
  }
}

const emptyPricingRule: PricingRuleForm = {
  rule_type: 'base_price',
  conditions: '{}',
  price_value: 0,
  is_active: true,
  display_order: 0,
}

export default function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Product form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [division, setDivision] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)

  // Templates
  const [templates, setTemplates] = useState<ProductTemplate[]>([])
  const [editingTemplate, setEditingTemplate] = useState<TemplateForm | null>(
    null
  )
  const [templateSaving, setTemplateSaving] = useState(false)

  // Pricing rules
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [editingRule, setEditingRule] = useState<PricingRuleForm | null>(null)
  const [ruleSaving, setRuleSaving] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const supabase = createClient()

        const { data: product, error: prodError } = await supabase
          .from('product_groups')
          .select('*')
          .eq('id', id)
          .single()

        if (prodError) throw prodError

        setName(product.name)
        setSlug(product.slug)
        setDescription(product.description || '')
        setDivision(product.division)
        setImageUrl(product.image_url || '')
        setDisplayOrder(product.display_order)
        setIsActive(product.is_active)

        // Fetch templates
        const { data: tmpl } = await supabase
          .from('product_templates')
          .select('*')
          .eq('product_group_id', id)
          .order('created_at', { ascending: true })

        setTemplates(tmpl ?? [])

        // Fetch pricing rules
        const { data: rules } = await supabase
          .from('pricing_rules')
          .select('*')
          .eq('product_group_id', id)
          .order('display_order', { ascending: true })

        setPricingRules(rules ?? [])
      } catch (err) {
        console.error('Product fetch error:', err)
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !division) {
      setError('Name and division are required')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('product_groups')
        .update({
          name,
          slug: slug || slugify(name),
          description: description || null,
          division,
          image_url: imageUrl || null,
          display_order: displayOrder,
          is_active: isActive,
        })
        .eq('id', id)

      if (updateError) throw updateError
      setSuccess('Product updated successfully')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update product'
      )
    } finally {
      setSaving(false)
    }
  }

  // Template CRUD
  const handleSaveTemplate = async () => {
    if (!editingTemplate) return
    setTemplateSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      // Build template_json from dimension constraints + sponsor zones
      const templateJson: Record<string, unknown> = {}
      if (editingTemplate.min_width_mm) templateJson.min_width_mm = parseFloat(editingTemplate.min_width_mm)
      if (editingTemplate.max_width_mm) templateJson.max_width_mm = parseFloat(editingTemplate.max_width_mm)
      if (editingTemplate.width_step_mm) templateJson.width_step_mm = parseFloat(editingTemplate.width_step_mm)
      if (editingTemplate.min_height_mm) templateJson.min_height_mm = parseFloat(editingTemplate.min_height_mm)
      if (editingTemplate.max_height_mm) templateJson.max_height_mm = parseFloat(editingTemplate.max_height_mm)
      if (editingTemplate.height_step_mm) templateJson.height_step_mm = parseFloat(editingTemplate.height_step_mm)
      try {
        const zones = JSON.parse(editingTemplate.sponsor_zones_json)
        if (Array.isArray(zones) && zones.length > 0) templateJson.sponsor_zones = zones
      } catch { /* ignore invalid JSON */ }

      const templateData = {
        product_group_id: id,
        name: editingTemplate.name,
        description: editingTemplate.description || null,
        image_url: editingTemplate.image_url || null,
        print_width_mm: editingTemplate.print_width_mm,
        print_height_mm: editingTemplate.print_height_mm,
        bleed_mm: editingTemplate.bleed_mm,
        safe_zone_mm: editingTemplate.safe_zone_mm,
        dpi: editingTemplate.dpi,
        is_active: editingTemplate.is_active,
        template_json: templateJson,
        panels: [],
      }

      if (editingTemplate.id) {
        // Update
        const { data, error: updateError } = await supabase
          .from('product_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)
          .select()
          .single()

        if (updateError) throw updateError
        setTemplates((prev) =>
          prev.map((t) => (t.id === data.id ? data : t))
        )
      } else {
        // Insert
        const { data, error: insertError } = await supabase
          .from('product_templates')
          .insert(templateData)
          .select()
          .single()

        if (insertError) throw insertError
        setTemplates((prev) => [...prev, data])
      }

      setEditingTemplate(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save template'
      )
    } finally {
      setTemplateSaving(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Delete this template?')) return

    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('product_templates')
        .delete()
        .eq('id', templateId)

      if (deleteError) throw deleteError
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete template'
      )
    }
  }

  // Pricing Rule CRUD
  const handleSaveRule = async () => {
    if (!editingRule) return
    setRuleSaving(true)
    setError(null)

    try {
      let parsedConditions: Record<string, unknown> = {}
      try {
        parsedConditions = JSON.parse(editingRule.conditions)
      } catch {
        throw new Error('Conditions must be valid JSON')
      }

      const supabase = createClient()
      const ruleData = {
        product_group_id: id,
        rule_type: editingRule.rule_type,
        conditions: parsedConditions,
        price_value: editingRule.price_value,
        currency: 'ZAR',
        is_active: editingRule.is_active,
        display_order: editingRule.display_order,
      }

      if (editingRule.id) {
        const { data, error: updateError } = await supabase
          .from('pricing_rules')
          .update(ruleData)
          .eq('id', editingRule.id)
          .select()
          .single()

        if (updateError) throw updateError
        setPricingRules((prev) =>
          prev.map((r) => (r.id === data.id ? data : r))
        )
      } else {
        const { data, error: insertError } = await supabase
          .from('pricing_rules')
          .insert(ruleData)
          .select()
          .single()

        if (insertError) throw insertError
        setPricingRules((prev) => [...prev, data])
      }

      setEditingRule(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save pricing rule'
      )
    } finally {
      setRuleSaving(false)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Delete this pricing rule?')) return

    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('pricing_rules')
        .delete()
        .eq('id', ruleId)

      if (deleteError) throw deleteError
      setPricingRules((prev) => prev.filter((r) => r.id !== ruleId))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete pricing rule'
      )
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-brand-text">Edit Product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update product details, templates, and pricing rules
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Product Details Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProduct} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSlug(slugify(e.target.value))
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Division *</Label>
              <Select value={division} onValueChange={setDivision}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a division" />
                </SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((d) => (
                    <SelectItem key={d.key} value={d.key}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                type="url"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={displayOrder}
                  onChange={(e) =>
                    setDisplayOrder(parseInt(e.target.value, 10) || 0)
                  }
                  min={0}
                />
              </div>
              <div className="flex items-end gap-3 pb-0.5">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Product'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Templates Section */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            Templates ({templates.length})
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditingTemplate({ ...emptyTemplate })}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Template
          </Button>
        </CardHeader>
        <CardContent>
          {/* Template Editor */}
          {editingTemplate && (
            <div className="mb-4 space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {editingTemplate.id ? 'Edit Template' : 'New Template'}
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingTemplate(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name *</Label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) =>
                      setEditingTemplate((prev) =>
                        prev ? { ...prev, name: e.target.value } : prev
                      )
                    }
                    placeholder="e.g., A4 Sheet"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={editingTemplate.description}
                    onChange={(e) =>
                      setEditingTemplate((prev) =>
                        prev
                          ? { ...prev, description: e.target.value }
                          : prev
                      )
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Template Image URL</Label>
                  <Input
                    value={editingTemplate.image_url}
                    onChange={(e) =>
                      setEditingTemplate((prev) =>
                        prev
                          ? { ...prev, image_url: e.target.value }
                          : prev
                      )
                    }
                    placeholder="e.g., /images/products/template-variant.jpg"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Image shown on product page when this template is selected
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Width (mm)</Label>
                    <Input
                      type="number"
                      value={editingTemplate.print_width_mm}
                      onChange={(e) =>
                        setEditingTemplate((prev) =>
                          prev
                            ? {
                                ...prev,
                                print_width_mm:
                                  parseFloat(e.target.value) || 0,
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Height (mm)</Label>
                    <Input
                      type="number"
                      value={editingTemplate.print_height_mm}
                      onChange={(e) =>
                        setEditingTemplate((prev) =>
                          prev
                            ? {
                                ...prev,
                                print_height_mm:
                                  parseFloat(e.target.value) || 0,
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Bleed (mm)</Label>
                    <Input
                      type="number"
                      value={editingTemplate.bleed_mm}
                      onChange={(e) =>
                        setEditingTemplate((prev) =>
                          prev
                            ? {
                                ...prev,
                                bleed_mm: parseFloat(e.target.value) || 0,
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Safe Zone (mm)</Label>
                    <Input
                      type="number"
                      value={editingTemplate.safe_zone_mm}
                      onChange={(e) =>
                        setEditingTemplate((prev) =>
                          prev
                            ? {
                                ...prev,
                                safe_zone_mm:
                                  parseFloat(e.target.value) || 0,
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">DPI</Label>
                    <Input
                      type="number"
                      value={editingTemplate.dpi}
                      onChange={(e) =>
                        setEditingTemplate((prev) =>
                          prev
                            ? {
                                ...prev,
                                dpi: parseInt(e.target.value, 10) || 300,
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="flex items-end gap-2 pb-0.5">
                    <input
                      type="checkbox"
                      checked={editingTemplate.is_active}
                      onChange={(e) =>
                        setEditingTemplate((prev) =>
                          prev
                            ? { ...prev, is_active: e.target.checked }
                            : prev
                        )
                      }
                      className="rounded border-gray-300"
                    />
                    <Label className="cursor-pointer text-xs">Active</Label>
                  </div>
                </div>

                {/* Adjustable Dimensions */}
                <div className="space-y-2 rounded-lg border border-dashed border-gray-300 p-3">
                  <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
                    Adjustable Dimensions (optional)
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Leave blank to use fixed dimensions above. Fill in to let customers resize within these limits.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Min Width (mm)</Label>
                      <Input type="number" min={1} placeholder="e.g. 50"
                        value={editingTemplate.min_width_mm}
                        onChange={(e) => setEditingTemplate((p) => p ? { ...p, min_width_mm: e.target.value } : p)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Max Width (mm)</Label>
                      <Input type="number" min={1} placeholder="e.g. 300"
                        value={editingTemplate.max_width_mm}
                        onChange={(e) => setEditingTemplate((p) => p ? { ...p, max_width_mm: e.target.value } : p)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Step (mm)</Label>
                      <Input type="number" min={1} placeholder="1"
                        value={editingTemplate.width_step_mm}
                        onChange={(e) => setEditingTemplate((p) => p ? { ...p, width_step_mm: e.target.value } : p)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Min Height (mm)</Label>
                      <Input type="number" min={1} placeholder="e.g. 30"
                        value={editingTemplate.min_height_mm}
                        onChange={(e) => setEditingTemplate((p) => p ? { ...p, min_height_mm: e.target.value } : p)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Max Height (mm)</Label>
                      <Input type="number" min={1} placeholder="e.g. 200"
                        value={editingTemplate.max_height_mm}
                        onChange={(e) => setEditingTemplate((p) => p ? { ...p, max_height_mm: e.target.value } : p)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Step (mm)</Label>
                      <Input type="number" min={1} placeholder="1"
                        value={editingTemplate.height_step_mm}
                        onChange={(e) => setEditingTemplate((p) => p ? { ...p, height_step_mm: e.target.value } : p)} />
                    </div>
                  </div>
                </div>

                {/* Sponsor Zones */}
                <div className="space-y-2 rounded-lg border border-dashed border-gray-300 p-3">
                  <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
                    Sponsor / Logo Zones (optional)
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    JSON array of zones for event products. Each zone: <code>{`{"key":"sponsor_top","label":"Top Sponsor","description":"..."}`}</code>
                  </p>
                  <textarea
                    rows={4}
                    value={editingTemplate.sponsor_zones_json}
                    onChange={(e) => setEditingTemplate((p) => p ? { ...p, sponsor_zones_json: e.target.value } : p)}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs focus-visible:border-ring focus-visible:outline-none"
                    placeholder={'[\n  {"key":"sponsor_front","label":"Front Sponsor","description":"Logo on front"}\n]'}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveTemplate}
                    disabled={templateSaving}
                  >
                    <Save className="mr-1 h-3.5 w-3.5" />
                    {templateSaving ? 'Saving...' : 'Save Template'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingTemplate(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Templates List */}
          {templates.length === 0 && !editingTemplate ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No templates yet. Add one to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{tmpl.name}</p>
                      <Badge
                        variant="secondary"
                        className={
                          tmpl.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }
                      >
                        {tmpl.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tmpl.print_width_mm}x{tmpl.print_height_mm}mm |
                      Bleed: {tmpl.bleed_mm}mm | Safe: {tmpl.safe_zone_mm}mm |{' '}
                      {tmpl.dpi} DPI
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingTemplate(templateToForm(tmpl))}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteTemplate(tmpl.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Rules Section */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            Pricing Rules ({pricingRules.length})
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditingRule({ ...emptyPricingRule })}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Rule
          </Button>
        </CardHeader>
        <CardContent>
          {/* Rule Editor */}
          {editingRule && (
            <div className="mb-4 space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {editingRule.id ? 'Edit Rule' : 'New Pricing Rule'}
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingRule(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Rule Type *</Label>
                  <Select
                    value={editingRule.rule_type}
                    onValueChange={(val) =>
                      setEditingRule((prev) =>
                        prev
                          ? { ...prev, rule_type: val as PricingRuleType }
                          : prev
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICING_RULE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Conditions (JSON)</Label>
                  <textarea
                    value={editingRule.conditions}
                    onChange={(e) =>
                      setEditingRule((prev) =>
                        prev
                          ? { ...prev, conditions: e.target.value }
                          : prev
                      )
                    }
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    placeholder='{"min_qty": 100, "max_qty": 499}'
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Price Value (ZAR)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingRule.price_value}
                      onChange={(e) =>
                        setEditingRule((prev) =>
                          prev
                            ? {
                                ...prev,
                                price_value:
                                  parseFloat(e.target.value) || 0,
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Display Order</Label>
                    <Input
                      type="number"
                      value={editingRule.display_order}
                      onChange={(e) =>
                        setEditingRule((prev) =>
                          prev
                            ? {
                                ...prev,
                                display_order:
                                  parseInt(e.target.value, 10) || 0,
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingRule.is_active}
                    onChange={(e) =>
                      setEditingRule((prev) =>
                        prev
                          ? { ...prev, is_active: e.target.checked }
                          : prev
                      )
                    }
                    className="rounded border-gray-300"
                  />
                  <Label className="cursor-pointer text-xs">Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveRule}
                    disabled={ruleSaving}
                  >
                    <Save className="mr-1 h-3.5 w-3.5" />
                    {ruleSaving ? 'Saving...' : 'Save Rule'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingRule(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Rules List */}
          {pricingRules.length === 0 && !editingRule ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No pricing rules yet. Add one to define product pricing.
            </p>
          ) : (
            <div className="space-y-2">
              {pricingRules.map((rule) => {
                const ruleType = PRICING_RULE_TYPES.find(
                  (t) => t.value === rule.rule_type
                )

                return (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {ruleType?.label ?? rule.rule_type}
                        </Badge>
                        <span className="font-medium text-sm">
                          R {rule.price_value.toFixed(2)}
                        </span>
                        {!rule.is_active && (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-500"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                        {JSON.stringify(rule.conditions)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setEditingRule({
                            id: rule.id,
                            rule_type: rule.rule_type,
                            conditions: JSON.stringify(
                              rule.conditions,
                              null,
                              2
                            ),
                            price_value: rule.price_value,
                            is_active: rule.is_active,
                            display_order: rule.display_order,
                          })
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
