'use client'

import { useState } from 'react'
import Image from 'next/image'

const EXAMPLES = [
  // ── Labels · White Vinyl ──────────────────────────────────────
  {
    category: 'Labels',
    material: 'White Vinyl',
    title: 'AfricaBlack Coffee Label',
    size: '120 × 180 mm',
    image: '/client-work/AfricaBlack Coffee Label 120mm x 180mm white vinyl.jpg',
  },
  {
    category: 'Labels',
    material: 'White Vinyl',
    title: 'C Fire Jalapeno Label',
    size: '130 × 70 mm',
    image: '/client-work/C Fire - Jalapeno labels 130mm x 70mm white vinyl.jpg',
  },
  {
    category: 'Labels',
    material: 'White Vinyl',
    title: 'C Fire Zesty Label',
    size: '130 × 70 mm',
    image: '/client-work/C Fire - Zesty labels 130mm x 70mm white vinyl.jpg',
  },
  {
    category: 'Labels',
    material: 'White Vinyl',
    title: 'Doggie Bag Round Label',
    size: '50 mm Round',
    image: '/client-work/Doggie Bag labels 50mm round White vinyl.jpg',
  },
  {
    category: 'Labels',
    material: 'White Vinyl',
    title: 'Sugar Scrub Label',
    size: '60 × 40 mm',
    image: '/client-work/Sugar Scrub labels 60mm x 40mm white vinyl.jpg',
  },
  {
    category: 'Labels',
    material: 'White Vinyl',
    title: 'Heavenly Harvest Honey Bee',
    size: '163 × 60 mm',
    image: '/client-work/Heavenly Harvest Honey Bee labels 163mm x 60mm white vinyl.jpg',
  },
  {
    category: 'Labels',
    material: 'White Vinyl',
    title: 'Danel Boerdery Label',
    size: '50 × 45 mm',
    image: '/client-work/Danel Boerdery 50mm x 45mm White vinyl.jpg',
  },
  {
    category: 'Labels',
    material: 'White Vinyl',
    title: 'Ben & Betty Hair Growth',
    size: '90 × 45 mm',
    image: '/client-work/Ben _ Betty Hair Growth label 90mm x 45mm white vinyl.jpg',
  },
  {
    category: 'Labels',
    material: 'White Vinyl',
    title: '3 Guys and a Grill',
    size: '80 × 60 mm',
    image: '/client-work/3 Guys and a Grill 80x60 white vinyl.jpg',
  },
  {
    category: 'Labels',
    material: 'White Vinyl',
    title: 'Baby on Board – Batman',
    size: '200 × 175 mm',
    image: '/client-work/Baby on Board - Batman 200mm x 175mm white vinyl.jpg',
  },
  // ── Labels · Clear Vinyl ──────────────────────────────────────
  {
    category: 'Labels',
    material: 'Clear Vinyl',
    title: 'AfricaBlack Coffee Logo',
    size: '30 mm Round',
    image: '/client-work/AfricaBlack Coffee logo 30mm round clear vinyl.jpg',
  },
  {
    category: 'Labels',
    material: 'Clear Vinyl',
    title: 'Ellah Skincare Label',
    size: '140 × 50 mm',
    image: '/client-work/Ellah Skincare 140mm x 50mm clear vinyl.jpg',
  },
  {
    category: 'Labels',
    material: 'Clear Vinyl',
    title: 'Trading Hours Sign',
    size: '210 × 297 mm',
    image: '/client-work/Trading Hours 210mm x 297mm Clear vinyl.jpg',
  },
  // ── Labels · Paper Adhesive ───────────────────────────────────
  {
    category: 'Labels',
    material: 'Paper Adhesive',
    title: 'Production Label',
    size: '85 × 44 mm',
    image: '/client-work/Production labels 85mm x 44mm Paper adhesive.jpg',
  },
  // ── Coffee Sleeves ────────────────────────────────────────────
  {
    category: 'Coffee Sleeves',
    material: '250 gsm',
    title: 'Circle K Coffee Sleeve',
    size: '70 × 270 mm',
    image: '/client-work/Circle K coffee sleeves 70mm x 270mm 250gsm.jpg',
  },
  {
    category: 'Coffee Sleeves',
    material: '250 gsm',
    title: 'FG La Pasta Coffee Sleeve',
    size: '70 × 270 mm',
    image: '/client-work/FG La Pasta Coffee sleeves 70mm x 270mm 250gsm.jpg',
  },
  // ── Race Numbers ──────────────────────────────────────────────
  {
    category: 'Race Numbers',
    material: 'Tex21',
    title: 'Jump City Race Number',
    size: '150 × 150 mm',
    image: '/client-work/Jump City race numbers 150x150 Tex21.jpg',
  },
  {
    category: 'Race Numbers',
    material: 'Tex21 Tear-off',
    title: '3 Peaks Race Number',
    size: '150 × 150 mm',
    image: '/client-work/3 Peaks race numbers 150x150 Tex21 tare off.jpg',
  },
  {
    category: 'Race Numbers',
    material: 'Ecoflex',
    title: 'ASA Race Number',
    size: '150 × 150 mm',
    image: '/client-work/ASA race numbers 150x150 Ecoflex.jpg',
  },
  {
    category: 'Race Numbers',
    material: 'Tex21 Tear-off',
    title: 'Mandela Remembrance Race Number',
    size: '150 × 150 mm',
    image: '/client-work/Mandela Remembrancer ace numbers 150x150 Tex21 tare off.jpg',
  },
]

const CATEGORIES = ['All', 'Labels', 'Coffee Sleeves', 'Race Numbers'] as const
type Category = (typeof CATEGORIES)[number]

const CATEGORY_COLORS: Record<string, string> = {
  Labels: 'text-brand-primary bg-brand-primary/10',
  'Coffee Sleeves': 'text-amber-700 bg-amber-50',
  'Race Numbers': 'text-violet-700 bg-violet-50',
}

export function FeaturedWork() {
  const [active, setActive] = useState<Category>('All')

  const filtered =
    active === 'All' ? EXAMPLES : EXAMPLES.filter((e) => e.category === active)

  return (
    <section className="bg-brand-bg py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10 border-b border-gray-200 pb-6">
          <h2 className="font-heading text-3xl font-bold text-brand-text">
            Our work
          </h2>
          <p className="mt-2 text-brand-text-muted">
            Real jobs printed for real South African brands — labels, coffee sleeves and race numbers.
          </p>
        </div>

        {/* Filter pills */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                active === cat
                  ? 'border-brand-primary bg-brand-primary text-white'
                  : 'border-gray-200 bg-white text-brand-text-muted hover:border-brand-primary/40 hover:text-brand-text'
              }`}
            >
              {cat}
              {cat !== 'All' && (
                <span className={`ml-1.5 ${active === cat ? 'opacity-70' : 'opacity-50'}`}>
                  {EXAMPLES.filter((e) => e.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <div
              key={item.image}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/20 hover:shadow-xl"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-50">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Info */}
              <div className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      CATEGORY_COLORS[item.category] ?? 'text-brand-primary bg-brand-primary/10'
                    }`}
                  >
                    {item.category}
                  </span>
                  <span className="shrink-0 text-[10px] text-brand-text-muted">
                    {item.material}
                  </span>
                </div>
                <h3 className="mt-1.5 font-heading text-sm font-bold leading-tight text-brand-text">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-[11px] text-brand-text-muted">{item.size}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
