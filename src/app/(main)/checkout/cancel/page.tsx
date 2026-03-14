import type { Metadata } from 'next'
import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: `Payment Cancelled | ${SITE_NAME}`,
}

export default function CheckoutCancelPage() {
  return (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-lg px-4 text-center">
        <div className="flex justify-center">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="mt-6 font-heading text-3xl font-bold text-brand-text">
          Payment Cancelled
        </h1>
        <p className="mt-4 text-brand-text-muted">
          Your payment was cancelled. Don&apos;t worry — your order has been
          saved and you can try again whenever you&apos;re ready.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/cart">
            <Button className="w-full bg-brand-primary text-white hover:bg-brand-primary-dark sm:w-auto">
              Return to Cart
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
