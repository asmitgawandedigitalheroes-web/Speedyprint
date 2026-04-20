'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tag, Hash, Bike, Stamp, Zap, Trophy, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Division definitions ─────────────────────────────────────────────────────
const DIVISIONS = [
  { href: '/labels',       label: 'Labels',       shortLabel: 'Labels',  Icon: Tag    },
  { href: '/race-numbers', label: 'Race Numbers',  shortLabel: 'Racing',  Icon: Hash   },
  { href: '/mtb-boards',   label: 'MTB Boards',    shortLabel: 'MTB',     Icon: Bike   },
  { href: '/products?division=print', label: 'Print', shortLabel: 'Print', Icon: Printer },
  { href: '/stamps',       label: 'Stamps',        shortLabel: 'Stamps',  Icon: Stamp  },
  { href: '/laser',        label: 'Laser',         shortLabel: 'Laser',   Icon: Zap    },
  { href: '/trophies',     label: 'Trophies',      shortLabel: 'Trophies',Icon: Trophy },
]

// ── Component ────────────────────────────────────────────────────────────────
export function DivisionNav() {
  const pathname = usePathname()

  return (
    <div className="border-t border-gray-100 bg-white">
      {/*
        Mobile  (<sm) : icon stacked above label, equal-width flex cells, no scroll
        Tablet  (sm)  : icon + inline label, scrollable if needed
        Desktop (lg)  : icon + inline label, centred, no scroll
      */}
      <div
        className={cn(
          'mx-auto max-w-7xl',
          // mobile: grid so all 7 fit side-by-side
          'grid grid-cols-7',
          // tablet+: switch to flex row
          'sm:flex sm:overflow-x-auto sm:scroll-smooth',
          'px-2 sm:px-6 lg:px-8',
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'lg:justify-center',
        )}
      >
        {DIVISIONS.map(({ href, label, shortLabel, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex flex-col items-center justify-center gap-1',
                // all breakpoints: stacked icon + label
                'py-2.5 px-1 sm:px-4 sm:py-3 lg:px-8',
                'shrink-0',
                // colour
                'transition-colors duration-150',
                isActive
                  ? 'text-brand-primary'
                  : 'text-gray-400 hover:text-brand-text',
              )}
            >
              {/* Icon */}
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 sm:h-[22px] sm:w-[22px]',
                  'transition-colors duration-150',
                  isActive
                    ? 'text-brand-primary'
                    : 'group-hover:text-brand-primary',
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />

              {/* Label — short on mobile, full on sm+ */}
              <span
                className={cn(
                  'text-[10px] font-semibold leading-none whitespace-nowrap',
                  'sm:text-xs lg:text-sm',
                  'transition-colors duration-150',
                )}
              >
                <span className="sm:hidden">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </span>

              {/* Active underline — bottom of the cell */}
              <span
                className={cn(
                  'absolute bottom-0 rounded-full h-[2px]',
                  'left-1 right-1 sm:left-4 sm:right-4 lg:left-8 lg:right-8',
                  'transition-all duration-200',
                  isActive
                    ? 'bg-brand-primary opacity-100'
                    : 'bg-brand-primary opacity-0 group-hover:opacity-25',
                )}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
