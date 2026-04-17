'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'
import { SA_PROVINCES, FLAT_SHIPPING_RATE, FREE_DELIVERY_THRESHOLD } from '@/lib/utils/constants'
import { toast } from 'sonner'
import { Check, ChevronDown, ShieldCheck, Truck, AlertCircle, CreditCard, ArrowRight, ChevronLeft, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

const shippingSchema = z.object({
  full_name: z.string().min(3, 'Full name is required (min 3 chars)'),
  address_line1: z.string().min(5, 'Address is required (min 5 chars)'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(1, 'Please select a province'),
  postal_code: z.string().regex(/^[0-9A-Za-z\s\-]{3,10}$/, 'Invalid postal code'),
  phone: z.string().regex(/^[0-9+\-\s()]{10,15}$/, 'Invalid phone number (10-15 digits)'),
  country: z.string().default('ZA'),
})

type ShippingData = z.infer<typeof shippingSchema>

interface ShippingRate {
  id: number
  service_level_code: string
  service_name: string
  provider_slug: string
  total_price: number
  min_delivery_date?: string
  max_delivery_date?: string
}

const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-colors placeholder:text-gray-300 bg-white"
const LABEL = "block text-xs font-medium text-gray-500 mb-1"
const ERROR = "mt-1 flex items-center gap-1 text-xs text-red-500"

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items } = useCart()

  const selectedItems = useMemo(() => items.filter(i => i.selected !== false), [items])
  const subtotal = useMemo(() => selectedItems.reduce((s, i) => s + i.line_total, 0), [selectedItems])
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingData, string>>>({})
  const [paymentMethod, setPaymentMethod] = useState<'switch' | 'stripe' | 'pay_later'>('switch')

  // Shipping rate state
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [loadingRates, setLoadingRates] = useState(false)
  const [ratesFallback, setRatesFallback] = useState(false)

  const [shipping, setShipping] = useState<ShippingData>({
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'ZA',
    phone: '',
  })

  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)

  // Compute effective shipping cost
  const shippingCost = useMemo(() => {
    if (isFreeDelivery) return 0
    if (selectedRate) return selectedRate.total_price
    if (ratesFallback) return FLAT_SHIPPING_RATE
    return 0 // while loading
  }, [isFreeDelivery, selectedRate, ratesFallback])

  const vatAmount = useMemo(() => subtotal * 0.15, [subtotal])
  const orderTotal = useMemo(() => subtotal + vatAmount + shippingCost, [subtotal, vatAmount, shippingCost])

  useEffect(() => {
    if (user) {
      setShipping(prev => ({
        ...prev,
        full_name: user.full_name || '',
        phone: user.phone || '',
      }))
      const fetchAddresses = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
        if (data && data.length > 0) {
          setSavedAddresses(data)
          const def = data.find((a: any) => a.is_default) || data[0]
          setSelectedAddressId(def.id)
          setShipping(prev => ({
            ...prev,
            address_line1: def.address_line1,
            address_line2: def.address_line2 || '',
            city: def.city,
            province: def.province,
            postal_code: def.postal_code,
          }))
        }
      }
      fetchAddresses()
    }
  }, [user])

  const handleSelectSavedAddress = (addr: any) => {
    setSelectedAddressId(addr.id)
    setErrors({})
    setShipping(prev => ({
      ...prev,
      full_name: addr.full_name || prev.full_name,
      phone: addr.phone || prev.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      city: addr.city,
      province: addr.province,
      postal_code: addr.postal_code,
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target
    let value = e.target.value
    if (name === 'phone') value = value.replace(/[^0-9+\-\s()]/g, '')
    if (name === 'postal_code') value = value.replace(/[^0-9]/g, '')
    setShipping(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof ShippingData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const fieldSchema = (shippingSchema as any).shape[name]
    if (fieldSchema) {
      const result = fieldSchema.safeParse(value)
      if (!result.success) {
        setErrors(prev => ({ ...prev, [name]: result.error.issues[0].message }))
      } else {
        setErrors(prev => ({ ...prev, [name]: undefined }))
      }
    }
  }

  const validateStep1 = () => {
    const result = shippingSchema.safeParse(shipping)
    if (!result.success) {
      const fieldErrors: any = {}
      result.error.issues.forEach(issue => { fieldErrors[issue.path[0]] = issue.message })
      setErrors(fieldErrors)
      toast.error(Object.values(fieldErrors)[0] as string || 'Please fix the errors')
      return false
    }
    setErrors({})
    return true
  }

  const fetchShippingRates = async () => {
    if (isFreeDelivery) {
      setShippingRates([])
      setSelectedRate(null)
      return
    }
    setLoadingRates(true)
    setShippingRates([])
    setSelectedRate(null)
    setRatesFallback(false)
    try {
      const res = await fetch('/api/courier/gobob/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress: shipping, cartSubtotal: subtotal }),
      })
      const data = await res.json()
      if (data.fallback || !data.rates?.length) {
        setRatesFallback(true)
      } else {
        const sorted: ShippingRate[] = [...data.rates].sort((a, b) => a.total_price - b.total_price)
        setShippingRates(sorted)
        setSelectedRate(sorted[0]) // auto-select cheapest
      }
    } catch {
      setRatesFallback(true)
    } finally {
      setLoadingRates(false)
    }
  }

  const handleContinue = async () => {
    if (!validateStep1()) return
    window.scrollTo({ top: 0 })
    await fetchShippingRates()
    setStep(2)
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please log in to complete your purchase')
      return
    }

    if (!isFreeDelivery && !selectedRate && !ratesFallback) {
      toast.error('Please select a shipping method')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // Determine service type for Bob Go booking
      const gobobServiceType = selectedRate
        ? `${selectedRate.provider_slug}|${selectedRate.service_level_code}`
        : null

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          status: 'pending_payment',
          subtotal,
          tax: vatAmount,
          shipping_cost: shippingCost,
          total: orderTotal,
          shipping_address: shipping,
          billing_address: shipping,
          gobob_service_type: gobobServiceType,
          gobob_quoted_rate: selectedRate?.total_price ?? null,
        })
        .select()
        .single()

      if (orderError) throw orderError

      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const toUUIDOrNull = (v: string | undefined | null) => v && UUID_RE.test(v) ? v : null

      const orderItems = selectedItems.map(item => ({
        order_id: order.id,
        product_group_id: toUUIDOrNull(item.product_group_id),
        product_template_id: toUUIDOrNull(item.product_template_id),
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        selected_params: item.selected_params,
        design_id: item.design_id || null,
        csv_job_id: item.csv_job_id || null,
        status: item.csv_job_id ? ('proof_sent' as const) : ('pending_design' as const),
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) throw itemsError

      if (paymentMethod === 'pay_later') {
        router.push(`/checkout/success?order_id=${order.id}`)
        return
      }

      const endpoint = paymentMethod === 'switch' ? '/api/checkout/switch' : '/api/checkout/stripe'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })

      const result = await response.json()

      if (paymentMethod === 'switch' && result.formData) {
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = result.paymentUrl
        Object.entries(result.formData).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = value as string
          form.appendChild(input)
        })
        document.body.appendChild(form)
        form.submit()
      } else if (result.url) {
        window.location.href = result.url
      } else {
        throw new Error(result.error || 'Payment initialization failed')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if ((items.length === 0 || selectedItems.length === 0) && !loading) {
      router.push('/cart')
    }
  }, [items.length, selectedItems.length, loading, router])

  if (items.length === 0 || selectedItems.length === 0) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
          <div className="mt-4 flex items-center gap-2 text-sm">
            {['Shipping', 'Review & Pay'].map((label, i) => {
              const num = i + 1
              const active = step === num
              const done = step > num
              return (
                <div key={label} className="flex items-center gap-2">
                  {i > 0 && <div className="h-px w-8 bg-gray-200" />}
                  <div className={cn(
                    'flex items-center gap-1.5',
                    active ? 'text-red-600 font-medium' : done ? 'text-green-600' : 'text-gray-400'
                  )}>
                    <div className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold',
                      active ? 'bg-red-600 text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                    )}>
                      {done ? <Check className="h-3 w-3" /> : num}
                    </div>
                    {label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">

            {step === 1 ? (
              <>
                {/* Saved addresses */}
                {savedAddresses.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-4 text-sm font-semibold text-gray-700">Saved Addresses</h2>
                    <div className="space-y-2">
                      {savedAddresses.map(addr => (
                        <button
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={cn(
                            'w-full flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
                            selectedAddressId === addr.id
                              ? 'border-red-600 bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <div className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                            selectedAddressId === addr.id ? 'border-red-600 bg-red-600' : 'border-gray-300'
                          )}>
                            {selectedAddressId === addr.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{addr.address_line1}</p>
                            <p className="text-gray-500">{addr.city}, {addr.province} {addr.postal_code}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedAddressId(null)}
                      className="mt-3 text-xs text-gray-500 underline hover:text-gray-700"
                    >
                      + Enter a different address
                    </button>
                  </div>
                )}

                {/* Shipping form */}
                {(savedAddresses.length === 0 || selectedAddressId === null) && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-5 text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-400" /> Shipping Address
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={LABEL}>Full Name *</label>
                        <input name="full_name" placeholder="John Doe" value={shipping.full_name} onChange={handleInputChange} onBlur={handleBlur} className={cn(INPUT, errors.full_name && 'border-red-300')} />
                        {errors.full_name && <p className={ERROR}><AlertCircle className="h-3 w-3" /> {errors.full_name}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>Phone *</label>
                        <input name="phone" type="tel" inputMode="tel" placeholder="+27 82 123 4567" value={shipping.phone} onChange={handleInputChange} onBlur={handleBlur} className={cn(INPUT, errors.phone && 'border-red-300')} />
                        {errors.phone && <p className={ERROR}><AlertCircle className="h-3 w-3" /> {errors.phone}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <label className={LABEL}>Street Address *</label>
                        <input name="address_line1" placeholder="123 Main Street" value={shipping.address_line1} onChange={handleInputChange} onBlur={handleBlur} className={cn(INPUT, errors.address_line1 && 'border-red-300')} />
                        {errors.address_line1 && <p className={ERROR}><AlertCircle className="h-3 w-3" /> {errors.address_line1}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <label className={LABEL}>Suburb / Unit (optional)</label>
                        <input name="address_line2" placeholder="Strydompark / Unit 4" value={shipping.address_line2} onChange={handleInputChange} className={INPUT} />
                      </div>
                      <div>
                        <label className={LABEL}>City *</label>
                        <input name="city" placeholder="Cape Town" value={shipping.city} onChange={handleInputChange} onBlur={handleBlur} className={cn(INPUT, errors.city && 'border-red-300')} />
                        {errors.city && <p className={ERROR}><AlertCircle className="h-3 w-3" /> {errors.city}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>Province *</label>
                        <div className="relative">
                          <select name="province" value={shipping.province} onChange={handleInputChange} onBlur={handleBlur} className={cn(INPUT, 'appearance-none pr-8', errors.province && 'border-red-300')}>
                            <option value="">Select province</option>
                            {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>
                        {errors.province && <p className={ERROR}><AlertCircle className="h-3 w-3" /> {errors.province}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>Postal Code *</label>
                        <input name="postal_code" inputMode="numeric" placeholder="8001" value={shipping.postal_code} onChange={handleInputChange} onBlur={handleBlur} className={cn(INPUT, errors.postal_code && 'border-red-300')} />
                        {errors.postal_code && <p className={ERROR}><AlertCircle className="h-3 w-3" /> {errors.postal_code}</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs text-gray-400">
                    <ShieldCheck className="h-4 w-4 text-green-500" /> SSL encrypted checkout
                  </p>
                  <button
                    onClick={handleContinue}
                    disabled={loadingRates}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {loadingRates ? (
                      <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Getting rates…</>
                    ) : (
                      <>Continue <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Order items */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-sm font-semibold text-gray-700">Your Items</h2>
                  <div className="divide-y divide-gray-100">
                    {selectedItems.map(item => (
                      <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                          {item.thumbnail_url ? (
                            <Image src={item.thumbnail_url} alt={item.product_name} fill className="object-contain p-1" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-300">No image</div>
                          )}
                          <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-[10px] font-semibold text-white">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                          <p className="text-xs text-gray-400">{item.template_name}</p>
                          <p className="text-xs text-gray-400">{formatCurrency(item.unit_price)} / unit</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.line_total)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping address summary */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-700">Shipping To</h2>
                    <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 underline">
                      <ChevronLeft className="h-3 w-3" /> Edit
                    </button>
                  </div>
                  <p className="text-sm text-gray-800">{shipping.full_name} &middot; {shipping.phone}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {shipping.address_line1}{shipping.address_line2 ? `, ${shipping.address_line2}` : ''}, {shipping.city}, {shipping.province} {shipping.postal_code}
                  </p>
                </div>

                {/* Shipping method selection */}
                {!isFreeDelivery && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-4 text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" /> Shipping Method
                    </h2>

                    {loadingRates ? (
                      <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
                        Fetching shipping rates…
                      </div>
                    ) : ratesFallback ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-3">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-red-600 bg-red-600">
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Standard Delivery</p>
                          <p className="text-xs text-gray-500">Estimated 3–5 business days</p>
                        </div>
                        <span className="ml-auto text-sm font-semibold text-gray-900">{formatCurrency(FLAT_SHIPPING_RATE)}</span>
                      </div>
                    ) : shippingRates.length > 0 ? (
                      <div className="space-y-2">
                        {shippingRates.map(rate => {
                          const isSelected = selectedRate?.id === rate.id
                          return (
                          <button
                            key={rate.id}
                            type="button"
                            onClick={() => setSelectedRate(rate)}
                            className={cn(
                              'w-full flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
                              isSelected ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                            )}
                          >
                            <div className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                              isSelected ? 'border-red-600 bg-red-600' : 'border-gray-300'
                            )}>
                              {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800">{rate.service_name}</p>
                              <p className="text-xs text-gray-400">
                                {rate.provider_slug}
                                {rate.min_delivery_date && rate.max_delivery_date
                                  ? ` · ${new Date(rate.min_delivery_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}–${new Date(rate.max_delivery_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}`
                                  : ''}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(rate.total_price)}</span>
                          </button>
                        )})}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Payment method */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-sm font-semibold text-gray-700">Payment Method</h2>
                  <div className="space-y-2">
                    {([
                      { id: 'switch', label: 'Switch', description: 'South African payment gateway' },
                      { id: 'stripe', label: 'Card (Stripe)', description: 'Credit or debit card' },
                      { id: 'pay_later', label: 'Pay Later / Proforma Invoice', description: 'We will send you an invoice — pay before production starts' },
                    ] as const).map(method => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
                          paymentMethod === method.id ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                          paymentMethod === method.id ? 'border-red-600 bg-red-600' : 'border-gray-300'
                        )}>
                          {paymentMethod === method.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{method.label}</p>
                          <p className="text-xs text-gray-400">{method.description}</p>
                        </div>
                        {paymentMethod === method.id && <Check className="ml-auto h-4 w-4 text-red-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || (!isFreeDelivery && !selectedRate && !ratesFallback)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Processing...</>
                  ) : paymentMethod === 'pay_later' ? (
                    <><ArrowRight className="h-4 w-4" /> Place Order (Pay Later)</>
                  ) : (
                    <><CreditCard className="h-4 w-4" /> Pay {formatCurrency(orderTotal)}</>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Secure SSL encrypted payment
                </p>
              </>
            )}
          </div>

          {/* Order summary sidebar */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''})</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT (15%)</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  {isFreeDelivery ? (
                    <span className="text-green-600 font-medium">Free</span>
                  ) : step === 1 ? (
                    <span className="text-gray-400 italic text-xs">calculated next</span>
                  ) : loadingRates ? (
                    <span className="text-gray-400 italic text-xs">loading…</span>
                  ) : (
                    <span>{formatCurrency(shippingCost)}</span>
                  )}
                </div>
                <div className="mt-3 border-t border-gray-100 pt-3 flex justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{step === 1 ? formatCurrency(subtotal + vatAmount) : formatCurrency(orderTotal)}</span>
                </div>
                {step === 1 && !isFreeDelivery && (
                  <p className="text-xs text-gray-400 italic">+ shipping (calculated on next step)</p>
                )}
              </div>

              {isFreeDelivery && (
                <p className="mt-4 rounded-md bg-green-50 border border-green-100 px-3 py-2 text-xs text-green-700">
                  🎉 You qualify for free delivery!
                </p>
              )}
            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}
