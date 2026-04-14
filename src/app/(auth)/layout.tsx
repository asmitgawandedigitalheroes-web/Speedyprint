import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SITE_NAME } from '@/lib/utils/constants'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-brand-secondary flex-col justify-between p-12 text-white">
        {/* Top: logo */}
        <Link href="/" className="inline-block">
            <Image
              src="/images/speedyprint-logo.png"
              alt={SITE_NAME}
              width={140}
              height={36}
              className="h-14 w-auto"
            />
        </Link>

        {/* Centre: tagline */}
        <div className="space-y-6">
          <div className="h-1 w-10 bg-brand-primary" />
          <p className="font-heading text-4xl font-bold leading-tight text-white">
            Quality printing,<br />delivered fast.
          </p>
          <p className="text-lg text-white/60 max-w-sm">
            South Africa&apos;s complete online custom print and fabrication platform.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-0 divide-x divide-white/10 pt-4">
            <div className="pr-8">
              <p className="font-heading text-2xl font-bold text-white">5 000+</p>
              <p className="text-xs text-white/50 mt-0.5">Happy clients</p>
            </div>
            <div className="px-8">
              <p className="font-heading text-2xl font-bold text-white">24 hr</p>
              <p className="text-xs text-white/50 mt-0.5">Turnaround</p>
            </div>
            <div className="pl-8">
              <p className="font-heading text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-white/50 mt-0.5">Quality</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <p className="text-xs text-white/30">
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-white p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
