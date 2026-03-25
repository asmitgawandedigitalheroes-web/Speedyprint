'use client'

import { Suspense } from 'react'
import { OrderPipeline } from '@/components/admin/OrderPipeline'

// OrderPipeline uses useSearchParams → needs Suspense boundary
export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Order Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full visibility from quote through to completion — list or kanban view
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
        </div>
      }>
        <OrderPipeline showBulkActions={true} limit={20} showPagination={true} />
      </Suspense>
    </div>
  )
}
