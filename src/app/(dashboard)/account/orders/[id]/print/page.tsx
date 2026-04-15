'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import type { Order, OrderItem } from '@/types'
import { Printer } from 'lucide-react'

export default function OrderPrintPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !id) return
    const supabase = createClient()

    async function fetchOrder() {
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id).eq('user_id', user!.id).single(),
        supabase
          .from('order_items')
          .select('*, product_group:product_groups(name)')
          .eq('order_id', id),
      ])
      setOrder(orderRes.data as Order | null)
      setItems((itemsRes.data as OrderItem[]) || [])
      setLoading(false)
    }

    fetchOrder()
  }, [user, id])

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Generating printable summary...</div>
  if (!order) return <div className="p-8 text-center text-red-600 font-bold">Order not found.</div>

  return (
    <div className="mx-auto max-w-[800px] bg-white p-10 font-sans text-brand-text print:p-0">
      {/* Print Controls (Hidden on Print) */}
      <div className="mb-8 flex items-center justify-between rounded-lg border border-brand-primary/20 bg-brand-bg px-6 py-4 print:hidden">
        <div>
          <h1 className="text-lg font-bold text-brand-text">Order Summary</h1>
          <p className="text-sm text-brand-text-muted">Print this page for your records.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-dark"
        >
          <Printer className="h-4 w-4" /> Print Now
        </button>
      </div>

      {/* Actual Statement */}
      <div className="border border-gray-200 p-10 shadow-sm print:border-none print:shadow-none">
        <div className="flex items-start justify-between border-b border-gray-100 pb-8">
          <div>
            <div className="text-2xl font-black uppercase tracking-tighter text-brand-primary">Speedy Print</div>
            <p className="mt-2 text-sm text-brand-text-muted">
              13 Langwa Street, Strydompark<br />
              Randburg, 2169<br />
              South Africa<br />
              info@speedyprint.co.za | 011 027 1811
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-brand-text">INVOICE</h2>
            <p className="mt-1 font-mono text-sm font-bold text-brand-primary">{order.order_number}</p>
            <p className="mt-4 text-sm text-brand-text-muted">Date: {formatDate(order.created_at)}</p>
            {order.payment_reference && (
              <p className="mt-1 text-xs text-brand-text-muted">Ref: {order.payment_reference}</p>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-12 border-b border-gray-100 pb-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">Billed To</h3>
            <div className="mt-2 text-sm leading-relaxed">
              <p className="font-bold text-brand-text">{user?.full_name}</p>
              <p>{user?.email}</p>
              {order.profile?.company_name && <p>{order.profile.company_name}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">Shipping Address</h3>
            <div className="mt-2 text-sm leading-relaxed">
              {order.shipping_address ? (
                <>
                  <p className="font-bold text-brand-text">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                  <p>{[order.shipping_address.city, order.shipping_address.province, order.shipping_address.postal_code].filter(Boolean).join(', ')}</p>
                </>
              ) : (
                <p>Digital Download / In-store Pickup</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-brand-text text-xs font-bold uppercase tracking-wider">
                <th className="py-4">Item Description</th>
                <th className="py-4 text-center">Qty</th>
                <th className="py-4 text-right">Price</th>
                <th className="py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-4">
                    <p className="font-bold text-brand-text">{(item.product_group as any)?.name || 'Product'}</p>
                    {item.selected_params && (
                      <p className="mt-0.5 text-xs text-brand-text-muted italic">
                        {Object.entries(item.selected_params).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                  </td>
                  <td className="py-4 text-center font-medium">{item.quantity}</td>
                  <td className="py-4 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="py-4 text-right font-bold text-brand-text">{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-[280px] space-y-3 pt-6 border-t-2 border-gray-100 text-sm">
            <div className="flex justify-between text-brand-text-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-brand-text-muted">
              <span>VAT (15%)</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between text-brand-text-muted">
              <span>Shipping</span>
              <span>{formatCurrency(order.shipping_cost)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-bold text-brand-primary">
              <span>Total CAD</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-xs text-brand-text-muted">
          <p>Thank you for choosing Speedy Print. We appreciate your business!</p>
          <p className="mt-1">All orders are subject to our terms and conditions available at speedyprint.co.za</p>
        </div>
      </div>
    </div>
  )
}
