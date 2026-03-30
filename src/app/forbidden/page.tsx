import Link from 'next/link'
import { ShieldX, Home, LogIn } from 'lucide-react'

interface ForbiddenPageProps {
  searchParams: Promise<{ from?: string }>
}

export default async function ForbiddenPage({ searchParams }: ForbiddenPageProps) {
  const { from } = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <ShieldX className="h-10 w-10 text-red-500" />
        </div>

        {/* Status code */}
        <p className="text-sm font-bold uppercase tracking-widest text-red-500">
          403 — Access Denied
        </p>

        {/* Heading */}
        <h1 className="mt-3 font-heading text-3xl font-bold text-gray-900">
          You don&apos;t have permission
        </h1>

        {/* Description */}
        <p className="mt-4 text-base text-gray-500">
          Your account doesn&apos;t have the required role to access this page.
          If you believe this is a mistake, please contact your administrator.
        </p>

        {from && (
          <p className="mt-2 rounded-md bg-gray-100 px-3 py-2 text-xs font-mono text-gray-400">
            Attempted to access: {from}
          </p>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 sm:w-auto"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href={`/login${from ? `?redirect=${encodeURIComponent(from)}` : ''}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
          >
            <LogIn className="h-4 w-4" />
            Sign in with different account
          </Link>
        </div>
      </div>
    </div>
  )
}
