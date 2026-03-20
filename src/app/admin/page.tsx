'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  Package,
  Users,
  ArrowRight,
  Printer,
  Clock,
  Table,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ORDER_STATUS_LABELS } from '@/lib/utils/constants'
import { DashboardStats } from '@/components/admin/DashboardStats'
import type { Profile } from '@/types'

interface RecentOrder {
  id: string
  order_number: string
  status: string
  created_at: string
  total: number
  item_count: number
  ready_for_production: boolean
  has_pending_proof: boolean
  profile: Pick<Profile, 'id' | 'full_name' | 'email' | 'company_name'> | null
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch('/api/admin/dashboard')
        if (!res.ok) throw new Error('Failed to fetch dashboard')
        const data = await res.json()
        setRecentOrders(data.recentOrders ?? [])
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecent()
  }, [])

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Full visibility from quote through to completion
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/orders">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Order Pipeline
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/production">
              <Printer className="mr-2 h-4 w-4" />
              Production
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/proofs">
              <CheckCircle className="mr-2 h-4 w-4" />
              Proofs
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/products">
              <Package className="mr-2 h-4 w-4" />
              Products
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/users">
              <Users className="mr-2 h-4 w-4" />
              Users
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats + Pipeline Bar + Division Breakdown */}
      <DashboardStats />

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-xs">
                  <th className="px-4 py-3 text-left font-medium">Order #</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Flags</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const statusInfo = ORDER_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS['draft']
                    return (
                      <tr
                        key={order.id}
                        className="cursor-pointer border-b transition-colors hover:bg-muted/40"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-brand-primary">{order.order_number}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{order.profile?.full_name ?? 'Unknown'}</p>
                          {order.profile?.company_name && (
                            <p className="text-xs text-muted-foreground">{order.profile.company_name}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(order.created_at)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="secondary" className={cn('text-xs', statusInfo.color)}>
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {order.ready_for_production && (
                              <span title="Ready for production" className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100">
                                <Printer className="h-3 w-3 text-orange-600" />
                              </span>
                            )}
                            {order.has_pending_proof && (
                              <span title="Awaiting proof review" className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100">
                                <Clock className="h-3 w-3 text-yellow-600" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); router.push(`/admin/orders/${order.id}`) }}>
                            View
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Attention areas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/proofs?status=revision_requested">
          <Card className="cursor-pointer border-yellow-100 transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Revision Requests</p>
                <p className="text-xs text-muted-foreground">Proofs needing attention</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/production">
          <Card className="cursor-pointer border-orange-100 transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                <Printer className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Generate Files</p>
                <p className="text-xs text-muted-foreground">Approved, awaiting print files</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/csv">
          <Card className="cursor-pointer border-blue-100 transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Table className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">CSV Jobs</p>
                <p className="text-xs text-muted-foreground">Variable data orders</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
