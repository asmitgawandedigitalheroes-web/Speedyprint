'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

function CancelPageContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-brand-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white px-8 py-10 rounded-xl shadow-sm border border-gray-100 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-brand-text mb-2 font-heading">Payment Cancelled</h1>
        <p className="text-brand-text-muted mb-8 italic">Something went wrong or you chose to go back.</p>

        <div className="bg-red-50/50 rounded-lg p-5 mb-8 border border-red-100 text-left">
          <p className="text-sm text-red-800 leading-relaxed font-medium">
            Your order has been saved but has not been paid for yet. 
            You can find it in your account and try paying again when you're ready.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/checkout"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark shadow-md hover:shadow-lg"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </Link>
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 py-3 text-sm font-medium text-brand-text hover:bg-gray-50 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CancelPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-text-muted">Loading...</p>
        </div>
      </div>
    }>
      <CancelPageContent />
    </Suspense>
  )
}
