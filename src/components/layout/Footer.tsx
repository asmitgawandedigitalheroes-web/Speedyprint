import Link from 'next/link'
import { SITE_NAME, DIVISIONS } from '@/lib/utils/constants'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Branding */}
          <div>
            <Link href="/" className="text-2xl font-bold text-brand-red">
              {SITE_NAME}
            </Link>
            <p className="mt-3 text-sm text-gray-400">
              Custom printing solutions for labels, laser cutting, event
              numbers, stamps, and more. Quality prints delivered fast.
            </p>
          </div>

          {/* Divisions */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-yellow">
              Our Divisions
            </h3>
            <ul className="space-y-2">
              {DIVISIONS.map((division) => (
                <li key={division.key}>
                  <Link
                    href={`/products?division=${division.key}`}
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {division.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-yellow">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-yellow">
              Contact Us
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Email: info@speedyprint.co.za</li>
              <li>Phone: +27 (0) 12 345 6789</li>
              <li>Mon - Fri: 08:00 - 17:00</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-gray-700 pt-6">
          <p className="text-center text-sm text-gray-500">
            &copy; {currentYear} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
