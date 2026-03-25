import type { Metadata } from 'next'
import Link from 'next/link'
import { XCircle, ArrowRight } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: `Payment Cancelled | ${SITE_NAME}`,
}

export default function CheckoutCancelPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-md border border-gray-100 bg-white p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-red-50">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <div className="h-1 w-8 bg-brand-primary mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-brand-text">Payment cancelled</h1>
          <p className="mt-3 text-sm text-brand-text-muted leading-relaxed">
            Your payment was cancelled. Don&apos;t worry — your order has been saved and you can try again whenever you&apos;re ready.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/cart"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
            >
              Return to cart <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
