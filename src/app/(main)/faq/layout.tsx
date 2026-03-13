import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Find answers to common questions about SpeedyPrint — ordering, pricing, turnaround times, file requirements, shipping, and custom design support.',
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
  openGraph: {
    title: 'FAQ | SpeedyPrint',
    description: 'Answers to common questions about ordering, pricing, turnaround and more.',
    url: `${SITE_URL}/faq`,
  },
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
