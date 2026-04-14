'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, Clock, Printer, Table, AlertCircle,
  ArrowRight, TrendingUp, CheckCircle2, Zap, Users,
  FileText, ArrowUpRight,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ORDER_STATUS_LABELS } from '@/lib/utils/constants'
import { DashboardStats } from '@/components/admin/DashboardStats'
import { PageHeader, SectionCard, SkeletonRows, StatusBadge } from '@/components/admin/AdminUI'
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

const STATUS_COLOR: Record<string, 'gray' | 'blue' | 'yellow' | 'orange' | 'green' | 'red' | 'purple'> = {
  draft: 'gray', pending_payment: 'yellow', paid: 'blue',
  pending_design: 'blue', proof_sent: 'orange', proof_approved: 'green',
  in_production: 'purple', shipped: 'blue', delivered: 'green',
  cancelled: 'red', refunded: 'red',
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [triage, setTriage] = useState({ pendingProofs: 0, readyForProduction: 0, processingCsv: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(data => {
        setRecentOrders(data.recentOrders ?? [])
        setTriage({
          pendingProofs:      data.stats?.pendingProofs      ?? 0,
          readyForProduction: data.stats?.readyForProduction ?? 0,
          processingCsv:      data.stats?.processingCsv      ?? 0,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const quickActions = [
    { href: '/admin/orders',     label: 'Orders',     icon: ShoppingCart, color: 'bg-red-50 text-brand-primary' },
    { href: '/admin/proofs',     label: 'Proofs',     icon: FileText,     color: 'bg-red-50 text-brand-primary' },
    { href: '/admin/production', label: 'Production', icon: Printer,      color: 'bg-red-50 text-brand-primary' },
    { href: '/admin/users',      label: 'Users',      icon: Users,        color: 'bg-red-50 text-brand-primary' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Full visibility from order to delivery"
      />

      {/* ── Attention Banners ── */}
      {!loading && (triage.pendingProofs > 0 || triage.readyForProduction > 0 || triage.processingCsv > 0) && (
        <div className="grid gap-3 sm:grid-cols-3">
          {triage.pendingProofs > 0 && (
            <Link href="/admin/proofs" className="group flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 transition-all hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-yellow-900">{triage.pendingProofs} Proof{triage.pendingProofs > 1 ? 's' : ''} Pending</p>
                <p className="text-xs text-yellow-700">Customer approval needed</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-yellow-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          {triage.readyForProduction > 0 && (
            <Link href="/admin/production" className="group flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 transition-all hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                <Printer className="h-5 w-5 text-orange-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-orange-900">{triage.readyForProduction} Ready to Print</p>
                <p className="text-xs text-orange-700">Generate print files</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-orange-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          {triage.processingCsv > 0 && (
            <Link href="/admin/csv" className="group flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 transition-all hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <Table className="h-5 w-5 text-blue-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-blue-900">{triage.processingCsv} CSV Job{triage.processingCsv > 1 ? 's' : ''} Running</p>
                <p className="text-xs text-blue-700">Variable data in progress</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-blue-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      )}

      {/* ── Stats ── */}
      <DashboardStats />

      {/* ── Recent Orders + Quick Actions ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">

        {/* Recent Orders */}
        <SectionCard
          title="Recent Orders"
          noPad
          actions={
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-primary-dark transition-colors">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Order</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Customer</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">Date</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Total</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows rows={5} cols={5} />
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">No orders yet</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const statusInfo = ORDER_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS['draft']
                    const badgeColor = STATUS_COLOR[order.status] ?? 'gray'
                    return (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-brand-primary">{order.order_number}</span>
                            {order.has_pending_proof && <span title="Pending proof" className="flex h-4 w-4 items-center justify-center rounded-full bg-yellow-100"><Clock className="h-2.5 w-2.5 text-yellow-600" /></span>}
                            {order.ready_for_production && <span title="Ready for production" className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-100"><Zap className="h-2.5 w-2.5 text-orange-600" /></span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-800">{order.profile?.full_name ?? 'Unknown'}</p>
                          {order.profile?.company_name && <p className="text-xs text-gray-400">{order.profile.company_name}</p>}
                        </td>
                        <td className="hidden px-5 py-3.5 text-xs text-gray-400 sm:table-cell">{formatDate(order.created_at)}</td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-800">{formatCurrency(order.total)}</td>
                        <td className="px-5 py-3.5 text-center">
                          <StatusBadge label={statusInfo.label} color={badgeColor} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Quick Actions */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Quick Access</p>
          {quickActions.map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className="flex-1 text-sm font-semibold text-gray-700 group-hover:text-brand-primary">{label}</span>
              <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-primary" />
            </Link>
          ))}

          {/* Attention cards */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Needs Attention</p>
            <Link href="/admin/proofs?status=revision_requested" className="group flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/50 p-3.5 transition-all hover:border-brand-primary hover:bg-red-50">
              <AlertCircle className="h-4 w-4 text-brand-primary" />
              <span className="flex-1 text-xs font-semibold text-brand-primary">Revision Requests</span>
              <ArrowRight className="h-3.5 w-3.5 text-brand-primary/40 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
            <Link href="/admin/production" className="group flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/50 p-3.5 transition-all hover:border-brand-primary hover:bg-red-50">
              <Printer className="h-4 w-4 text-brand-primary" />
              <span className="flex-1 text-xs font-semibold text-brand-primary">Generate Files</span>
              <ArrowRight className="h-3.5 w-3.5 text-brand-primary/40 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
            <Link href="/admin/csv" className="group flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/50 p-3.5 transition-all hover:border-brand-primary hover:bg-red-50">
              <CheckCircle2 className="h-4 w-4 text-brand-primary" />
              <span className="flex-1 text-xs font-semibold text-brand-primary">CSV Jobs</span>
              <ArrowRight className="h-3.5 w-3.5 text-brand-primary/40 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
