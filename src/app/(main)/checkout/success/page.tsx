'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Package, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const { clearCart } = useCart()
  const { user } = useAuth()

  // BUG-009 FIX: Clear cart here — only after Stripe redirects back to this page.
  // This ensures the cart is preserved if the user abandons Stripe or their payment fails.
  useEffect(() => {
    clearCart()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-brand-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white px-8 py-10 rounded-xl shadow-sm border border-gray-100 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-brand-text mb-2 font-heading">Payment Successful!</h1>
        <p className="text-brand-text-muted mb-8 italic">Thank you for your order.</p>
        
        <div className="bg-brand-primary/5 rounded-lg p-5 mb-8 border border-brand-primary/10">
          <p className="text-sm font-medium text-brand-text mb-1 uppercase tracking-wider">Order ID</p>
          <p className="text-xl font-mono font-bold text-brand-primary">{orderId || 'Processing...'}</p>
        </div>

        <p className="text-sm text-brand-text-muted leading-relaxed mb-8">
          Your payment has been received and your order is now being processed. 
          You will receive an email confirmation shortly with your order details.
        </p>

        <div className="space-y-3">
          {user ? (
            <Link
              href={`/account/orders/${orderId}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark shadow-md hover:shadow-lg"
            >
              <Package className="h-4 w-4" /> View Order Status
            </Link>
          ) : (
            <Link
              href={`/track-order`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark shadow-md hover:shadow-lg"
            >
              <Package className="h-4 w-4" /> Track Your Order
            </Link>
          )}
          <Link
            href="/products"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 py-3 text-sm font-medium text-brand-text hover:bg-gray-50 transition"
          >
            Continue Shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-text-muted">Loading confirmation...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}
