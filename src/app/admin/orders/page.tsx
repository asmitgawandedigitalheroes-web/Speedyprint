'use client'

import { OrderPipeline } from '@/components/admin/OrderPipeline'

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and track all customer orders through the production pipeline
        </p>
      </div>

      {/* Order Pipeline with full features */}
      <OrderPipeline showBulkActions={true} limit={20} showPagination={true} />
    </div>
  )
}
