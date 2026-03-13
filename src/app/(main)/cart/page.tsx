'use client'

import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils/format'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getTax, getTotal, getItemCount } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="text-6xl">🛒</div>
        <h1 className="mt-4 text-2xl font-bold text-brand-black">Your cart is empty</h1>
        <p className="mt-2 text-brand-gray-medium">Browse our products and start designing!</p>
        <Link href="/products" className="mt-6 inline-block rounded-lg bg-brand-red px-6 py-3 font-semibold text-white hover:bg-brand-red-light">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-brand-black">Shopping Cart ({getItemCount()} items)</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-lg border border-brand-gray-light bg-white p-4">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-brand-gray-medium">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.product_name} className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    'Preview'
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-medium text-brand-black">{item.product_name}</h3>
                    <p className="text-sm text-brand-gray-medium">{item.template_name}</p>
                    {Object.entries(item.selected_params).length > 0 && (
                      <p className="mt-1 text-xs text-brand-gray-medium">
                        {Object.entries(item.selected_params).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded border border-brand-gray-light hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded border border-brand-gray-light hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{formatCurrency(item.line_total)}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="sticky top-24 rounded-lg border border-brand-gray-light bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-brand-black">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-gray-medium">Subtotal</span>
                <span className="font-medium">{formatCurrency(getSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-gray-medium">VAT (15%)</span>
                <span className="font-medium">{formatCurrency(getTax())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-gray-medium">Shipping</span>
                <span className="text-brand-gray-medium">Calculated at checkout</span>
              </div>
              <hr className="border-brand-gray-light" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(getTotal())}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-6 block w-full rounded-lg bg-brand-red py-3 text-center font-semibold text-white transition hover:bg-brand-red-light"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/products"
              className="mt-3 block w-full text-center text-sm text-brand-gray-medium hover:text-brand-red"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
