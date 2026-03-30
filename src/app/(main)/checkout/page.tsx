'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'
import { SA_PROVINCES } from '@/lib/utils/constants'
import { livePricing } from '@/hooks/useSiteSettings'
import { toast } from 'sonner'
import { ArrowRight, Check } from 'lucide-react'

const INPUT_CLASS = 'w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
const LABEL_CLASS = 'mb-1.5 block text-xs font-medium uppercase tracking-widest text-brand-text-muted'

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, getSubtotal, getTax, getTotal, getShippingCost, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [shipping, setShipping] = useState({
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'ZA',
    phone: '',
  })

  useEffect(() => {
    if (user) {
      setShipping((prev) => ({
        ...prev,
        full_name: user.full_name || '',
        address_line1: user.address_line1 || '',
        address_line2: user.address_line2 || '',
        city: user.city || '',
        province: user.province || '',
        postal_code: user.postal_code || '',
        phone: user.phone || '',
      }))
    }
  }, [user])

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShipping((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validateShipping = (): boolean => {
    const required: Array<[keyof typeof shipping, string]> = [
      ['full_name', 'Full name'],
      ['address_line1', 'Address line 1'],
      ['city', 'City'],
      ['province', 'Province'],
      ['postal_code', 'Postal code'],
    ]
    for (const [field, label] of required) {
      if (!shipping[field]?.trim()) {
        toast.error(`${label} is required`)
        return false
      }
    }
    return true
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please log in to place an order')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const subtotal = getSubtotal()
      const tax = subtotal * livePricing.vatRate
      const shippingCost = getShippingCost()
      const total = subtotal + tax + shippingCost

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: '',
          status: 'pending_payment',
          subtotal,
          tax,
          shipping_cost: shippingCost,
          total,
          shipping_address: shipping,
          billing_address: shipping,
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_group_id: item.product_group_id,
        product_template_id: item.product_template_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        selected_params: item.selected_params,
        design_id: item.design_id || null,
        csv_job_id: item.csv_job_id || null,
        status: item.csv_job_id ? ('proof_sent' as const) : ('pending_design' as const),
      }))

      const { data: createdItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select()

      if (itemsError) throw itemsError

      // Automated Proofing for CSV items
      for (const item of createdItems || []) {
        if (item.csv_job_id) {
          // Fetch CSV job to get the combined proof URL
          const { data: job } = await supabase
            .from('csv_jobs')
            .select('column_mapping')
            .eq('id', item.csv_job_id)
            .single()

          const combinedProofUrl = job?.column_mapping?._combined_proof_url
          if (combinedProofUrl) {
            await supabase.from('proofs').insert({
              order_item_id: item.id,
              design_id: item.design_id,
              version: 1,
              proof_file_url: combinedProofUrl,
              status: 'pending',
            })
          }
        }
      }

      // Redirect to Stripe Checkout — clear cart ONLY after URL is confirmed
      const response = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id }),
      })

      const { url, error } = await response.json()

      if (url) {
        clearCart()
        window.location.href = url
      } else {
        throw new Error(error || 'Failed to initialize payment')
      }
    } catch (error) {
      toast.error('Failed to place order. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (items.length === 0 && !loading) router.push('/cart')
  }, [items.length, loading, router])

  if (items.length === 0) return null

  const steps = ['Shipping', 'Review & pay']

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-1 w-8 bg-brand-primary mb-3" />
          <h1 className="font-heading text-2xl font-bold text-brand-text">Checkout</h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Steps indicator */}
        <div className="mb-6 flex items-center gap-3">
          {steps.map((label, i) => {
            const isActive = step === i + 1
            const isDone = step > i + 1
            return (
              <button
                key={label}
                onClick={() => isDone && setStep(i + 1)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-brand-primary text-white' : isDone ? 'bg-brand-primary/10 text-brand-primary cursor-pointer' : 'bg-white border border-gray-200 text-brand-text-muted cursor-default'
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${isActive ? 'bg-white/20 text-white' : isDone ? 'bg-brand-primary text-white' : 'bg-gray-100 text-brand-text-muted'}`}>
                  {isDone ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="rounded-md border border-gray-100 bg-white p-6">
                <h2 className="font-heading text-base font-semibold text-brand-text mb-1">Shipping address</h2>
                <div className="h-px bg-gray-100 my-4" />
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={LABEL_CLASS}>Full name *</label>
                      <input name="full_name" value={shipping.full_name} onChange={handleShippingChange} required className={INPUT_CLASS} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Phone</label>
                      <input name="phone" value={shipping.phone} onChange={handleShippingChange} className={INPUT_CLASS} />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Address line 1 *</label>
                    <input name="address_line1" value={shipping.address_line1} onChange={handleShippingChange} required className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Address line 2</label>
                    <input name="address_line2" value={shipping.address_line2} onChange={handleShippingChange} className={INPUT_CLASS} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={LABEL_CLASS}>City *</label>
                      <input name="city" value={shipping.city} onChange={handleShippingChange} required className={INPUT_CLASS} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Province *</label>
                      <select name="province" value={shipping.province} onChange={handleShippingChange} required className={INPUT_CLASS}>
                        <option value="">Select…</option>
                        {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Postal code *</label>
                      <input name="postal_code" value={shipping.postal_code} onChange={handleShippingChange} required className={INPUT_CLASS} />
                    </div>
                  </div>
                  <button
                    onClick={() => { if (validateShipping()) setStep(2) }}
                    className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
                  >
                    Continue to review <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="rounded-md border border-gray-100 bg-white p-6">
                  <h2 className="font-heading text-base font-semibold text-brand-text mb-1">Order items</h2>
                  <div className="h-px bg-gray-100 my-4" />
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-brand-text">{item.product_name}</p>
                          <p className="text-xs text-brand-text-muted">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-brand-text">{formatCurrency(item.line_total)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-gray-100 bg-white p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-heading text-base font-semibold text-brand-text mb-1">Shipping to</h2>
                      <p className="mt-2 text-sm text-brand-text-muted leading-relaxed">
                        {shipping.full_name}<br />
                        {shipping.address_line1}<br />
                        {shipping.address_line2 && <>{shipping.address_line2}<br /></>}
                        {shipping.city}, {shipping.province} {shipping.postal_code}
                      </p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-xs font-medium text-brand-primary hover:text-brand-primary-dark transition">
                      Edit
                    </button>
                  </div>
                </div>

                <div className="rounded-md border border-gray-100 bg-brand-primary/5 p-4">
                  <p className="text-sm text-brand-text-muted text-center italic">
                    You will be redirected to <span className="font-bold text-brand-primary">Stripe</span> to complete your payment securely.
                  </p>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
                >
                  {loading ? 'Placing order…' : <>Place order <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div>
            <div className="sticky top-24 rounded-md border border-gray-100 bg-white p-6">
              <h2 className="font-heading text-base font-semibold text-brand-text mb-4">Summary</h2>
              <div className="h-px bg-gray-100 mb-4" />
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-text-muted">Subtotal</span>
                  <span className="text-brand-text">{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text-muted">VAT (15%)</span>
                  <span className="text-brand-text">{formatCurrency(getTax())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text-muted">Shipping</span>
                  {getShippingCost() === 0
                    ? <span className="text-green-600 font-medium">Free</span>
                    : <span className="text-brand-text">{formatCurrency(getShippingCost())}</span>
                  }
                </div>
              </div>
              <div className="my-4 h-px bg-gray-100" />
              <div className="flex justify-between">
                <span className="font-semibold text-brand-text">Total</span>
                <span className="font-heading text-xl font-bold text-brand-primary">{formatCurrency(getTotal())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
