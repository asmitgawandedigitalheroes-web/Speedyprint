'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ParameterSelector } from '@/components/products/ParameterSelector'
import { PriceCalculator } from '@/components/products/PriceCalculator'
import { getDimensionConstraints, getSponsorZones } from '@/types'
import type { ProductTemplate, TemplateParameter, PricingRule, Division } from '@/types'

interface ProductConfiguratorProps {
  productGroupId: string
  division: Division
  templates: (ProductTemplate & { template_parameters: TemplateParameter[] })[]
  pricingRules: PricingRule[]
  onTemplateChange?: (templateId: string) => void
}

export function ProductConfigurator({
  productGroupId,
  division,
  templates,
  onTemplateChange: onTemplateChangeCallback,
}: ProductConfiguratorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id ?? ''
  )
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    const firstTemplate = templates[0]
    if (firstTemplate) {
      for (const param of firstTemplate.template_parameters) {
        if (param.default_value) {
          defaults[param.param_key] = param.default_value
        }
      }
    }
    return defaults
  })
  const [quantity, setQuantity] = useState(1)

  // Adjustable dimensions state
  const [customWidth, setCustomWidth] = useState<string>('')
  const [customHeight, setCustomHeight] = useState<string>('')

  // Sponsor zones state: key → logo URL
  const [sponsorValues, setSponsorValues] = useState<Record<string, string>>({})

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  )

  const parameters = useMemo(
    () => selectedTemplate?.template_parameters ?? [],
    [selectedTemplate]
  )

  const dimensionConstraints = useMemo(
    () => selectedTemplate ? getDimensionConstraints(selectedTemplate) : null,
    [selectedTemplate]
  )

  const sponsorZones = useMemo(
    () => selectedTemplate ? getSponsorZones(selectedTemplate) : [],
    [selectedTemplate]
  )

  // Initialize custom dimensions when template changes
  function resetDimensions(template: ProductTemplate) {
    const constraints = getDimensionConstraints(template)
    if (constraints) {
      setCustomWidth(String(constraints.min_width_mm ?? template.print_width_mm))
      setCustomHeight(String(constraints.min_height_mm ?? template.print_height_mm))
    } else {
      setCustomWidth('')
      setCustomHeight('')
    }
    setSponsorValues({})
  }

  // Initialize on first render if first template has constraints
  useMemo(() => {
    const first = templates[0]
    if (first) resetDimensions(first)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId)
    const template = templates.find((t) => t.id === templateId)
    const defaults: Record<string, string> = {}
    if (template) {
      for (const param of template.template_parameters) {
        if (param.default_value) {
          defaults[param.param_key] = param.default_value
        }
      }
      resetDimensions(template)
    }
    setParamValues(defaults)
    onTemplateChangeCallback?.(templateId)
  }

  function handleParamChange(key: string, value: string) {
    setParamValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleQuantityChange(delta: number) {
    setQuantity((prev) => Math.max(1, prev + delta))
  }

  function handleWidthChange(val: string) {
    const num = Number(val)
    if (!dimensionConstraints) return
    const min = dimensionConstraints.min_width_mm ?? 1
    const max = dimensionConstraints.max_width_mm ?? 9999
    if (!isNaN(num)) setCustomWidth(String(Math.min(max, Math.max(min, num))))
  }

  function handleHeightChange(val: string) {
    const num = Number(val)
    if (!dimensionConstraints) return
    const min = dimensionConstraints.min_height_mm ?? 1
    const max = dimensionConstraints.max_height_mm ?? 9999
    if (!isNaN(num)) setCustomHeight(String(Math.min(max, Math.max(min, num))))
  }

  // Build the full params passed to pricing (include dimensions + sponsors)
  const allParams = useMemo(() => {
    const p: Record<string, string> = { ...paramValues }
    if (dimensionConstraints && customWidth) p.width_mm = customWidth
    if (dimensionConstraints && customHeight) p.height_mm = customHeight
    Object.entries(sponsorValues).forEach(([k, v]) => { if (v) p[k] = v })
    return p
  }, [paramValues, dimensionConstraints, customWidth, customHeight, sponsorValues])

  const isEventsProduct = division === 'events'

  return (
    <div className="space-y-6">
      {/* Template selector */}
      {templates.length > 1 && (
        <div className="space-y-2">
          <Label>Template</Label>
          <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                  {template.description && (
                    <span className="ml-2 text-muted-foreground">
                      — {template.description}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Template info */}
      {selectedTemplate && (
        <div className="rounded-lg bg-brand-bg p-3 text-xs text-brand-text-muted">
          {dimensionConstraints ? (
            <>
              Print size: <span className="font-medium text-brand-text">{customWidth || selectedTemplate.print_width_mm} × {customHeight || selectedTemplate.print_height_mm} mm</span> | {selectedTemplate.dpi} DPI | Bleed: {selectedTemplate.bleed_mm} mm
            </>
          ) : (
            <>Print size: {selectedTemplate.print_width_mm} × {selectedTemplate.print_height_mm} mm | {selectedTemplate.dpi} DPI | Bleed: {selectedTemplate.bleed_mm} mm</>
          )}
        </div>
      )}

      {/* ── Adjustable Dimensions ─────────────────────────────────────────── */}
      {dimensionConstraints && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-text-muted">
              Custom Size
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {(dimensionConstraints.min_width_mm !== undefined || dimensionConstraints.max_width_mm !== undefined) && (
                <div className="space-y-1.5">
                  <Label htmlFor="dim-width">
                    Width (mm)
                    <span className="ml-1 text-xs font-normal text-brand-text-muted">
                      {dimensionConstraints.min_width_mm}–{dimensionConstraints.max_width_mm}
                    </span>
                  </Label>
                  <Input
                    id="dim-width"
                    type="number"
                    min={dimensionConstraints.min_width_mm}
                    max={dimensionConstraints.max_width_mm}
                    step={dimensionConstraints.width_step_mm ?? 1}
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    onBlur={(e) => handleWidthChange(e.target.value)}
                  />
                  <input
                    type="range"
                    min={dimensionConstraints.min_width_mm}
                    max={dimensionConstraints.max_width_mm}
                    step={dimensionConstraints.width_step_mm ?? 1}
                    value={customWidth || dimensionConstraints.min_width_mm}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-brand-primary"
                  />
                </div>
              )}
              {(dimensionConstraints.min_height_mm !== undefined || dimensionConstraints.max_height_mm !== undefined) && (
                <div className="space-y-1.5">
                  <Label htmlFor="dim-height">
                    Height (mm)
                    <span className="ml-1 text-xs font-normal text-brand-text-muted">
                      {dimensionConstraints.min_height_mm}–{dimensionConstraints.max_height_mm}
                    </span>
                  </Label>
                  <Input
                    id="dim-height"
                    type="number"
                    min={dimensionConstraints.min_height_mm}
                    max={dimensionConstraints.max_height_mm}
                    step={dimensionConstraints.height_step_mm ?? 1}
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    onBlur={(e) => handleHeightChange(e.target.value)}
                  />
                  <input
                    type="range"
                    min={dimensionConstraints.min_height_mm}
                    max={dimensionConstraints.max_height_mm}
                    step={dimensionConstraints.height_step_mm ?? 1}
                    value={customHeight || dimensionConstraints.min_height_mm}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-brand-primary"
                  />
                </div>
              )}
            </div>
            {customWidth && customHeight && (
              <p className="text-xs text-brand-text-muted">
                Area: <span className="font-medium text-brand-text">{(Number(customWidth) * Number(customHeight)).toLocaleString()} mm²</span>
              </p>
            )}
          </div>
        </>
      )}

      {/* Parameter selectors */}
      {parameters.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-text-muted">
              Options
            </h3>
            <ParameterSelector
              parameters={parameters}
              values={paramValues}
              onChange={handleParamChange}
            />
          </div>
        </>
      )}

      {/* ── Sponsor / Logo Zones ─────────────────────────────────────────── */}
      {sponsorZones.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-text-muted">
                Sponsor / Logo Zones
              </h3>
              <p className="mt-1 text-xs text-brand-text-muted">
                Enter a URL for each sponsor logo (PNG or SVG, transparent background recommended).
              </p>
            </div>
            {sponsorZones.map((zone) => (
              <div key={zone.key} className="space-y-1.5">
                <Label htmlFor={`sponsor-${zone.key}`}>
                  {zone.label}
                  {zone.description && (
                    <span className="ml-2 text-xs font-normal text-brand-text-muted">
                      {zone.description}
                    </span>
                  )}
                </Label>
                <Input
                  id={`sponsor-${zone.key}`}
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={sponsorValues[zone.key] ?? ''}
                  onChange={(e) =>
                    setSponsorValues((prev) => ({ ...prev, [zone.key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}

      <Separator />

      {/* Quantity selector */}
      <div className="space-y-2">
        <Label>Quantity</Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </Button>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val) && val >= 1) setQuantity(val)
            }}
            className="h-9 w-20 rounded-md border border-input bg-transparent text-center text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(1)}
            aria-label="Increase quantity"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Price calculator */}
      <PriceCalculator
        productGroupId={productGroupId}
        selectedParams={allParams}
        quantity={quantity}
      />

      <Separator />

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {selectedTemplateId && (
          <>
            <Button
              asChild
              className="flex-1 bg-brand-primary text-white hover:bg-brand-primary-dark"
              size="lg"
            >
              <Link href={`/designer/${selectedTemplateId}`}>Design Now</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link href={`/designer/${selectedTemplateId}?mode=upload`}>
                Upload Artwork
              </Link>
            </Button>
          </>
        )}
      </div>

      {/* ── CSV Variable Data (events division only) ──────────────────────── 
      {isEventsProduct && selectedTemplateId && (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-2xl">📋</div>
            <div className="flex-1">
              <p className="font-semibold text-brand-text text-sm">Variable Data (CSV)</p>
              <p className="mt-0.5 text-xs text-brand-text-muted">
                Bulk-generate personalised race numbers, names, or event tags from a spreadsheet.
                Upload a CSV with each row representing one item — up to 5,000 entries per batch.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3 border-brand-primary text-brand-primary hover:bg-brand-primary/5">
                <Link href={`/designer/${selectedTemplateId}/csv`}>
                  Upload CSV →
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}*/}
    </div>
  )
}
