import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: `Order Confirmed | ${SITE_NAME}`,
}

export default function CheckoutSuccessPage() {
  return (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-lg px-4 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-brand-accent" />
        </div>
        <h1 className="mt-6 font-heading text-3xl font-bold text-brand-text">
          Order Confirmed!
        </h1>
        <p className="mt-4 text-brand-text-muted">
          Thank you for your order. We&apos;ve received your payment and will
          begin processing your order shortly. You&apos;ll receive a
          confirmation email with your order details.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/account/orders">
            <Button className="w-full bg-brand-primary text-white hover:bg-brand-primary-dark sm:w-auto">
              View My Orders
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
