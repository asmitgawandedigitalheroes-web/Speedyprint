import {
  BASE_PRICE_PER_UNIT,
  BASE_SIZE_MM,
  DOMING_SURCHARGE,
  MATERIALS,
  FINISHES,
  ADHESION_TYPES,
  SHAPES,
  VOLUME_TIERS,
  VAT_RATE,
  FREE_DELIVERY_THRESHOLD,
} from '@/lib/utils/constants'

export interface QuickPriceInput {
  widthMm: number
  heightMm: number
  quantity: number
  material: string
  finish: string
  adhesion: string
  shape: string
  doming3d: boolean
}

export interface PriceBreakdownItem {
  label: string
  value: number
  type: 'multiplier' | 'surcharge' | 'subtotal' | 'tax' | 'total'
}

export interface QuickPriceResult {
  unitPrice: number
  subtotal: number
  vat: number
  total: number
  freeDelivery: boolean
  breakdown: PriceBreakdownItem[]
}

function getMultiplier(
  options: ReadonlyArray<{ value: string; multiplier: number }>,
  value: string
): number {
  const found = options.find((opt) => opt.value === value)
  return found?.multiplier ?? 1.0
}

function getVolumeTierMultiplier(quantity: number): number {
  for (const tier of VOLUME_TIERS) {
    if (quantity >= tier.min && quantity <= tier.max) {
      return tier.multiplier
    }
  }
  return 1.0
}

export function calculateQuickPrice(input: QuickPriceInput): QuickPriceResult {
  const breakdown: PriceBreakdownItem[] = []

  // 1. Size factor
  const sizeFactor =
    (input.widthMm * input.heightMm) / (BASE_SIZE_MM.width * BASE_SIZE_MM.height)

  // 2. Base price per unit
  let unitPrice = BASE_PRICE_PER_UNIT * sizeFactor
  breakdown.push({
    label: `Base price (${input.widthMm}x${input.heightMm}mm)`,
    value: unitPrice,
    type: 'subtotal',
  })

  // 3. Material multiplier
  const materialMultiplier = getMultiplier(MATERIALS, input.material)
  if (materialMultiplier !== 1.0) {
    unitPrice *= materialMultiplier
    const materialLabel =
      MATERIALS.find((m) => m.value === input.material)?.label ?? input.material
    breakdown.push({
      label: `Material: ${materialLabel}`,
      value: materialMultiplier,
      type: 'multiplier',
    })
  }

  // 4. Finish multiplier
  const finishMultiplier = getMultiplier(FINISHES, input.finish)
  if (finishMultiplier !== 1.0) {
    unitPrice *= finishMultiplier
    const finishLabel =
      FINISHES.find((f) => f.value === input.finish)?.label ?? input.finish
    breakdown.push({
      label: `Finish: ${finishLabel}`,
      value: finishMultiplier,
      type: 'multiplier',
    })
  }

  // 5. Adhesion multiplier
  const adhesionMultiplier = getMultiplier(ADHESION_TYPES, input.adhesion)
  if (adhesionMultiplier !== 1.0) {
    unitPrice *= adhesionMultiplier
    const adhesionLabel =
      ADHESION_TYPES.find((a) => a.value === input.adhesion)?.label ??
      input.adhesion
    breakdown.push({
      label: `Adhesion: ${adhesionLabel}`,
      value: adhesionMultiplier,
      type: 'multiplier',
    })
  }

  // 6. Shape multiplier
  const shapeMultiplier = getMultiplier(SHAPES, input.shape)
  if (shapeMultiplier !== 1.0) {
    unitPrice *= shapeMultiplier
    const shapeLabel =
      SHAPES.find((s) => s.value === input.shape)?.label ?? input.shape
    breakdown.push({
      label: `Shape: ${shapeLabel}`,
      value: shapeMultiplier,
      type: 'multiplier',
    })
  }

  // 7. 3D doming surcharge
  if (input.doming3d) {
    unitPrice += DOMING_SURCHARGE
    breakdown.push({
      label: '3D Doming',
      value: DOMING_SURCHARGE,
      type: 'surcharge',
    })
  }

  // 8. Volume tier discount
  const volumeMultiplier = getVolumeTierMultiplier(input.quantity)
  if (volumeMultiplier !== 1.0) {
    unitPrice *= volumeMultiplier
    const discount = Math.round((1 - volumeMultiplier) * 100)
    breakdown.push({
      label: `Volume discount (${discount}% off)`,
      value: volumeMultiplier,
      type: 'multiplier',
    })
  }

  // 9. Calculate totals
  const subtotal = unitPrice * input.quantity
  const vat = subtotal * VAT_RATE
  const total = subtotal + vat
  const freeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD

  breakdown.push(
    { label: 'Subtotal', value: subtotal, type: 'subtotal' },
    { label: 'VAT (15%)', value: vat, type: 'tax' },
    { label: 'Total', value: total, type: 'total' }
  )

  return {
    unitPrice: Math.round(unitPrice * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round(total * 100) / 100,
    freeDelivery,
    breakdown,
  }
}

export const DEFAULT_PRICE_INPUT: QuickPriceInput = {
  widthMm: 100,
  heightMm: 100,
  quantity: 1,
  material: 'white-vinyl',
  finish: 'gloss',
  adhesion: 'standard',
  shape: 'standard',
  doming3d: false,
}
