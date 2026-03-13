import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DIVISIONS } from '@/lib/utils/constants'
import { ProductConfigurator } from './ProductConfigurator'
import type { ProductGroup, ProductTemplate, TemplateParameter, PricingRule } from '@/types'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('product_groups')
    .select('name, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!data) {
    return { title: 'Product Not Found | SpeedyPrint' }
  }

  return {
    title: `${data.name} | SpeedyPrint`,
    description: data.description ?? `Custom ${data.name} from SpeedyPrint`,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('product_groups')
    .select(
      `
      *,
      product_templates (
        *,
        template_parameters (*)
      ),
      pricing_rules (*)
    `
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !product) {
    notFound()
  }

  const typedProduct = product as ProductGroup & {
    product_templates: (ProductTemplate & {
      template_parameters: TemplateParameter[]
    })[]
    pricing_rules: PricingRule[]
  }

  // Sort templates and their parameters
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

  const divisionGradients: Record<string, string> = {
    labels: 'from-red-500 to-orange-400',
    laser: 'from-blue-600 to-cyan-400',
    events: 'from-green-500 to-emerald-400',
    stamps: 'from-purple-600 to-pink-400',
    sleeves: 'from-amber-500 to-yellow-400',
  }

  const gradient =
    divisionGradients[typedProduct.division] ?? 'from-gray-500 to-gray-400'

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-brand-gray-medium">
        <a href="/products" className="hover:text-brand-red transition-colors">
          Products
        </a>
        <span className="mx-2">/</span>
        <span className="text-brand-black">{typedProduct.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Left: Product image / visual */}
        <div>
          <div
            className={`relative flex h-80 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} lg:h-[480px] overflow-hidden`}
          >
            {typedProduct.image_url ? (
              <Image
                src={typedProduct.image_url}
                alt={typedProduct.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover rounded-xl"
                priority
              />
            ) : (
              <span className="text-8xl font-bold text-white/20 select-none">
                {typedProduct.name.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* Right: Product details and configurator */}
        <div>
          {/* Header */}
          <div className="mb-6">
            {division && (
              <Badge variant="secondary" className="mb-3">
                {division.name}
              </Badge>
            )}
            <h1 className="text-3xl font-bold text-brand-black">
              {typedProduct.name}
            </h1>
            {typedProduct.description && (
              <p className="mt-3 text-brand-gray-medium leading-relaxed">
                {typedProduct.description}
              </p>
            )}
          </div>

          <Separator className="my-6" />

          {/* Interactive configurator (client component) */}
          <ProductConfigurator
            productGroupId={typedProduct.id}
            templates={templates}
            pricingRules={pricingRules}
          />
        </div>
      </div>
    </div>
  )
}
