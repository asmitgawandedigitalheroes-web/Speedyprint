import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SITE_NAME, V2_DIVISIONS } from '@/lib/utils/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ProductGroup, ProductTemplate } from '@/types'

export const metadata: Metadata = {
  title: `Design Templates | ${SITE_NAME}`,
  description: 'Browse our library of sticker and label templates. Design online using our free design wizard.',
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

export default async function TemplatesPage() {
  const templates = await getTemplates()

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-brand-secondary py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold">Design Templates</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Choose a template and customize it using our online design wizard.
            No design software needed.
          </p>
        </div>
      </section>

      {/* Category Links */}
      <section className="border-b bg-brand-bg py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-3 px-4">
          <Link
            href="/templates"
            className="rounded-full bg-brand-primary px-4 py-1.5 text-sm font-medium text-white"
          >
            All Templates
          </Link>
          {V2_DIVISIONS.map((div) => (
            <Link
              key={div.key}
              href={`/templates/${div.key}`}
              className="rounded-full border px-4 py-1.5 text-sm font-medium text-brand-text hover:bg-white"
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
                No templates available yet.
              </p>
              <p className="mt-2 text-sm text-brand-text-muted">
                You can still{' '}
                <Link href="/order-now" className="text-brand-primary hover:underline">
                  place a custom order
                </Link>{' '}
                with your own artwork.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/designer/${template.id}`}
                  className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Thumbnail */}
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

                  {/* Info */}
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
