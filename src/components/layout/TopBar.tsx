import Link from 'next/link'

export function TopBar() {
  return (
    <div className="hidden bg-brand-secondary py-1.5 md:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <p className="text-xs text-white/80">
          Part of{' '}
          <span className="font-medium text-white">
            The Direct Solutions Family of Brands
          </span>
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="mailto:info@speedylabels.co.za"
            className="text-xs text-white/80 transition-colors hover:text-white"
          >
            info@speedylabels.co.za
          </Link>
          <span className="text-white/40">|</span>
          <Link
            href="tel:+27123456789"
            className="text-xs text-white/80 transition-colors hover:text-white"
          >
            +27 (0) 12 345 6789
          </Link>
        </div>
      </div>
    </div>
  )
}
