import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: 'Speedy Labels privacy policy — how we collect, use, and protect your personal information.',
}

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: 'We collect information you provide directly, including your name, email address, phone number, shipping address, and payment information when you place an order.',
  },
  {
    title: '2. How We Use Your Information',
    content: 'We use your information to process orders, deliver products, communicate about your orders, improve our services, and send marketing communications (with your consent).',
  },
  {
    title: '3. Data Protection',
    content: 'We comply with the Protection of Personal Information Act (POPIA) of South Africa. Your personal information is stored securely and we implement appropriate technical and organizational measures to protect it.',
  },
  {
    title: '4. Third-Party Services',
    content: 'We use trusted third-party services for payment processing (PayFast), email delivery, and courier services. These services have their own privacy policies governing the use of your information.',
  },
  {
    title: '5. Cookies',
    content: 'We use cookies and similar technologies to improve your browsing experience, analyze website traffic, and personalize content. You can manage cookie preferences in your browser settings.',
  },
  {
    title: '6. Your Rights',
    content: 'Under POPIA, you have the right to access, correct, or delete your personal information. You may also object to the processing of your information or request data portability. Contact us to exercise these rights.',
  },
  {
    title: '7. Contact',
    content: 'For privacy-related inquiries, contact our Information Officer at info@speedylabels.co.za.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-1 w-8 bg-brand-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-brand-text">Privacy Policy</h1>
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
