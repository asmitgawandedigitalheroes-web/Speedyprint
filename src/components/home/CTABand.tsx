'use client'

import Link from 'next/link'
import { MessageSquare, FileText } from 'lucide-react'
import { WHATSAPP_URL } from '@/lib/utils/constants'

export function CTABand() {
  return (
    <section className="bg-[#b91c1c] py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
          Not sure where to start?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          Tell us what you need and we’ll guide you to the right product for your specific requirements.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/order-now"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-brand-primary shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <FileText className="h-5 w-5" />
            Request a Quote
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-8 py-4 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <MessageSquare className="h-5 w-5" />
            WhatsApp Us
          </a>
        </div>
      </div>
    </section>
  )
}
