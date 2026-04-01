import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: `Terms of Service | ${SITE_NAME}`,
  description: 'Speedy Labels terms of service and conditions of use.',
}

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: "By accessing and using Speedy Labels' website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.",
  },
  {
    title: '2. Services',
    content: 'Speedy Labels provides custom printing services including stickers, labels, decals, and related products. We offer online design tools, artwork upload, and printing services delivered across India.',
  },
  {
    title: '3. Orders and Pricing',
    content: 'All prices are quoted in Indian Rupee (INR) and include GST. Prices are subject to change without notice. Once an order is confirmed and paid for, the quoted price will be honoured.',
  },
  {
    title: '4. Artwork and Design',
    content: 'Customers are responsible for ensuring their artwork is of sufficient quality and does not infringe on any third-party intellectual property rights. Speedy Labels reserves the right to refuse printing of any content deemed inappropriate or illegal.',
  },
  {
    title: '5. Production and Delivery',
    content: 'Production times are estimates and may vary depending on order complexity and volume. Delivery times are estimates and depend on courier availability and destination. Speedy Labels is not liable for delays caused by courier services.',
  },
  {
    title: '6. Returns and Refunds',
    content: 'Due to the custom nature of our products, we cannot accept returns unless there is a defect in the product. If you receive a defective product, please contact us within 7 days of delivery with photographic evidence.',
  },
  {
    title: '7. Limitation of Liability',
    content: "Speedy Labels' liability is limited to the value of the order. We are not liable for any indirect, consequential, or special damages arising from the use of our products or services.",
  },
  {
    title: '8. Contact',
    content: 'For questions about these terms, please contact us at info@speedylabels.co.za.',
  },
]

export default function TermsPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-1 w-8 bg-brand-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-brand-text">Terms of Service</h1>
          <p className="mt-2 text-sm text-brand-text-muted">Last updated: March 2026</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title} className="rounded-md border border-gray-100 bg-white p-6">
            <h2 className="font-heading text-base font-semibold text-brand-text mb-3">{section.title}</h2>
            <p className="text-sm text-brand-text-muted leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
