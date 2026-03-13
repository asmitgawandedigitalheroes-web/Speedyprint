import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with SpeedyPrint for custom printing orders, quotes, and support. Email, phone, or visit our location in South Africa.',
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: 'Contact SpeedyPrint',
    description: 'Reach out for custom printing orders, quotes, and support.',
    url: `${SITE_URL}/contact`,
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
