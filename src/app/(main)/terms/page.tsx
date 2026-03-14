import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: `Terms of Service | ${SITE_NAME}`,
  description: 'SpeedyPrint terms of service and conditions of use.',
}

export default function TermsPage() {
  return (
    <div className="bg-white py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-bold text-brand-text">Terms of Service</h1>
        <p className="mt-2 text-sm text-brand-text-muted">Last updated: March 2026</p>

        <div className="prose prose-sm mt-8 max-w-none text-brand-text-muted">
          <h2 className="font-heading text-xl font-semibold text-brand-text">1. Acceptance of Terms</h2>
          <p>By accessing and using SpeedyPrint&apos;s website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>

          <h2 className="font-heading text-xl font-semibold text-brand-text">2. Services</h2>
          <p>SpeedyPrint provides custom printing services including stickers, labels, decals, and related products. We offer online design tools, artwork upload, and printing services delivered across South Africa.</p>

          <h2 className="font-heading text-xl font-semibold text-brand-text">3. Orders and Pricing</h2>
          <p>All prices are quoted in South African Rand (ZAR) and include VAT at 15%. Prices are subject to change without notice. Once an order is confirmed and paid for, the quoted price will be honored.</p>

          <h2 className="font-heading text-xl font-semibold text-brand-text">4. Artwork and Design</h2>
          <p>Customers are responsible for ensuring their artwork is of sufficient quality and does not infringe on any third-party intellectual property rights. SpeedyPrint reserves the right to refuse printing of any content deemed inappropriate or illegal.</p>

          <h2 className="font-heading text-xl font-semibold text-brand-text">5. Production and Delivery</h2>
          <p>Production times are estimates and may vary depending on order complexity and volume. Delivery times are estimates and depend on courier availability and destination. SpeedyPrint is not liable for delays caused by courier services.</p>

          <h2 className="font-heading text-xl font-semibold text-brand-text">6. Returns and Refunds</h2>
          <p>Due to the custom nature of our products, we cannot accept returns unless there is a defect in the product. If you receive a defective product, please contact us within 7 days of delivery with photographic evidence.</p>

          <h2 className="font-heading text-xl font-semibold text-brand-text">7. Limitation of Liability</h2>
          <p>SpeedyPrint&apos;s liability is limited to the value of the order. We are not liable for any indirect, consequential, or special damages arising from the use of our products or services.</p>

          <h2 className="font-heading text-xl font-semibold text-brand-text">8. Contact</h2>
          <p>For questions about these terms, please contact us at info@speedyprint.co.za.</p>
        </div>
      </div>
    </div>
  )
}
