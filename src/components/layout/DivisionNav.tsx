'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// ── Division data ────────────────────────────────────────────────────────────
// To swap in a real per-division logo: change only the `image` field.
// Drop the new file in /public/images/ and update the path here — no JSX changes needed.
const DIVISION_LINKS = [
  {
    href:  '/labels',
    label: 'Labels',
    image: '/images/products/custom-labels.png',
  },
  {
    href:  '/race-numbers',
    label: 'Race Numbers',
    image: '/images/products/race-bibs.png',
  },
  {
    href:  '/mtb-boards',
    label: 'MTB Boards',
    image: '/images/products/mtb-number-boards.png',
  },
  {
    href:  '/stamps',
    label: 'Stamps',
    image: '/images/products/self-inking-stamps.png',
  },
  {
    href:  '/laser',
    label: 'Laser',
    image: '/images/products/acrylic-signs.png',
  },
  {
    href:  '/trophies',
    label: 'Trophies',
    image: '/images/products/award-trophies.png',
  },
]

// ── Component ────────────────────────────────────────────────────────────────

export function DivisionNav() {
  const pathname = usePathname()

  return (
    <div className="border-t border-gray-100 bg-white">
      <div
        className={cn(
          'mx-auto flex max-w-7xl items-center',
          'gap-1 overflow-x-auto scroll-smooth',
          'px-4 py-2 sm:px-6 lg:px-8',
          // hide scrollbar across browsers
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          // desktop: centre & spread evenly
          'lg:justify-center lg:gap-0',
        )}
      >
        {DIVISION_LINKS.map(({ href, label, image }) => {
          // Matches both the root (/labels) and any sub-page (/labels/vinyl-stickers)
          const isActive = pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex shrink-0 flex-col items-center gap-1',
                'rounded-xl px-3 py-1.5 transition-colors duration-150',
                'lg:max-w-[110px] lg:flex-1',
                isActive ? 'bg-brand-primary/5' : 'hover:bg-gray-50',
              )}
            >
              {/* Image bubble */}
              <div
                className={cn(
                  'relative h-10 w-10 overflow-hidden rounded-xl',
                  'ring-2 transition-all duration-150',
                  isActive
                    ? 'ring-brand-primary shadow-sm'
                    : 'ring-gray-200 group-hover:ring-brand-primary/40',
                )}
              >
                <Image
                  src={image}
                  alt={label}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  'whitespace-nowrap text-[10px] font-semibold leading-tight',
                  isActive
                    ? 'text-brand-primary'
                    : 'text-brand-text-muted group-hover:text-brand-text',
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
