'use client'

import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils/format'
import { livePricing } from '@/hooks/useSiteSettings'
import { Trash2, ArrowRight, ShoppingBag, Check } from 'lucide-react'

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    toggleSelection,
    selectAll,
    getSubtotal,
    getTax,
    getTotal,
    getItemCount,
    getSelectedCount
  } = useCart()

  const allSelected = items.length > 0 && items.every(i => i.selected !== false)
  const selectedCount = getSelectedCount()
  const totalItemsCount = items.length

  if (items.length === 0) {
    return (
      <div className="bg-brand-bg min-h-screen">
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="h-1 w-8 bg-brand-primary mb-3" />
            <h1 className="font-heading text-2xl font-bold text-brand-text">Shopping cart</h1>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-md border border-gray-100 bg-white p-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md border border-gray-100 bg-brand-bg">
              <ShoppingBag className="h-6 w-6 text-brand-primary" />
            </div>
            <p className="font-heading text-lg font-semibold text-brand-text">Your cart is empty</p>
            <p className="mt-1 text-sm text-brand-text-muted">Browse our products and start designing!</p>
            <Link href="/products" className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark">
              Browse products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-1 w-8 bg-brand-primary mb-3" />
          <h1 className="font-heading text-2xl font-bold text-brand-text">
            Shopping cart <span className="text-brand-text-muted font-normal text-lg">({getItemCount()} {getItemCount() === 1 ? 'item' : 'items'})</span>
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {/* Select All Toggle */}
            <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-white px-4 py-3">
              <button
                onClick={() => selectAll(!allSelected)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${allSelected
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-gray-300 bg-white'
                  }`}
              >
                {allSelected && <Check className="h-3.5 w-3.5 bold" />}
              </button>
              <span className="text-sm font-medium text-brand-text">
                Select all <span className="text-brand-text-muted font-normal">({totalItemsCount} items)</span>
              </span>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-md border p-4 transition ${item.selected !== false
                    ? 'border-brand-primary/20 bg-white'
                    : 'border-gray-100 bg-gray-50/50 grayscale-[0.5]'
                  }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelection(item.id)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${item.selected !== false
                      ? 'border-brand-primary bg-brand-primary text-white'
                      : 'border-gray-300 bg-white'
                    }`}
                >
                  {item.selected !== false && <Check className="h-3.5 w-3.5 bold" />}
                </button>

                <div className="flex flex-1 gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-gray-100 bg-brand-bg overflow-hidden">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt={item.product_name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-brand-text-muted">Preview</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-brand-text">{item.product_name}</h3>
                      <p className="text-sm text-brand-text-muted">{item.template_name}</p>
                      {Object.entries(item.selected_params).length > 0 && (
                        <p className="mt-1 text-xs text-brand-text-muted">
                          {Object.entries(item.selected_params).map(([k, v]) => {
                            const label = k
                              .replace(/_mm$/, '')
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, (c) => c.toUpperCase())
                            const unit = k.endsWith('_mm') ? 'mm' : ''
                            return `${label}: ${v}${unit}`
                          }).join(' · ')}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-brand-text-muted hover:border-brand-primary hover:text-brand-primary transition"
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-sm font-semibold text-brand-text">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-brand-text-muted hover:border-brand-primary hover:text-brand-primary transition"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-brand-text">{formatCurrency(item.line_total)}</span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-brand-text-muted hover:text-red-500 transition"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <div className="sticky top-24 rounded-md border border-gray-100 bg-white p-6">
              <h2 className="font-heading text-base font-semibold text-brand-text mb-4">Order summary</h2>
              <div className="h-px bg-gray-100 mb-4" />
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-text-muted">Subtotal</span>
                  <span className="font-medium text-brand-text">{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text-muted">VAT ({Math.round(livePricing.vatRate * 100)}%)</span>
                  <span className="font-medium text-brand-text">{formatCurrency(getTax())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text-muted">Shipping</span>
                  <span className="text-brand-text-muted">At checkout</span>
                </div>
              </div>
              <div className="my-4 h-px bg-gray-100" />
              <div className="flex justify-between">
                <span className="font-semibold text-brand-text">Total</span>
                <span className="font-heading text-xl font-bold text-brand-primary">{formatCurrency(getTotal())}</span>
              </div>
              <Link
                href={selectedCount > 0 ? "/checkout" : "#"}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm font-semibold text-white transition ${selectedCount > 0
                    ? 'bg-brand-primary hover:bg-brand-primary-dark cursor-pointer'
                    : 'bg-gray-300 cursor-not-allowed'
                  }`}
                onClick={(e) => selectedCount === 0 && e.preventDefault()}
              >
                {selectedCount === 0 ? 'Select items to checkout' : 'Proceed to checkout'} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/products"
                className="mt-3 block w-full text-center text-sm text-brand-text-muted hover:text-brand-primary transition"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
