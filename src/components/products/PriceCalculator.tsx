'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils/format'
import type { PriceResult } from '@/lib/pricing/calculator'

interface PriceCalculatorProps {
  productGroupId: string
  selectedParams: Record<string, string>
  quantity: number
  onPriceUpdate?: (result: PriceResult) => void
}

export function PriceCalculator({
  productGroupId,
  selectedParams,
  quantity,
  onPriceUpdate,
}: PriceCalculatorProps) {
  const [price, setPrice] = useState<PriceResult | null>(null)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep a ref to latest price so we never blank out the UI
  const priceRef = useRef<PriceResult | null>(null)

  const fetchPrice = useCallback(async () => {
    if (quantity < 1) return

    setUpdating(true)
    setError(null)

    try {
      const res = await fetch(`/api/products/${productGroupId}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, params: selectedParams }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to calculate price')
      } else {
        priceRef.current = data.price
        setPrice(data.price)
        onPriceUpdate?.(data.price)
      }
    } catch {
      setError('Failed to calculate price')
    } finally {
      setUpdating(false)
    }
  }, [productGroupId, selectedParams, quantity])

  useEffect(() => {
    const timer = setTimeout(fetchPrice, 250)
    return () => clearTimeout(timer)
  }, [fetchPrice])

  // Nothing loaded yet — show placeholder rows
  if (!price && !error) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {['Base price', 'Unit price', 'Quantity'].map((label) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-brand-text-muted">{label}</span>
              <span className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-brand-text">Subtotal</span>
          <span className="h-6 w-24 rounded bg-gray-100 animate-pulse" />
        </div>
        <p className="text-xs text-brand-text-muted">Excl. VAT. Shipping calculated at checkout.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">{error}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 transition-opacity duration-150 ${updating ? 'opacity-60' : 'opacity-100'}`}>
      {/* Breakdown rows */}
      <div className="space-y-1.5">
        {price!.breakdown
          .filter((item) => !item.label.startsWith('Subtotal'))
          .map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-brand-text-muted">{item.label}</span>
              <span className={item.amount < 0 ? 'text-green-600 font-medium' : 'text-brand-text-muted'}>
                {item.amount < 0 ? '-' : ''}{formatCurrency(Math.abs(item.amount))}
              </span>
            </div>
          ))}
      </div>

      <Separator />

      <div className="flex items-center justify-between text-sm">
        <span className="text-brand-text-muted">Unit price</span>
        <span className="font-medium text-brand-text">{formatCurrency(price!.unitPrice)}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-brand-text-muted">Quantity</span>
        <span className="font-medium text-brand-text">{quantity}</span>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-brand-text">Total</span>
        <span className="text-xl font-bold text-brand-primary">
          {formatCurrency(price!.realSubtotal)}
        </span>
      </div>

      {price!.minimumApplied && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-800">
            A minimum order of{' '}
            <span className="font-semibold">{formatCurrency(price!.minimumValue!)}</span>{' '}
            applies — increase your size or quantity to proceed.
          </p>
        </div>
      )}

      <p className="text-xs text-brand-text-muted">Excl. VAT. Shipping calculated at checkout.</p>
    </div>
  )
}
