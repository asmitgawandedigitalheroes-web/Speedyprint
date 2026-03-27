'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Testimonial } from '@/types'

export function TestimonialsCarousel() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/testimonials?featured=true')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTestimonials(data)
      })
      .catch(() => {})
  }, [])

  const next = useCallback(() => {
    setCurrentIndex((prev) =>
      prev >= testimonials.length - 1 ? 0 : prev + 1
    )
  }, [testimonials.length])

  const prev = useCallback(() => {
    setCurrentIndex((prev) =>
      prev <= 0 ? testimonials.length - 1 : prev - 1
    )
  }, [testimonials.length])

  useEffect(() => {
    if (testimonials.length <= 1 || isHovered) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(next, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [testimonials.length, isHovered, next])

  if (testimonials.length === 0) return null

  // Show 2 testimonials per slide on desktop
  const perSlide = Math.min(2, testimonials.length)

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="grid grid-cols-1 gap-12 lg:grid-cols-3"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Left: heading + social proof */}
          <div className="flex flex-col justify-center">
            <h2 className="font-heading text-3xl font-bold text-brand-text lg:text-4xl">
              Trusted by<br />
              <span className="text-brand-primary">Industry Leaders</span>
            </h2>
            <p className="mt-4 text-brand-text-muted leading-relaxed">
              Join the 5,000+ brands that rely on our editorial-grade production daily.
            </p>

            {/* Avatars / social proof */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                {['bg-brand-primary', 'bg-brand-secondary', 'bg-brand-accent'].map((bg, i) => (
                  <div
                    key={i}
                    className={`h-8 w-8 rounded-full ${bg} border-2 border-white flex items-center justify-center`}
                  >
                    <span className="text-[10px] font-bold text-white">
                      {['SP', 'AB', 'CD'][i]}
                    </span>
                  </div>
                ))}
              </div>
              <span className="text-sm text-brand-text-muted">+4.9k more</span>
            </div>

            {/* Navigation */}
            {testimonials.length > perSlide && (
              <div className="mt-8 flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={prev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={next}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Right: testimonial cards (2 col) */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${currentIndex * (100 / perSlide)}%)`,
                }}
              >
                {testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="w-full shrink-0 px-2.5 sm:w-1/2"
                  >
                    <div className="rounded-2xl border border-gray-100 bg-brand-bg p-6 shadow-sm h-full flex flex-col">
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
                      <p className="mt-4 flex-1 text-sm leading-relaxed text-brand-text-muted italic">
                        &ldquo;{t.review_text.length > 180
                          ? `${t.review_text.substring(0, 180)}...`
                          : t.review_text}&rdquo;
                      </p>

                      {/* Author */}
                      <div className="mt-5 border-t border-gray-200 pt-4">
                        <p className="text-sm font-semibold text-brand-text">
                          {t.customer_name}
                        </p>
                        {(t.company_name || t.location) && (
                          <p className="text-xs uppercase tracking-wider text-brand-text-muted">
                            {[t.company_name, t.location]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
