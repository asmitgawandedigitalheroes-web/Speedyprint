import type { Metadata } from 'next'
import { Star } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Testimonial } from '@/types'
import Link from 'next/link'

export const metadata: Metadata = {
  title: `Testimonials | ${SITE_NAME}`,
  description: 'Read what our customers say about Speedy Labels. Real reviews from businesses across South Africa.',
}

export const dynamic = 'force-dynamic'

async function getTestimonials(): Promise<Testimonial[]> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false })
  return (data as Testimonial[]) || []
}

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials()

  return (
    <div className="bg-white">
      {/* Page header */}
      <div className="bg-brand-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-white">Customer testimonials</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            Don&apos;t just take our word for it — hear from businesses across South Africa who trust {SITE_NAME}.
          </p>
        </div>
      </div>

      {/* Testimonials grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {testimonials.length === 0 ? (
            <div className="rounded-md border border-gray-100 bg-brand-bg p-16 text-center">
              <div className="mx-auto mb-4 h-1 w-8 bg-brand-primary" />
              <p className="text-brand-text-muted">No testimonials yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.id} className="flex flex-col rounded-md border border-gray-100 bg-white p-6">
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'fill-brand-primary text-brand-primary' : 'text-gray-200'}`} />
                    ))}
                  </div>

                  <p className="mt-4 flex-1 text-sm leading-relaxed text-brand-text-muted">
                    &quot;{t.review_text}&quot;
                  </p>

                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="font-semibold text-brand-text">{t.customer_name}</p>
                    {(t.company_name || t.location) && (
                      <p className="text-xs text-brand-text-muted mt-0.5">
                        {[t.company_name, t.location].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-brand-bg py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="font-heading text-2xl font-bold text-brand-text">Ready to experience the difference?</h2>
          <p className="mt-3 text-brand-text-muted">Join thousands of satisfied customers today.</p>
          <Link href="/order-now" className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-primary px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark">
            Get instant quote
          </Link>
        </div>
      </section>
    </div>
  )
}
