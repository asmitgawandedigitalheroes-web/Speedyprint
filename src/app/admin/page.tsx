'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Package, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ORDER_STATUS_LABELS } from '@/lib/utils/constants'
import { DashboardStats } from '@/components/admin/DashboardStats'
import type { Order, Profile } from '@/types'

interface RecentOrder extends Omit<Order, 'profile'> {
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your print shop operations
        </p>
      </div>

      {/* Stats Cards */}
      <DashboardStats />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/admin/orders">
            <ShoppingCart className="mr-2 h-4 w-4" />
            View Orders
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <Package className="mr-2 h-4 w-4" />
            Manage Products
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/users">
            <Users className="mr-2 h-4 w-4" />
            View Users
          </Link>
        </Button>
      </div>

      {/* Recent Orders Table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/orders">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Order #</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
                    </td>
                  </tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const statusInfo =
                    ORDER_STATUS_LABELS[order.status] ??
                    ORDER_STATUS_LABELS['draft']

                  return (
                    <tr
                      key={order.id}
                      className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <td className="px-4 py-3 font-mono font-medium">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {order.profile?.full_name ?? 'Unknown'}
                        </div>
                        {order.profile?.company_name && (
                          <div className="text-xs text-muted-foreground">
                            {order.profile.company_name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="secondary"
                          className={cn('text-xs', statusInfo.color)}
                        >
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/orders/${order.id}`)
                          }}
                        >
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
      </div>
    </div>
  )
}
