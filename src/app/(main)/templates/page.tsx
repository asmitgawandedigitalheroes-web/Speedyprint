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
    <div className="bg-brand-bg min-h-screen">
      {/* Page header */}
      <div className="bg-brand-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-white">Design templates</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/60">
            Choose a template and customize it using our online design wizard. No design software needed.
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-1 py-3">
            <Link
              href="/templates"
              className="rounded-md bg-brand-primary px-4 py-1.5 text-sm font-medium text-white"
            >
              All templates
            </Link>
            {V2_DIVISIONS.map((div) => (
              <Link
                key={div.key}
                href={`/templates/${div.key}`}
                className="rounded-md border border-gray-200 px-4 py-1.5 text-sm font-medium text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
              >
                {div.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Templates grid */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {templates.length === 0 ? (
            <div className="rounded-md border border-gray-100 bg-white py-20 text-center">
              <div className="mx-auto mb-4 h-1 w-8 bg-brand-primary" />
              <p className="text-brand-text-muted">No templates available yet.</p>
              <p className="mt-2 text-sm text-brand-text-muted">
                You can still{' '}
                <Link href="/order-now" className="text-brand-primary hover:underline">
                  place a custom order
                </Link>{' '}
                with your own artwork.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/designer/${template.id}`}
                  className="group overflow-hidden rounded-md border border-gray-100 bg-white transition hover:border-brand-primary/30 hover:shadow-md"
                >
                  <div className="relative aspect-square overflow-hidden bg-brand-bg">
                    {template.product_group?.image_url ? (
                      <Image
                        src={template.product_group.image_url}
                        alt={template.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl text-brand-text-muted">🎨</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading text-sm font-semibold text-brand-text group-hover:text-brand-primary transition">
                      {template.name}
                    </h3>
                    <p className="mt-1 text-xs text-brand-text-muted">
                      {template.print_width_mm}×{template.print_height_mm}mm
                    </p>
                    <p className="mt-2 text-xs font-medium text-brand-primary">
                      Design now →
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
