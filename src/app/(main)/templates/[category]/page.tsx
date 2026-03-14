import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { SITE_NAME, V2_DIVISIONS } from '@/lib/utils/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ProductGroup, ProductTemplate } from '@/types'

interface PageProps {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  const division = V2_DIVISIONS.find((d) => d.key === category)

  if (!division) {
    return { title: `Templates | ${SITE_NAME}` }
  }

  return {
    title: `${division.name} Templates | ${SITE_NAME}`,
    description: `Browse ${division.name.toLowerCase()} templates. Design online with our free design wizard.`,
  }
}

export const dynamic = 'force-dynamic'

interface TemplateWithGroup extends ProductTemplate {
  product_group: ProductGroup
}

async function getTemplates(): Promise<TemplateWithGroup[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('product_templates')
    .select('*, product_group:product_groups(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return (data as TemplateWithGroup[]) || []
}

export default async function TemplateCategoryPage({ params }: PageProps) {
  const { category } = await params
  const division = V2_DIVISIONS.find((d) => d.key === category)

  if (!division) notFound()

  const allTemplates = await getTemplates()
  const templates = allTemplates // In V2, filter by division when product_groups have division field

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-brand-secondary py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold">{division.name} Templates</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            {division.description}
          </p>
        </div>
      </section>

      {/* Category Links */}
      <section className="border-b bg-brand-bg py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-3 px-4">
          <Link
            href="/templates"
            className="rounded-full border px-4 py-1.5 text-sm font-medium text-brand-text hover:bg-white"
          >
            All Templates
          </Link>
          {V2_DIVISIONS.map((div) => (
            <Link
              key={div.key}
              href={`/templates/${div.key}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                div.key === category
                  ? 'bg-brand-primary text-white'
                  : 'border text-brand-text hover:bg-white'
              }`}
            >
              {div.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {templates.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-brand-text-muted">
                No templates in this category yet.
              </p>
              <Link
                href="/order-now"
                className="mt-4 inline-block text-brand-primary hover:underline"
              >
                Place a custom order instead →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/designer/${template.id}`}
                  className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {template.product_group?.image_url ? (
                      <Image
                        src={template.product_group.image_url}
                        alt={template.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">🎨</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading text-sm font-semibold text-brand-text group-hover:text-brand-primary">
                      {template.name}
                    </h3>
                    <p className="mt-1 text-xs text-brand-text-muted">
                      {template.print_width_mm}x{template.print_height_mm}mm
                    </p>
                    <p className="mt-2 text-xs font-medium text-brand-primary">
                      Design Now →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
