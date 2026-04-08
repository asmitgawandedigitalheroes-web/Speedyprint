'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'
import { SA_PROVINCES, SITE_NAME } from '@/lib/utils/constants'
import { livePricing } from '@/hooks/useSiteSettings'
import { toast } from 'sonner'
import { 
  ArrowRight, 
  Check, 
  ChevronLeft, 
  ChevronDown,
  ChevronRight,
  MapPin, 
  Phone, 
  User, 
  CreditCard,
  ShieldCheck,
  Truck,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Zod schema for professional validation
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

const INPUT_CLASSES = "block w-full rounded-2xl border-gray-100 bg-white px-5 py-3 text-sm font-medium transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 outline-none placeholder:text-gray-300 shadow-sm hover:border-gray-200"
const LABEL_CLASSES = "mb-1.5 block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 ml-1"
const ERROR_CLASSES = "mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 duration-200"

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, getSubtotal, getTax, getTotal, getShippingCost, clearCart } = useCart()
  
  const selectedItems = useMemo(() => items.filter(i => i.selected !== false), [items])
  
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Info, 2: Review
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingData, string>>>({})
  
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
  const [showManualForm, setShowManualForm] = useState(true)

  // Initialize with user info
  useEffect(() => {
    if (user) {
      setShipping((prev) => ({
        ...prev,
        full_name: user.full_name || '',
        phone: user.phone || '',
      }))

      const fetchSavedAddresses = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
        
        if (data && data.length > 0) {
          setSavedAddresses(data)
          const defaultAddr = data.find((addr: any) => addr.is_default) || data[0]
          setSelectedAddressId(defaultAddr.id)
          setShowManualForm(false)
          setShipping(prev => ({
            ...prev,
            address_line1: defaultAddr.address_line1,
            address_line2: defaultAddr.address_line2 || '',
            city: defaultAddr.city,
            province: defaultAddr.province,
            postal_code: defaultAddr.postal_code,
          }))
        }
      }
      fetchSavedAddresses()
    }
  }, [user])

  const handleSelectSavedAddress = (addr: any) => {
    setSelectedAddressId(addr.id)
    setShowManualForm(false)
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
    const { name, value } = e.target
    setShipping(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name as keyof ShippingData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateStep1 = () => {
    const result = shippingSchema.safeParse(shipping)
    if (!result.success) {
      const fieldErrors: any = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      
      // Force manual form to show if there are errors so user can see them
      setShowManualForm(true)
      
      const firstError = Object.values(fieldErrors)[0] as string
      toast.error(firstError || 'Please fix the errors in the form')
      return false
    }
    setErrors({})
    return true
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

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please log in to complete your purchase')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const subtotal = getSubtotal()
      const tax = getTax()
      const shippingCost = getShippingCost()
      const total = getTotal()

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
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

      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const toUUIDOrNull = (v: string | undefined | null) => v && UUID_RE.test(v) ? v : null

      const orderItems = selectedItems.map((item) => ({
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

      // Initialize Stripe Checkout
      const response = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })

      const { url, error } = await response.json()
      if (url) {
        window.location.href = url
      } else {
        throw new Error(error || 'Payment initialization failed')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-redirect if cart is empty or no items selected
  useEffect(() => {
    if ((items.length === 0 || selectedItems.length === 0) && !loading) {
      router.push('/cart')
    }
  }, [items.length, selectedItems.length, loading, router])

  if (items.length === 0 || selectedItems.length === 0) return null

  // Progress Bar Helper
  const ProgressStep = ({ num, label, current, done }: { num: number, label: string, current: boolean, done: boolean }) => (
    <div className="flex flex-col items-center gap-2 group flex-1 relative">
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition-all duration-500 z-10",
        current 
          ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-110 ring-4 ring-white" 
          : done 
            ? "bg-green-500 text-white shadow-md shadow-green-500/10 ring-2 ring-white" 
            : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
      )}>
        {done ? <Check className="h-5 w-5" /> : num}
      </div>
      <span className={cn(
        "text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
        current ? "text-brand-text" : done ? "text-green-600" : "text-gray-400"
      )}>
        {label}
      </span>
      {/* Connector lines are handled in the parent container */}
    </div>
  )

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Checkout Header / Progress */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-full max-w-2xl relative">
            {/* Connector Line Background */}
            <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-100 -z-0" />
            
            <div className="flex justify-between items-center relative z-10">
              <ProgressStep num={1} label="Shipping" current={step === 1} done={step > 1} />
              <ProgressStep num={2} label="Review" current={step === 2} done={step > 2} />
              <ProgressStep num={3} label="Payment" current={false} done={false} />
            </div>
          </div>
          <div className="mt-6 text-center">
            <h1 className="text-2xl font-black tracking-tight text-brand-text sm:text-3xl">
              {step === 1 ? 'Secure Checkout' : 'Order Review'}
            </h1>
            <p className="mt-2 text-sm text-gray-400">Complete your details to finish your order</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Main Content (Forms) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {step === 1 ? (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Saved Addresses Section */}
                {savedAddresses.length > 0 && (
                  <div className="mb-8">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                           <MapPin className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-brand-text">Saved Addresses</h2>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={cn(
                            "group relative flex flex-col items-start rounded-3xl border-2 p-5 text-left transition-all duration-300",
                            selectedAddressId === addr.id && !showManualForm
                              ? "border-brand-primary bg-white shadow-xl shadow-brand-primary/10 -translate-y-1"
                              : "border-transparent bg-white shadow-sm hover:border-gray-100 hover:shadow-md hover:-translate-y-0.5"
                          )}
                        >
                          <div className="mb-3 flex w-full items-center justify-between">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg",
                              selectedAddressId === addr.id && !showManualForm ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                            )}>
                              {addr.label || 'Home'}
                            </span>
                            {selectedAddressId === addr.id && !showManualForm && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/30 animate-in zoom-in duration-300">
                                <Check className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-black text-brand-text mb-1">{addr.address_line1}</p>
                          <p className="text-xs font-semibold text-gray-400">{addr.city}, {addr.province}</p>
                          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-gray-300">
                            <Phone className="h-3 w-3" /> {addr.phone}
                          </div>
                        </button>
                      ))}
                      
                      <button
                        onClick={() => {
                          setShowManualForm(true)
                          setSelectedAddressId(null)
                          setShipping(prev => ({ ...prev, address_line1: '', address_line2: '', city: '', province: '', postal_code: '' }))
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 transition-all duration-300 group",
                          showManualForm 
                            ? "border-brand-primary bg-brand-primary/[0.02] text-brand-primary shadow-lg shadow-brand-primary/5" 
                            : "border-gray-200 bg-white text-gray-400 hover:border-brand-primary/50 hover:bg-brand-primary/[0.01] hover:text-brand-primary"
                        )}
                      >
                        <div className={cn(
                          "mb-2 flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300",
                          showManualForm ? "bg-brand-primary text-white" : "bg-gray-50 text-gray-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary"
                        )}>
                          <span className="text-xl font-bold">+</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add New Address</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual Form Area */}
                <div className={cn(
                  "rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/20 transition-all duration-700 relative overflow-hidden",
                  !showManualForm ? "opacity-40 grayscale-[0.8] blur-[2px] pointer-events-none scale-[0.98]" : "opacity-100 blur-0 scale-100"
                )}>
                  {/* Decorative background element */}
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-brand-primary/5 blur-3xl" />

                  <div className="mb-6 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-brand-primary text-white shadow-lg shadow-brand-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                        <Truck className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-tight text-brand-text">Shipping Information</h2>
                        <p className="text-sm font-semibold text-gray-400">Where should we deliver your premium prints?</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 relative z-10">
                    <div className="sm:col-span-1">
                      <label htmlFor="full_name" className={LABEL_CLASSES}>Full Name *</label>
                      <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-brand-primary transition-colors" />
                        <input name="full_name" id="full_name" placeholder="John Doe" value={shipping.full_name} onChange={handleInputChange} onBlur={handleBlur} className={cn(INPUT_CLASSES, "pl-14", errors.full_name && "border-red-200 ring-4 ring-red-500/5 bg-red-50/10")} />
                      </div>
                      {errors.full_name && <p className={ERROR_CLASSES}><AlertCircle className="h-3.5 w-3.5" /> {errors.full_name}</p>}
                    </div>

                    <div className="sm:col-span-1">
                      <label htmlFor="phone" className={LABEL_CLASSES}>Phone Number *</label>
                      <div className="relative group">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-brand-primary transition-colors" />
                        <input name="phone" id="phone" type="tel" placeholder="+91 9876543210" value={shipping.phone} onChange={handleInputChange} onBlur={handleBlur} className={cn(INPUT_CLASSES, "pl-14", errors.phone && "border-red-200 ring-4 ring-red-500/5 bg-red-50/10")} />
                      </div>
                      {errors.phone && <p className={ERROR_CLASSES}><AlertCircle className="h-3.5 w-3.5" /> {errors.phone}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="address_line1" className={LABEL_CLASSES}>Delivery Address *</label>
                      <div className="relative group">
                        <MapPin className="absolute left-5 top-5 h-4 w-4 text-gray-300 group-focus-within:text-brand-primary transition-colors" />
                        <input name="address_line1" id="address_line1" placeholder="Plot No, Street, Landmark" value={shipping.address_line1} onChange={handleInputChange} onBlur={handleBlur} className={cn(INPUT_CLASSES, "pl-14", errors.address_line1 && "border-red-200 ring-4 ring-red-500/5 bg-red-50/10")} />
                      </div>
                      {errors.address_line1 && <p className={ERROR_CLASSES}><AlertCircle className="h-3.5 w-3.5" /> {errors.address_line1}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="address_line2" className={LABEL_CLASSES}>Flat / Apartment / Suite (Optional)</label>
                      <input name="address_line2" id="address_line2" placeholder="Suite 405" value={shipping.address_line2} onChange={handleInputChange} onBlur={handleBlur} className={INPUT_CLASSES} />
                    </div>

                    <div className="sm:col-span-1">
                      <label htmlFor="city" className={LABEL_CLASSES}>City *</label>
                      <input name="city" id="city" placeholder="e.g. Mumbai" value={shipping.city} onChange={handleInputChange} onBlur={handleBlur} className={cn(INPUT_CLASSES, errors.city && "border-red-200 ring-4 ring-red-500/5 bg-red-50/10")} />
                      {errors.city && <p className={ERROR_CLASSES}><AlertCircle className="h-3.5 w-3.5" /> {errors.city}</p>}
                    </div>

                    <div className="sm:col-span-1">
                      <label htmlFor="province" className={LABEL_CLASSES}>State / Province *</label>
                      <div className="relative">
                        <select name="province" id="province" value={shipping.province} onChange={handleInputChange} onBlur={handleBlur} className={cn(INPUT_CLASSES, "appearance-none bg-[right_1.25rem_center] bg-no-repeat", errors.province && "border-red-200 ring-4 ring-red-500/5 bg-red-50/10")}>
                          <option value="">Select State</option>
                          {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.province && <p className={ERROR_CLASSES}><AlertCircle className="h-3.5 w-3.5" /> {errors.province}</p>}
                    </div>

                    <div className="sm:col-span-1">
                      <label htmlFor="postal_code" className={LABEL_CLASSES}>Postal Code *</label>
                      <input name="postal_code" id="postal_code" placeholder="400001" value={shipping.postal_code} onChange={handleInputChange} onBlur={handleBlur} className={cn(INPUT_CLASSES, errors.postal_code && "border-red-200 ring-4 ring-red-500/5 bg-red-50/10")} />
                      {errors.postal_code && <p className={ERROR_CLASSES}><AlertCircle className="h-3.5 w-3.5" /> {errors.postal_code}</p>}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col gap-1">
                    <p className="flex items-center gap-2 text-sm font-bold text-gray-400">
                      <ShieldCheck className="h-5 w-5 text-green-500" /> 100% Encrypted Checkout
                    </p>
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest ml-7">Standard SSL 256-bit protection</p>
                  </div>
                  <button
                    onClick={() => { if (validateStep1()) { window.scrollTo({ top: 0, behavior: 'smooth' }); setStep(2); } }}
                    className="group flex h-16 min-w-[300px] items-center justify-center gap-4 rounded-3xl bg-brand-primary px-10 text-xs font-black tracking-[0.2em] text-white transition-all hover:bg-brand-primary-dark hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-brand-primary/20"
                  >
                    CONTINUE TO REVIEW <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </section>
            ) : (
              <section className="animate-in fade-in slide-in-from-right-8 duration-700 flex flex-col gap-8">
                {/* Step 2: Review */}
                <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/20">
                  <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-brand-secondary text-white shadow-lg shadow-brand-secondary/20">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-tight text-brand-text">Order Items</h2>
                        <p className="text-sm font-semibold text-gray-400">Review your selected products below</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="flex gap-6 group">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.5rem] border border-gray-50 bg-gray-50/50 p-2 transition-all group-hover:shadow-md group-hover:scale-[1.02]">
                          {item.thumbnail_url ? (
                            <Image src={item.thumbnail_url} alt={item.product_name} fill className="object-contain p-2" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-black uppercase text-gray-300">No Image</div>
                          )}
                          <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-xs font-black text-white shadow-lg shadow-brand-primary/20 ring-4 ring-white">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col justify-center">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-base font-black text-brand-text mb-1">{item.product_name}</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-300">Template:</span>
                                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.15em]">{item.template_name}</span>
                              </div>
                            </div>
                            <span className="text-lg font-black tracking-tight text-brand-text">{formatCurrency(item.line_total)}</span>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                             <div className="flex items-center gap-1.5 opacity-60">
                               <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                               <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Ready for production</span>
                             </div>
                             <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{formatCurrency(item.unit_price)} / unit</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/20">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                    <div className="flex items-start gap-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-green-50 text-green-600 shadow-sm shadow-green-500/10">
                        <Truck className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h2 className="text-xl font-black tracking-tight text-brand-text leading-none">Shipping Details</h2>
                          <div className="h-1 w-1 rounded-full bg-gray-200" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600">Verified</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Recipient</p>
                            <p className="text-sm font-black text-brand-text">{shipping.full_name}</p>
                            <p className="text-xs font-bold text-gray-500 flex items-center gap-2 mt-2">
                              <Phone className="h-3 w-3 text-brand-primary" /> {shipping.phone}
                            </p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Address</p>
                             <div className="text-sm font-semibold text-gray-500 leading-relaxed">
                               <p className="text-brand-text font-black">{shipping.address_line1}</p>
                               {shipping.address_line2 && <p>{shipping.address_line2}</p>}
                               <p className="mt-1">{shipping.city}, {shipping.province} {shipping.postal_code}</p>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setStep(1)} 
                      className="shrink-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary hover:text-brand-primary-dark transition-all bg-brand-primary/5 hover:bg-brand-primary/10 px-6 py-3 rounded-2xl shadow-sm"
                    >
                      Edit Details <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-6">
                  <div className="rounded-2xl bg-brand-primary/[0.03] border border-brand-primary/10 p-5 text-center flex items-center justify-center gap-3 animate-pulse">
                    <ShieldCheck className="h-5 w-5 text-brand-primary" />
                    <p className="text-xs font-black text-gray-500 uppercase tracking-[0.1em]">
                      Secure payment via <span className="text-brand-primary">Stripe™ Gateway</span>
                    </p>
                  </div>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="group flex h-20 w-full items-center justify-center gap-4 rounded-[2rem] bg-brand-primary text-xs font-black tracking-[0.3em] text-white transition-all hover:bg-brand-primary-dark hover:scale-[1.01] active:scale-[0.99] shadow-2xl shadow-brand-primary/30 disabled:opacity-50"
                  >
                    {loading ? (
                      <><div className="h-6 w-6 animate-spin rounded-full border-3 border-white/20 border-t-white" /> PROCESSING...</>
                    ) : (
                      <>COMPLETE & PAY {formatCurrency(getTotal())} <CreditCard className="h-6 w-6 transition-transform group-hover:translate-x-1" /></>
                    )}
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Sticky Summary Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="rounded-[2.5rem] border border-gray-100 bg-white shadow-2xl shadow-gray-200/40 overflow-hidden transition-all duration-500 hover:shadow-gray-300/40">
              <div className="bg-brand-secondary p-6 text-white relative overflow-hidden">
                {/* Decorative dots */}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <div className="grid grid-cols-3 gap-1">
                      {[...Array(9)].map((_, i) => <div key={i} className="h-1 w-1 rounded-full bg-white" />)}
                   </div>
                </div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/50">Purchase Summary</h2>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-2xl font-black">{selectedItems.length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Custom Product(s)</p>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center group cursor-default">
                    <span className="text-sm font-bold text-gray-400 group-hover:text-gray-500 transition-colors">Subtotal</span>
                    <span className="text-sm font-black text-brand-text">{formatCurrency(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-default">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-400 group-hover:text-gray-500 transition-colors">GST (18%)</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">Gov. Indirect Tax</span>
                    </div>
                    <span className="text-sm font-black text-brand-text">{formatCurrency(getTax())}</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-default">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-400 group-hover:text-gray-500 transition-colors">Shipping</span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        getShippingCost() === 0 ? "text-green-500" : "text-brand-primary"
                      )}>
                        {getShippingCost() === 0 ? 'Standard Delivery' : 'Express Priority'}
                      </span>
                    </div>
                    {getShippingCost() === 0 
                      ? <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-green-100 italic">Free</span>
                      : <span className="text-sm font-black text-brand-text">{formatCurrency(getShippingCost())}</span>
                    }
                  </div>
                  
                  <div className="pt-8 mt-2 border-t border-gray-50">
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">Total Amount</span>
                        <span className="text-4xl font-black tracking-tighter text-brand-text leading-none">{formatCurrency(getTotal())}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex gap-1 mb-2">
                           <div className="h-1.5 w-4 rounded-full bg-brand-primary" />
                           <div className="h-1.5 w-1.5 rounded-full bg-brand-primary/30" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">INR Net</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secure Trust Badge */}
                <div className="mt-8 rounded-3xl bg-gray-50/50 p-5 border border-gray-100/50 flex items-center gap-4 transition-all hover:bg-white hover:shadow-md hover:border-transparent group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-brand-text uppercase tracking-widest">Secure Checkout</p>
                    <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Protected by SSL Encryption</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Cart link */}
            <button 
              onClick={() => router.push('/cart')}
              className="mt-8 flex w-full items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 transition-all hover:text-brand-primary hover:tracking-[0.3em]"
            >
              <ChevronLeft className="h-4 w-4" /> Edit Cart Items
            </button>
          </aside>
        </div>

        <div className="mt-12 border-t border-gray-100 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
               <ShieldCheck className="h-5 w-5 text-green-500" />
               <p className="text-xs text-brand-text font-bold">Encrypted & Secure Payment Gateway</p>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">© {new Date().getFullYear()} {SITE_NAME}</p>
          </div>
        </div>
      </main>
    </div>
  )
}

