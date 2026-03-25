'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin, Clock } from 'lucide-react'
import { SITE_NAME, WHATSAPP_URL } from '@/lib/utils/constants'
import { useSiteSettings } from '@/hooks/useSiteSettings'

const QUICK_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/our-story', label: 'Our Story' },
  { href: '/order-now', label: 'Order Now' },
  { href: '/templates', label: 'Design Wizard' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
  { href: '/delivery-info', label: 'Delivery Info' },
]

const PRODUCT_LINKS = [
  { href: '/products?division=labels', label: 'Custom Stickers' },
  { href: '/products?division=labels', label: 'Product Labels' },
  { href: '/products?division=laser', label: 'Vehicle Decals' },
  { href: '/products?division=events', label: 'Window Graphics' },
  { href: '/products?division=stamps', label: 'Specialty & 3D Domed' },
]

export function Footer() {
  const { settings } = useSiteSettings()
  const currentYear = new Date().getFullYear()

  // Dynamic values with fallbacks
  const companyEmail = settings.company_email || 'info@speedylabels.co.za'
  const companyPhone = settings.company_phone || '+27 (0) 12 345 6789'
  const companyAddress = settings.company_address || 'Cape Town, South Africa'
  const whatsappNumber = settings.whatsapp_number
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`
    : WHATSAPP_URL
  const facebookUrl = settings.social_facebook || 'https://facebook.com/speedyprint'
  const instagramUrl = settings.social_instagram || 'https://instagram.com/speedyprint'
  const linkedinUrl = settings.social_twitter || 'https://linkedin.com/company/speedyprint'
  const siteName = settings.site_name || SITE_NAME

  const SOCIAL_LINKS = [
    { href: facebookUrl, icon: Facebook, label: 'Facebook' },
    { href: instagramUrl, icon: Instagram, label: 'Instagram' },
    { href: linkedinUrl, icon: Linkedin, label: 'LinkedIn' },
  ]

  return (
    <footer className="bg-brand-secondary text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Branding */}
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/images/logo.png"
                alt={siteName}
                width={160}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-4 text-sm text-white/70">
              Premium custom stickers, labels, and decals. Quality prints
              delivered fast across South Africa.
            </p>
            <div className="mt-4 flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-brand-primary"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="mb-3 h-0.5 w-6 rounded-full bg-brand-primary" />
            <h3 className="mb-4 text-sm font-semibold text-white">
              Quick links
            </h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <div className="mb-3 h-0.5 w-6 rounded-full bg-brand-primary" />
            <h3 className="mb-4 text-sm font-semibold text-white">
              Products
            </h3>
            <ul className="space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <div className="mb-3 h-0.5 w-6 rounded-full bg-brand-primary" />
            <h3 className="mb-4 text-sm font-semibold text-white">
              Contact us
            </h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                <a
                  href={`mailto:${companyEmail}`}
                  className="transition-colors hover:text-white"
                >
                  {companyEmail}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                <a
                  href={`tel:${companyPhone.replace(/[^+0-9]/g, '')}`}
                  className="transition-colors hover:text-white"
                >
                  {companyPhone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                <span>{companyAddress}</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                <span>Mon - Fri: 08:00 - 17:00</span>
              </li>
            </ul>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#20BD5A]"
            >
              WhatsApp Us
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-white/50">
              &copy; {currentYear} {siteName}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/terms"
                className="text-sm text-white/50 transition-colors hover:text-white"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-white/50 transition-colors hover:text-white"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
