import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME } from '@/lib/utils/constants'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: `The page you're looking for doesn't exist. Browse ${SITE_NAME}'s custom printing products or return to the homepage.`,
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center bg-brand-bg">
      <div className="rounded-md border border-gray-100 bg-white p-12 max-w-md w-full">
        <div className="h-1 w-8 bg-brand-primary mx-auto mb-6" />
        <h1 className="font-heading text-7xl font-bold text-brand-primary">404</h1>
        <h2 className="mt-4 font-heading text-2xl font-semibold text-brand-text">Page not found</h2>
        <p className="mt-3 text-sm text-brand-text-muted">
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
          >
            Go home <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
          >
            Browse products
          </Link>
        </div>
      </div>
    </div>
  )
}
