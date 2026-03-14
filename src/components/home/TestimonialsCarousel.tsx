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
      .catch(() => {
        // Silently fail — carousel just won't show
      })
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

  // Auto-scroll
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

  // Show up to 3 testimonials on desktop
  const visibleCount = Math.min(3, testimonials.length)

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-brand-text">
            What Our Customers Say
          </h2>
          <p className="mt-2 text-brand-text-muted">
            Trusted by businesses across South Africa.
          </p>
        </div>

        <div
          className="relative mt-12"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Cards */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
              }}
            >
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="w-full shrink-0 px-3 sm:w-1/2 lg:w-1/3"
                >
                  <div className="rounded-xl border bg-white p-6 shadow-sm">
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
                      &quot;{t.review_text.length > 150
                        ? `${t.review_text.substring(0, 150)}...`
                        : t.review_text}&quot;
                    </p>

                    {/* Author */}
                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm font-semibold text-brand-text">
                        {t.customer_name}
                      </p>
                      {(t.company_name || t.location) && (
                        <p className="text-xs text-brand-text-muted">
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

          {/* Navigation arrows */}
          {testimonials.length > visibleCount && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full shadow-md lg:flex"
                onClick={prev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full shadow-md lg:flex"
                onClick={next}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Dots */}
          <div className="mt-6 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-6 bg-brand-primary'
                    : 'w-2 bg-gray-300'
                }`}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
