import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: 'SpeedyPrint privacy policy — how we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="bg-white py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-bold text-brand-text">Privacy Policy</h1>
        <p className="mt-2 text-sm text-brand-text-muted">Last updated: March 2026</p>

        <div className="prose prose-sm mt-8 max-w-none text-brand-text-muted">
          <h2 className="font-heading text-xl font-semibold text-brand-text">1. Information We Collect</h2>
          <p>We collect information you provide directly, including your name, email address, phone number, shipping address, and payment information when you place an order.</p>

          <h2 className="font-heading text-xl font-semibold text-brand-text">2. How We Use Your Information</h2>
          <p>We use your information to process orders, deliver products, communicate about your orders, improve our services, and send marketing communications (with your consent).</p>

          <h2 className="font-heading text-xl font-semibold text-brand-text">3. Data Protection</h2>
          <p>We comply with the Protection of Personal Information Act (POPIA) of South Africa. Your personal information is stored securely and we implement appropriate technical and organizational measures to protect it.</p>

          <h2 className="font-heading text-xl font-semibold text-brand-text">4. Third-Party Services</h2>
          <p>We use trusted third-party services for payment processing (PayFast), email delivery, and courier services. These services have their own privacy policies governing the use of your information.</p>

          <h2 className="font-heading text-xl font-semibold text-brand-text">5. Cookies</h2>
          <p>We use cookies and similar technologies to improve your browsing experience, analyze website traffic, and personalize content. You can manage cookie preferences in your browser settings.</p>

          <h2 className="font-heading text-xl font-semibold text-brand-text">6. Your Rights</h2>
          <p>Under POPIA, you have the right to access, correct, or delete your personal information. You may also object to the processing of your information or request data portability. Contact us to exercise these rights.</p>

          <h2 className="font-heading text-xl font-semibold text-brand-text">7. Contact</h2>
          <p>For privacy-related inquiries, contact our Information Officer at info@speedyprint.co.za.</p>
        </div>
      </div>
    </div>
  )
}
