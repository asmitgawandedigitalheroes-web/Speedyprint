import { notFound } from 'next/navigation'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { DIVISIONS, SITE_URL, SITE_NAME } from '@/lib/utils/constants'
import { ProductDetailClient } from './ProductDetailClient'
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import type { ProductGroup, ProductTemplate, TemplateParameter, PricingRule } from '@/types'

// Revalidate product pages every hour
export const revalidate = 3600

// Pre-build all active product pages at deploy time
export async function generateStaticParams() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('product_groups')
    .select('slug')
    .eq('is_active', true)
  return (data ?? []).map(({ slug }) => ({ slug }))
}

// Cached product fetcher — shared between generateMetadata and the page component
// so we only hit the DB once per slug per revalidation window
const getProduct = unstable_cache(
  async (slug: string) => {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('product_groups')
      .select(`*, product_templates (*, template_parameters (*)), pricing_rules (*)`)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    if (error || !data) return null
    return data
  },
  ['product-detail'],
  { revalidate: 3600, tags: ['products'] }
)

const getRelated = unstable_cache(
  async (division: string, slug: string) => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('product_groups')
      .select('name, slug, image_url, description')
      .eq('division', division)
      .eq('is_active', true)
      .neq('slug', slug)
      .limit(4)
    return data ?? []
  },
  ['product-related'],
  { revalidate: 3600, tags: ['products'] }
)

