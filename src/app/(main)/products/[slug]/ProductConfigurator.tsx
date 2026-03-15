'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
import type { ProductTemplate, TemplateParameter, PricingRule } from '@/types'

interface ProductConfiguratorProps {
  productGroupId: string
  templates: (ProductTemplate & { template_parameters: TemplateParameter[] })[]
  pricingRules: PricingRule[]
  onTemplateChange?: (templateId: string) => void
}

export function ProductConfigurator({
  productGroupId,
  templates,
  onTemplateChange: onTemplateChangeCallback,
}: ProductConfiguratorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id ?? ''
  )
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    // Initialize with default values from the first template's parameters
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

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  )

  const parameters = useMemo(
    () => selectedTemplate?.template_parameters ?? [],
    [selectedTemplate]
  )

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId)
    // Reset param values with new template defaults
    const template = templates.find((t) => t.id === templateId)
    const defaults: Record<string, string> = {}
    if (template) {
      for (const param of template.template_parameters) {
        if (param.default_value) {
          defaults[param.param_key] = param.default_value
        }
      }
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

  return (
    <div className="space-y-6">
      {/* Template selector (if multiple templates) */}
      {templates.length > 1 && (
        <div className="space-y-2">
          <Label>Template</Label>
          <Select
            value={selectedTemplateId}
            onValueChange={handleTemplateChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                  {template.description && (
                    <span className="ml-2 text-muted-foreground">
                      -- {template.description}
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
        <div className="rounded-lg bg-brand-bg p-3 text-xs text-brand-gray-medium">
          Print size: {selectedTemplate.print_width_mm} x{' '}
          {selectedTemplate.print_height_mm} mm | {selectedTemplate.dpi} DPI |
          Bleed: {selectedTemplate.bleed_mm} mm
        </div>
      )}

      {/* Parameter selectors */}
      {parameters.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gray-medium">
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
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 12H4"
              />
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
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Price calculator */}
      <PriceCalculator
        productGroupId={productGroupId}
        selectedParams={paramValues}
        quantity={quantity}
      />

      <Separator />

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {selectedTemplateId && (
          <>
            <Button
              asChild
              className="flex-1 bg-brand-red text-white hover:bg-brand-red-light"
              size="lg"
            >
              <Link href={`/designer/${selectedTemplateId}`}>
                Design Now
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Link
                href={`/designer/${selectedTemplateId}?mode=upload`}
              >
                Upload Artwork
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
