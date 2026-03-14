import type { Metadata } from 'next'
import { Star } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Testimonial } from '@/types'

export const metadata: Metadata = {
  title: `Testimonials | ${SITE_NAME}`,
  description: 'Read what our customers say about SpeedyPrint. Real reviews from businesses across South Africa.',
}

export const dynamic = 'force-dynamic'

async function getTestimonials(): Promise<Testimonial[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false })
  return (data as Testimonial[]) || []
}

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials()

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-brand-secondary py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold">Customer Testimonials</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Don&apos;t just take our word for it — hear from businesses across
            South Africa who trust SpeedyPrint.
          </p>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {testimonials.length === 0 ? (
            <p className="text-center text-brand-text-muted">No testimonials yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.id} className="rounded-xl border bg-white p-6 shadow-sm">
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < t.rating
                            ? 'fill-brand-primary text-brand-primary'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Review */}
                  <p className="mt-4 text-sm leading-relaxed text-brand-text-muted">
                    &quot;{t.review_text}&quot;
                  </p>

                  {/* Author */}
                  <div className="mt-4 border-t pt-4">
                    <p className="font-semibold text-brand-text">{t.customer_name}</p>
                    {(t.company_name || t.location) && (
                      <p className="text-sm text-brand-text-muted">
                        {[t.company_name, t.location].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