interface ProductPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const data = await getProduct(slug)

  if (!data) return { title: 'Product Not Found' }

  const title = `${data.name} | Order Online`
  const description = data.description ?? `Design and order custom ${data.name} online from ${SITE_NAME}. Fast turnaround, production-ready quality.`
  const url = `${SITE_URL}/products/${slug}`
  const image = data.image_url ? `${SITE_URL}${data.image_url}` : `${SITE_URL}/images/speedyprint-logo.png`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [{ url: image, alt: data.name }], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function ProductPage({ params, searchParams: searchParamsPromise }: ProductPageProps) {
  const { slug } = await params
  const searchParams = await searchParamsPromise

  const product = await getProduct(slug)
  if (!product) notFound()

  const typedProduct = product as ProductGroup & {
    product_templates: (ProductTemplate & { template_parameters: TemplateParameter[] })[]
    pricing_rules: PricingRule[]
  }

  const templates = (typedProduct.product_templates ?? [])
    .filter((t) => t.is_active)
    .sort((a, b) => (a.name > b.name ? 1 : -1))

  for (const template of templates) {
    template.template_parameters = (template.template_parameters ?? []).sort(
      (a, b) => a.display_order - b.display_order
    )
  }

  const pricingRules = (typedProduct.pricing_rules ?? []).sort(
    (a, b) => a.display_order - b.display_order
  )

  const division = DIVISIONS.find((d) => d.key === typedProduct.division)

  // Build feature bullets from description
  const descriptionBullets = typedProduct.description
    ? typedProduct.description.split(/[.!]/).map(s => s.trim()).filter(s => s.length > 10).slice(0, 4)
    : []

  // Gallery images per product (real client work samples)
  const PRODUCT_GALLERY: Record<string, { src: string; alt: string }[]> = {
    'business-cards': [
      { src: '/images/products/gallery/business-cards/c-fire-foods.jpg',      alt: 'C Fire Foods business card' },
      { src: '/images/products/gallery/business-cards/get-labelled.jpg',       alt: 'Get Labelled business card' },
      { src: '/images/products/gallery/business-cards/take-a-hike.jpg',        alt: 'Take a Hike business card' },
      { src: '/images/products/gallery/business-cards/torcida-elegancia.jpg',  alt: 'Torcida Elegância business card' },
      { src: '/images/products/gallery/business-cards/iron-odyssey.jpg',       alt: 'Iron Odyssey business card' },
      { src: '/images/products/gallery/business-cards/audio-exchange.jpg',     alt: 'Audio Exchange business card' },
    ],
    'custom-labels': [
      { src: '/images/products/gallery/custom-labels/hy-active-bar.jpg',       alt: 'Health Yourself Active Bar label' },
      { src: '/images/products/gallery/custom-labels/grilla-day-bomb.jpg',     alt: "G'Rilla Day Bomb label" },
      { src: '/images/products/gallery/custom-labels/cfire-nachos.jpg',        alt: 'C Fire Nachos label' },
      { src: '/images/products/gallery/custom-labels/joye-serum.jpg',          alt: 'Joye hair serum label' },
      { src: '/images/products/gallery/custom-labels/pure-bloom-body-oil.jpg', alt: 'Pure Bloom Body Oil label' },
    ],
    'coffee-cup-sleeves': [
      { src: '/images/products/gallery/coffee-cup-sleeves/tigris-wealth.jpg',        alt: 'Tigris Wealth coffee sleeve' },
      { src: '/images/products/gallery/coffee-cup-sleeves/prego-plates.jpg',         alt: 'Prego & Plates coffee sleeve' },
      { src: '/images/products/gallery/coffee-cup-sleeves/carmella-sir-gaspard.jpg', alt: 'Carmella by Sir Gaspard coffee sleeve' },
    ],
    'race-numbers': [
      { src: '/images/products/gallery/race-numbers/cbz-marathon.jpg', alt: 'CBZ Marathon race number' },
    ],
    'race-bibs': [
      { src: '/images/products/gallery/race-numbers/cbz-marathon.jpg', alt: 'CBZ Marathon race bib' },
    ],
  }

  const galleryImages = PRODUCT_GALLERY[slug] ?? []

  // Sibling products in same division for "Related" section
  const related = await getRelated(typedProduct.division, slug)

  return (
    <>
      <ProductJsonLd
        name={typedProduct.name}
        description={typedProduct.description ?? `Custom ${typedProduct.name}`}
        image={typedProduct.image_url ?? undefined}
        slug={typedProduct.slug}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'Products', url: `${SITE_URL}/products` },
          { name: typedProduct.name, url: `${SITE_URL}/products/${typedProduct.slug}` },
        ]}
      />

      {/* ── BREADCRUMB + TITLE BANNER ───────────────────────────────── */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/products" className="hover:text-brand-primary transition-colors">Products</Link>
            {division && (
              <>
                <ChevronRight className="h-3 w-3" />
                <Link href={`/products?division=${typedProduct.division}`} className="hover:text-brand-primary transition-colors">
                  {division.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-700 font-medium">{typedProduct.name}</span>
          </nav>
        </div>
      </div>

      {/* ── PRODUCT HERO ─────────────────────────────────────────────── */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

          {/* Product title above on mobile, hidden on desktop (shown in left col) */}
          <div className="mb-6 lg:hidden">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-primary">
              {division?.name}
            </p>
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              {typedProduct.name}
            </h1>
            {typedProduct.description && (
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {typedProduct.description}
              </p>
            )}
          </div>

          {/* Desktop: title sits above the 2-col grid */}
          <div className="mb-8 hidden lg:block">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-primary">
              {division?.name}
            </p>
            <h1 className="font-heading text-4xl font-bold text-gray-900">
              {typedProduct.name}
            </h1>
            {typedProduct.description && (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
                {typedProduct.description}
              </p>
            )}
          </div>

          {/* 2-col hero: image + configurator */}
          <ProductDetailClient
            product={typedProduct}
            templates={templates}
            pricingRules={pricingRules}
            divisionName={division?.name ?? null}
            division={typedProduct.division}
            designId={typeof searchParams.design === 'string' ? searchParams.design : undefined}
          />
        </div>
      </div>

      {/* ── PRODUCT HIGHLIGHTS ───────────────────────────────────────── */}
      {descriptionBullets.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-lg font-bold text-gray-900">Product Highlights</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {descriptionBullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-gray-100">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                  <p className="text-sm text-gray-600 leading-relaxed">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SPECIFICATIONS TABLE ─────────────────────────────────────── */}
      {templates.length > 0 && (
        <div className="border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-lg font-bold text-gray-900">Available Sizes &amp; Specifications</h2>
            <div className="overflow-hidden rounded-xl ring-1 ring-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Size / Template</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Dimensions</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Resolution</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Bleed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {templates.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{t.name}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{t.print_width_mm} × {t.print_height_mm} mm</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{t.dpi} DPI</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{t.bleed_mm} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── HOW TO ORDER ─────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-lg font-bold text-gray-900">How to Order</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '01', title: 'Choose your size', desc: 'Select the template or enter a custom size that fits your needs.' },
              { step: '02', title: 'Configure options', desc: 'Pick your material, finish, and any other options above.' },
              { step: '03', title: 'Design or upload', desc: 'Use our online designer or upload your ready-to-print artwork.' },
              { step: '04', title: 'We print & deliver', desc: 'We produce your order and deliver nationwide or you can collect.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{title}</p>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CLIENT WORK GALLERY ──────────────────────────────────────── */}
      {galleryImages.length > 0 && (
        <div className="border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">Real Client Work</h2>
              <p className="mt-1 text-sm text-gray-500">Examples of {typedProduct.name} we've printed for our customers</p>
            </div>
            <div className={`grid gap-4 ${
              galleryImages.length === 1 ? 'grid-cols-1 max-w-sm' :
              galleryImages.length === 2 ? 'grid-cols-2 max-w-xl' :
              galleryImages.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
              'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3'
            }`}>
              {galleryImages.map((img, i) => (
                <div key={i} className="group overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-100 transition-all hover:ring-brand-primary/30 hover:shadow-md">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RELATED PRODUCTS ─────────────────────────────────────────── */}
      {related && related.length > 0 && (
        <div className="border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">More in {division?.name}</h2>
              <Link
                href={`/products?division=${typedProduct.division}`}
                className="text-sm font-medium text-brand-primary hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/products/${r.slug}`}
                  className="group rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-brand-primary/30 hover:shadow-md"
                >
                  {r.image_url ? (
                    <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-white">
                      <img src={r.image_url} alt={r.name} className="h-full w-full object-cover object-center" />
                    </div>
                  ) : (
                    <div className="mb-3 flex aspect-[4/3] items-center justify-center rounded-lg bg-white text-3xl font-bold text-gray-100">
                      {r.name.charAt(0)}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-primary transition-colors">
                    {r.name}
                  </p>
                  {r.description && (
                    <p className="mt-1 text-xs text-gray-400 line-clamp-2">{r.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
