import type { PricingRule } from '@/types'

export interface PriceBreakdown {
  label: string
  amount: number
}

export interface PriceResult {
  unitPrice: number
  subtotal: number
  breakdown: PriceBreakdown[]
}

export function calculatePrice(
  rules: PricingRule[],
  params: {
    quantity: number
    size?: string
    material?: string
    finish?: string
    [key: string]: unknown
  }
): PriceResult {
  const activeRules = rules.filter((r) => r.is_active)
  const breakdown: PriceBreakdown[] = []
  let unitPrice = 0
  const quantity = params.quantity || 1

  // Resolve applicable quantity break — prefer rules with extra matching conditions (e.g. print_option)
  // over generic qty-only rules, so print-option-specific pricing overrides the default.
  const QTY_META_KEYS = new Set(['min_qty', 'max_qty', 'discount_type', 'description'])
  const quantityRules = activeRules
    .filter((r) => r.rule_type === 'quantity_break')
    .sort((a, b) => {
      const minA = (a.conditions as { min_qty?: number }).min_qty ?? 0
      const minB = (b.conditions as { min_qty?: number }).min_qty ?? 0
      return minA - minB
    })

  let appliedQtyBreak: PricingRule | null = null
  let appliedQtyBreakSpecificity = -1
  for (const rule of quantityRules) {
    const cond = rule.conditions as Record<string, unknown>
    const minQty = (cond.min_qty as number) ?? 0
    const maxQty = (cond.max_qty as number) ?? Infinity
    if (quantity < minQty || quantity > maxQty) continue
    // Check extra conditions beyond qty range
    const extraKeys = Object.keys(cond).filter(k => !QTY_META_KEYS.has(k))
    const extraMatch = extraKeys.every(k => params[k] === cond[k])
    if (!extraMatch) continue
    // Prefer more specific (more matching condition keys)
    if (extraKeys.length >= appliedQtyBreakSpecificity) {
      appliedQtyBreak = rule
      appliedQtyBreakSpecificity = extraKeys.length
    }
  }

  const isFixedPrice =
    appliedQtyBreak !== null &&
    (appliedQtyBreak.conditions as { discount_type?: string }).discount_type !== 'percentage'

  // 1. Base price — use fixed_price break value if applicable, else base_price rule
  if (isFixedPrice && appliedQtyBreak) {
    unitPrice = appliedQtyBreak.price_value
    breakdown.push({
      label: `Base price (qty ${quantity})`,
      amount: appliedQtyBreak.price_value,
    })
  } else {
    const baseRule = activeRules
      .filter((r) => r.rule_type === 'base_price')
      .sort((a, b) => a.display_order - b.display_order)[0]

    if (baseRule) {
      unitPrice = baseRule.price_value
      breakdown.push({ label: 'Base price', amount: baseRule.price_value })
    }
  }

  // 2. Apply size tier adjustment
  const sizeRules = activeRules.filter((r) => r.rule_type === 'size_tier')

  // Named size tier (e.g. "A4")
  if (params.size) {
    const matchedSize = sizeRules.find((r) => {
      const cond = r.conditions as { size?: string }
      return cond.size === params.size
    })
    if (matchedSize) {
      unitPrice += matchedSize.price_value
      breakdown.push({
        label: `Size: ${params.size}`,
        amount: matchedSize.price_value,
      })
    }
  }

  // Area-based size tier (adjustable dimensions) — matches when width_mm + height_mm provided
  const widthMm = params.width_mm ? Number(params.width_mm) : null
  const heightMm = params.height_mm ? Number(params.height_mm) : null
  if (widthMm && heightMm) {
    const areaMm2 = widthMm * heightMm

    // per_area_m2: price_value is R/m², unit price = rate × area_m²
    // Rules with more condition keys are more specific and take priority.
    const perAreaRules = activeRules.filter((r) => r.rule_type === 'per_area_m2')
    const perAreaRule = perAreaRules
      .sort((a, b) => {
        // More specific rules (more condition keys) come first
        const aKeys = Object.keys(a.conditions as object).filter((k) => k !== 'description').length
        const bKeys = Object.keys(b.conditions as object).filter((k) => k !== 'description').length
        return bKeys - aKeys
      })
      .find((r) => {
        const cond = r.conditions as Record<string, string>
        return Object.entries(cond)
          .filter(([k]) => k !== 'description')
          .every(([k, v]) => params[k] === v)
      })
    if (perAreaRule) {
      const areaM2 = areaMm2 / 1_000_000
      const areaPrice = Math.round(perAreaRule.price_value * areaM2 * 100) / 100
      unitPrice = areaPrice
      const areaEntry = { label: `Price (${widthMm}×${heightMm}mm @ R${perAreaRule.price_value}/m²)`, amount: areaPrice }
      if (breakdown.length > 0) {
        breakdown[breakdown.length - 1] = areaEntry
      } else {
        breakdown.push(areaEntry)
      }
    } else {
      // Stepped area size tier (legacy)
      const matchedArea = sizeRules
        .filter((r) => {
          const cond = r.conditions as { min_area_mm2?: number; max_area_mm2?: number }
          return cond.min_area_mm2 !== undefined || cond.max_area_mm2 !== undefined
        })
        .sort((a, b) => {
          const minA = (a.conditions as { min_area_mm2?: number }).min_area_mm2 ?? 0
          const minB = (b.conditions as { min_area_mm2?: number }).min_area_mm2 ?? 0
          return minA - minB
        })
        .find((r) => {
          const cond = r.conditions as { min_area_mm2?: number; max_area_mm2?: number }
          const min = cond.min_area_mm2 ?? 0
          const max = cond.max_area_mm2 ?? Infinity
          return areaMm2 >= min && areaMm2 <= max
        })
      if (matchedArea) {
        unitPrice += matchedArea.price_value
        breakdown.push({
          label: `Size: ${widthMm}×${heightMm} mm`,
          amount: matchedArea.price_value,
        })
      }
    }
  }

  // 3. Apply material addon
  if (params.material) {
    const materialRules = activeRules.filter(
      (r) => r.rule_type === 'material_addon'
    )
    const matchedMaterial = materialRules.find((r) => {
      const cond = r.conditions as { material?: string }
      return cond.material === params.material
    })
    if (matchedMaterial) {
      unitPrice += matchedMaterial.price_value
      breakdown.push({
        label: `Material: ${params.material}`,
        amount: matchedMaterial.price_value,
      })
    }
  }

  // 4. Apply finish addon — matches any single condition key against params
  // Supports conditions like {"finish":"Gloss"}, {"lamination":"Matt"}, {"finishing":"Gloss Lamination"}
  const finishRules = activeRules.filter((r) => r.rule_type === 'finish_addon')
  for (const rule of finishRules) {
    const cond = rule.conditions as Record<string, string>
    const condKey = Object.keys(cond).find((k) => k !== 'description')
    if (condKey && params[condKey] === cond[condKey]) {
      unitPrice += rule.price_value
      breakdown.push({
        label: `${cond[condKey]}`,
        amount: rule.price_value,
      })
      break // only apply one finish addon
    }
  }

  // 5. Apply option addons (generic key-based)
  const optionRules = activeRules.filter(
    (r) => r.rule_type === 'option_addon'
  )
  for (const rule of optionRules) {
    const cond = rule.conditions as Record<string, string>
    const condKey = Object.keys(cond)[0]
    if (condKey && params[condKey] === cond[condKey]) {
      unitPrice += rule.price_value
      breakdown.push({
        label: `${condKey}: ${cond[condKey]}`,
        amount: rule.price_value,
      })
    }
  }

  // 6. Apply percentage quantity discount (fixed_price already applied in step 1)
  if (appliedQtyBreak && !isFixedPrice) {
    const cond = appliedQtyBreak.conditions as { discount_type?: 'percentage' | 'fixed_price' }
    if (cond.discount_type === 'percentage') {
      const discount = unitPrice * (appliedQtyBreak.price_value / 100)
      unitPrice -= discount
      breakdown.push({
        label: `Quantity discount (${appliedQtyBreak.price_value}%)`,
        amount: -discount,
      })
    }
  }

  // Ensure non-negative
  unitPrice = Math.max(0, unitPrice)

  const subtotal = unitPrice * quantity
  breakdown.push({
    label: `Subtotal (${quantity} x ${unitPrice.toFixed(2)})`,
    amount: subtotal,
  })

  return {
    unitPrice: Math.round(unitPrice * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    breakdown,
  }
}
