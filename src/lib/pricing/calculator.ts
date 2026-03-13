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

  // 1. Find base price
  const baseRule = activeRules
    .filter((r) => r.rule_type === 'base_price')
    .sort((a, b) => a.display_order - b.display_order)[0]

  if (baseRule) {
    unitPrice = baseRule.price_value
    breakdown.push({ label: 'Base price', amount: baseRule.price_value })
  }

  // 2. Apply size tier adjustment
  if (params.size) {
    const sizeRules = activeRules.filter((r) => r.rule_type === 'size_tier')
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

  // 4. Apply finish addon
  if (params.finish) {
    const finishRules = activeRules.filter(
      (r) => r.rule_type === 'finish_addon'
    )
    const matchedFinish = finishRules.find((r) => {
      const cond = r.conditions as { finish?: string }
      return cond.finish === params.finish
    })
    if (matchedFinish) {
      unitPrice += matchedFinish.price_value
      breakdown.push({
        label: `Finish: ${params.finish}`,
        amount: matchedFinish.price_value,
      })
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

  // 6. Apply quantity break discounts (price overrides or percentage discounts)
  const quantity = params.quantity || 1
  const quantityRules = activeRules
    .filter((r) => r.rule_type === 'quantity_break')
    .sort((a, b) => {
      const minA = (a.conditions as { min_qty?: number }).min_qty ?? 0
      const minB = (b.conditions as { min_qty?: number }).min_qty ?? 0
      return minA - minB
    })

  let appliedQtyBreak: PricingRule | null = null
  for (const rule of quantityRules) {
    const cond = rule.conditions as { min_qty?: number; max_qty?: number }
    const minQty = cond.min_qty ?? 0
    const maxQty = cond.max_qty ?? Infinity
    if (quantity >= minQty && quantity <= maxQty) {
      appliedQtyBreak = rule
    }
  }

  if (appliedQtyBreak) {
    const cond = appliedQtyBreak.conditions as {
      discount_type?: 'percentage' | 'fixed_price'
    }
    if (cond.discount_type === 'percentage') {
      const discount = unitPrice * (appliedQtyBreak.price_value / 100)
      unitPrice -= discount
      breakdown.push({
        label: `Quantity discount (${appliedQtyBreak.price_value}%)`,
        amount: -discount,
      })
    } else {
      // fixed_price: the price_value IS the new unit price
      const diff = appliedQtyBreak.price_value - unitPrice
      if (diff !== 0) {
        unitPrice = appliedQtyBreak.price_value
        breakdown.push({
          label: `Quantity price (${quantity}+)`,
          amount: diff,
        })
      }
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
