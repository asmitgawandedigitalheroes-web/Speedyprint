'use client'

import { useEffect } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProductError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Auto-retry once on ChunkLoadError — happens when a new deployment
    // invalidates the old JS chunk URLs that were cached by the browser.
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      reset()
    }
  }, [error, reset])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-8 w-8 text-brand-primary" />
      </div>
      <h2 className="font-heading text-xl font-bold text-brand-text">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-sm text-sm text-brand-text-muted">
        This product page failed to load. This sometimes happens after a site update — try refreshing.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} className="gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh page
        </Button>
      </div>
    </div>
  )
}
