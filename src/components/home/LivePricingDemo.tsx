'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const PRODUCTS = [
  { label: 'Custom Labels',  value: 'labels',         base: 2.50 },
  { label: 'Vinyl Stickers', value: 'stickers',       base: 3.20 },
  { label: 'Flyers',         value: 'flyers',         base: 1.80 },
  { label: 'Business Cards', value: 'business-cards', base: 2.20 },
  { label: 'Race Numbers',   value: 'race-numbers',   base: 4.50 },
  { label: 'Coffee Sleeves', value: 'sleeves',        base: 3.80 },
]

const SIZES = [
  { label: '50×50mm',   value: 'xs',  mult: 0.8 },
  { label: '100×50mm',  value: 'sm',  mult: 1.0 },
  { label: '100×100mm', value: 'md',  mult: 1.2 },
  { label: 'A6',        value: 'a6',  mult: 1.4 },
  { label: 'A5',        value: 'a5',  mult: 1.8 },
]

const PRESETS = [50, 100, 250, 500, 1000]

export default function LivePricingDemo() {
  const [product, setProduct] = useState(PRODUCTS[0].value)
  const [size, setSize]       = useState(SIZES[1].value)
  const [qty, setQty]         = useState(100)

  const p = PRODUCTS.find(x => x.value === product)!
  const s = SIZES.find(x => x.value === size)!

  const unit     = useMemo(() => p.base * s.mult, [p, s])
  const subtotal = useMemo(() => unit * qty, [unit, qty])
  const vat      = useMemo(() => subtotal * 0.15, [subtotal])
  const total    = useMemo(() => subtotal + vat, [subtotal, vat])

  const volLabel = qty >= 1000 ? 'Best value' : qty >= 500 ? 'Great value' : qty >= 250 ? 'Good value' : null

  function clamp(v: number) { return Math.min(5000, Math.max(10, v)) }

  return (
    <section id="live-pricing" className="bg-brand-bg py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-12 border-b border-gray-200 pb-6">
          <h2 className="font-heading text-3xl font-bold text-brand-text">
            Instant price calculator
          </h2>
          <p className="mt-2 text-brand-text-muted">
            Configure your product and see the price update live — no quote forms, no waiting.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">

          {/* Left — description */}
          <div className="flex flex-col gap-8">
            <p className="text-lg leading-relaxed text-brand-text-muted">
              Our pricing engine calculates your cost instantly based on product type,
              size, and quantity. Volume discounts are applied automatically — the more
              you order, the less you pay per unit.
            </p>

            <ul className="space-y-4">
              {[
                'Prices based on real production rates',
                'Volume discounts apply automatically from 100 units',
                'VAT-inclusive totals shown at a glance',
                'Final price confirmed at checkout with no surprises',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-brand-text-muted">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/order-now"
              className="group inline-flex w-fit items-center gap-2 rounded-xl bg-brand-primary px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/25 transition-all hover:-translate-y-0.5 hover:bg-brand-primary-dark"
            >
              Start your order
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right — calculator */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">

            {/* Product */}
            <div className="mb-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-text-muted">Product</p>
              <div className="flex flex-wrap gap-2">
                {PRODUCTS.map(pr => (
                  <button
                    key={pr.value}
                    onClick={() => setProduct(pr.value)}
                    className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      product === pr.value
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-gray-200 bg-white text-brand-text-muted hover:border-brand-primary/40 hover:text-brand-text'
                    }`}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="mb-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-text-muted">Size</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map(sz => (
                  <button
                    key={sz.value}
                    onClick={() => setSize(sz.value)}
                    className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      size === sz.value
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-gray-200 bg-white text-brand-text-muted hover:border-brand-primary/40 hover:text-brand-text'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-text-muted">Quantity</p>
                {volLabel && (
                  <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700">
                    {volLabel}
                  </span>
                )}
              </div>

              {/* Stepper */}
              <div className="mb-3 flex items-center gap-3">
                <button
                  onClick={() => setQty(q => clamp(q - (q > 100 ? 50 : 10)))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-brand-text-muted transition hover:border-brand-primary hover:text-brand-primary"
                >
                  <span className="text-lg font-bold leading-none">−</span>
                </button>
                <span className="flex-1 text-center text-2xl font-bold tabular-nums text-brand-text">
                  {qty.toLocaleString()}
                </span>
                <button
                  onClick={() => setQty(q => clamp(q + (q >= 100 ? 50 : 10)))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-brand-text-muted transition hover:border-brand-primary hover:text-brand-primary"
                >
                  <span className="text-lg font-bold leading-none">+</span>
                </button>
              </div>

              {/* Presets */}
              <div className="flex gap-2">
                {PRESETS.map(n => (
                  <button
                    key={n}
                    onClick={() => setQty(n)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                      qty === n
                        ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                        : 'border-gray-200 text-brand-text-muted hover:border-gray-300'
                    }`}
                  >
                    {n >= 1000 ? '1k' : n}
                  </button>
                ))}
              </div>
            </div>

            {/* Price result */}
            <div className="rounded-xl border border-gray-100 bg-brand-bg px-6 py-5">
              <div className="mb-3 flex items-baseline justify-between border-b border-gray-200 pb-3">
                <span className="text-sm text-brand-text-muted">Unit price</span>
                <span className="font-semibold text-brand-text">R {unit.toFixed(2)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-brand-text-muted">Subtotal excl. VAT</span>
                <span className="text-3xl font-black text-brand-text">R {subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xs text-brand-text-muted">VAT (15%)</span>
                <span className="text-sm text-brand-text-muted">+ R {vat.toFixed(2)}</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t border-gray-200 pt-3">
                <span className="text-sm font-semibold text-brand-text">Total incl. VAT</span>
                <span className="text-xl font-black text-brand-primary">R {total.toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
