'use client'

import { useEffect, useState, useCallback } from 'react'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils/format'
import type { PriceResult } from '@/lib/pricing/calculator'

interface PriceCalculatorProps {
  productGroupId: string
  selectedParams: Record<string, string>
  quantity: number
}

export function PriceCalculator({
  productGroupId,
  selectedParams,
  quantity,
}: PriceCalculatorProps) {
  const [price, setPrice] = useState<PriceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrice = useCallback(async () => {
    if (quantity < 1) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/products/${productGroupId}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
          params: selectedParams,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to calculate price')
        setPrice(null)
        return
      }

      setPrice(data.price)
    } catch {
      setError('Failed to calculate price')
      setPrice(null)
    } finally {
      setLoading(false)
    }
  }, [productGroupId, selectedParams, quantity])

  useEffect(() => {
    const timer = setTimeout(fetchPrice, 300)
    return () => clearTimeout(timer)
  }, [fetchPrice])

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-32 rounded bg-brand-gray-light" />
        <div className="h-6 w-40 rounded bg-brand-gray-light" />
        <div className="h-4 w-24 rounded bg-brand-gray-light" />
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

  if (!price) {
    return (
      <div className="text-sm text-brand-gray-medium">
        Select options to see pricing
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Breakdown */}
      <div className="space-y-1.5">
        {price.breakdown
          .filter((item) => !item.label.startsWith('Subtotal'))
          .map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-brand-gray-medium">{item.label}</span>
              <span
                className={
                  item.amount < 0
                    ? 'text-green-600 font-medium'
                    : 'text-brand-gray'
                }
              >
                {item.amount < 0 ? '-' : ''}
                {formatCurrency(Math.abs(item.amount))}
              </span>
            </div>
          ))}
      </div>

      <Separator />

      {/* Unit price */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-brand-gray-medium">Unit price</span>
        <span className="font-medium text-brand-black">
          {formatCurrency(price.unitPrice)}
        </span>
      </div>

      {/* Quantity */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-brand-gray-medium">Quantity</span>
        <span className="font-medium text-brand-black">{quantity}</span>
      </div>

      <Separator />

      {/* Subtotal */}
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-brand-black">
          Subtotal
        </span>
        <span className="text-xl font-bold text-brand-red">
          {formatCurrency(price.subtotal)}
        </span>
      </div>

      <p className="text-xs text-brand-gray-medium">
        Excl. VAT. Shipping calculated at checkout.
      </p>
    </div>
  )
}
