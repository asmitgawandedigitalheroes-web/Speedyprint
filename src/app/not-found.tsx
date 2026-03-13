import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME } from '@/lib/utils/constants'

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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-8xl font-bold text-brand-red">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-brand-black">Page Not Found</h2>
      <p className="mt-4 max-w-md text-brand-gray-medium">
        Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-lg bg-brand-red px-6 py-3 font-semibold text-white transition hover:bg-brand-red-light"
        >
          Go Home
        </Link>
        <Link
          href="/products"
          className="rounded-lg border border-brand-gray-light px-6 py-3 font-semibold text-brand-black transition hover:bg-brand-bg"
        >
          Browse Products
        </Link>
      </div>
    </div>
  )
}
