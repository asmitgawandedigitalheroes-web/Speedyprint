'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MATERIALS, CURRENCY_SYMBOL } from '@/lib/utils/constants'
import {
  calculateQuickPrice,
  DEFAULT_PRICE_INPUT,
} from '@/lib/pricing/quick-calculator'

export function HeroCalculator() {
  const router = useRouter()
  const [width, setWidth] = useState(DEFAULT_PRICE_INPUT.widthMm)
  const [height, setHeight] = useState(DEFAULT_PRICE_INPUT.heightMm)
  const [quantity, setQuantity] = useState(100)
  const [material, setMaterial] = useState(DEFAULT_PRICE_INPUT.material)
  const [doming3d, setDoming3d] = useState(false)

  const price = useMemo(
    () =>
      calculateQuickPrice({
        widthMm: width,
        heightMm: height,
        quantity,
        material,
        finish: 'gloss',
        adhesion: 'standard',
        shape: 'standard',
        doming3d,
      }),
    [width, height, quantity, material, doming3d]
  )

  const handleOrderNow = () => {
    const params = new URLSearchParams({
      w: String(width),
      h: String(height),
      q: String(quantity),
      m: material,
      d: doming3d ? '1' : '0',
    })
    router.push(`/order-now?${params.toString()}`)
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-xl">
      <h3 className="mb-4 font-heading text-lg font-bold text-brand-secondary">
        Quick Price Calculator
      </h3>

      <div className="space-y-4">
        {/* Size */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="hero-width" className="text-xs text-brand-text-muted">
              Width (mm)
            </Label>
            <Input
              id="hero-width"
              type="number"
              min={10}
              max={2000}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value) || 10)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="hero-height" className="text-xs text-brand-text-muted">
              Height (mm)
            </Label>
            <Input
              id="hero-height"
              type="number"
              min={10}
              max={2000}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value) || 10)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Quantity */}
        <div>
          <Label htmlFor="hero-qty" className="text-xs text-brand-text-muted">
            Quantity
          </Label>
          <Input
            id="hero-qty"
            type="number"
            min={1}
            max={100000}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
            className="mt-1"
          />
        </div>

        {/* Material */}
        <div>
          <Label className="text-xs text-brand-text-muted">Material</Label>
          <Select value={material} onValueChange={setMaterial}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATERIALS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3D Doming */}
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={doming3d}
            onChange={(e) => setDoming3d(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
          />
          <span className="text-sm text-brand-text">Add 3D Doming (+{CURRENCY_SYMBOL}{3.5}/unit)</span>
        </label>

        {/* Price Display */}
        <div className="rounded-lg bg-brand-bg p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-brand-text-muted">Unit Price</span>
            <span className="text-sm font-medium">
              {CURRENCY_SYMBOL}{price.unitPrice.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm text-brand-text-muted">Subtotal</span>
            <span className="text-sm font-medium">
              {CURRENCY_SYMBOL}{price.subtotal.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm text-brand-text-muted">VAT (15%)</span>
            <span className="text-sm">
              {CURRENCY_SYMBOL}{price.vat.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 border-t pt-2">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-brand-text">Total</span>
              <span className="text-2xl font-bold text-brand-primary">
                {CURRENCY_SYMBOL}{price.total.toFixed(2)}
              </span>
            </div>
          </div>
          {price.freeDelivery && (
            <p className="mt-2 text-center text-xs font-medium text-brand-primary">
              Free delivery included!
            </p>
          )}
        </div>

        {/* CTA */}
        <Button
          onClick={handleOrderNow}
          className="w-full bg-brand-primary text-white hover:bg-brand-primary-dark"
          size="lg"
        >
          Order Now
        </Button>
      </div>
    </div>
  )
}
