'use client'

import { Suspense } from 'react'
import { OrderPipeline } from '@/components/admin/OrderPipeline'
import { PageHeader, SkeletonRows } from '@/components/admin/AdminUI'

// OrderPipeline uses useSearchParams → needs Suspense boundary
export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Pipeline"
        description="Full visibility from quote through to completion"
      />
      <Suspense fallback={
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <tbody><SkeletonRows rows={8} cols={6} /></tbody>
          </table>
        </div>
      }>
        <OrderPipeline showBulkActions={true} limit={20} showPagination={true} />
      </Suspense>
    </div>
  )
}
