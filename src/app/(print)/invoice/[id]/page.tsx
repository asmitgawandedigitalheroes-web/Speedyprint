'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Order, OrderItem } from '@/types'

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>()
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/login'); return }
    if (!id) return

    const supabase = createClient()
    async function fetchOrderData() {
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from('orders').select('*, profile:profiles(company_name)').eq('id', id).eq('user_id', user!.id).single(),
        supabase.from('order_items').select('*, product_group:product_groups(name)').eq('order_id', id),
      ])
      setOrder(orderRes.data as Order | null)
      setItems((itemsRes.data as OrderItem[]) || [])
      setLoading(false)
    }
    fetchOrderData()
  }, [user, authLoading, id, router])

  /* Auto-open print dialog once data is rendered */
  useEffect(() => {
    if (!loading && order && !ready) {
      setReady(true)
      setTimeout(() => window.print(), 400)
    }
  }, [loading, order, ready])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-500">Generating invoice…</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-red-600">Order not found or access denied.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Print controls — hidden when printing */}
      <div className="print:hidden flex items-center justify-between bg-white border-b px-8 py-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-gray-800">Invoice — {order.order_number}</p>
          <p className="text-xs text-gray-500">Use your browser's print dialog to save as PDF.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-bold text-white shadow-sm shadow-brand-primary/20 transition-all hover:opacity-90 active:scale-95"
          >
            Print / Save PDF
          </button>
          <button
            onClick={() => window.close()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>

      {/* Invoice document */}
      <div className="mx-auto max-w-[800px] bg-white p-10 shadow-sm print:shadow-none print:p-0 my-6 print:my-0">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-8">
          <div>
            <div className="text-2xl font-black uppercase tracking-tight text-[#E30613]">Speedy Print</div>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              13 Langwa Street, Strydompark<br />
              Randburg, 2169, South Africa<br />
              info@speedyprint.co.za | 011 027 1811
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
            <p className="mt-1 font-mono text-sm font-bold text-[#E30613]">{order.order_number}</p>
            <p className="mt-4 text-sm text-gray-500">Date: {formatDate(order.created_at)}</p>
            {order.payment_reference && (
              <p className="mt-1 text-xs text-gray-500">Payment ref: {order.payment_reference}</p>
            )}
          </div>
        </div>

        {/* Billed to + Shipping */}
        <div className="mt-8 grid grid-cols-2 gap-12 border-b border-gray-100 pb-8">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Billed To</h2>
            <div className="mt-2 text-sm leading-relaxed text-gray-700">
              {user?.full_name && <p className="font-bold text-gray-900">{user.full_name}</p>}
              <p>{user?.email}</p>
              {(order as any).profile?.company_name && <p>{(order as any).profile.company_name}</p>}
            </div>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Shipping Address</h2>
            <div className="mt-2 text-sm leading-relaxed text-gray-700">
              {order.shipping_address ? (
                <>
                  {order.shipping_address.full_name && (
                    <p className="font-bold text-gray-900">{order.shipping_address.full_name}</p>
                  )}
                  {order.shipping_address.address_line1 && <p>{order.shipping_address.address_line1}</p>}
                  {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                  <p>
                    {[
                      order.shipping_address.city,
                      order.shipping_address.province,
                      order.shipping_address.postal_code,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </>
              ) : (
                <p className="text-gray-400 italic">Digital / In-store Pickup</p>
              )}
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="mt-8">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-600">
                <th className="pb-3">Description</th>
                <th className="pb-3 text-center">Qty</th>
                <th className="pb-3 text-right">Unit Price</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3">
                    <p className="font-semibold text-gray-900">
                      {(item.product_group as any)?.name || 'Product'}
                    </p>
                    {item.selected_params && Object.keys(item.selected_params).length > 0 && (
                      <p className="mt-0.5 text-xs text-gray-400 italic">
                        {Object.entries(item.selected_params)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 text-right font-semibold text-gray-900">{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-[260px] space-y-2 border-t-2 border-gray-100 pt-5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>VAT (15%)</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span>{formatCurrency(order.shipping_cost)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-[#E30613]">
              <span>Total (ZAR)</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          <p>Thank you for choosing Speedy Print — proudly South African.</p>
          <p className="mt-1">Terms & conditions: speedyprint.co.za/terms</p>
        </div>
      </div>
    </div>
  )
}
