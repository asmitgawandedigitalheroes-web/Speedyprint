import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/utils/constants'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-red relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-72 h-72 rounded-full border-[3px] border-white" />
          <div className="absolute bottom-32 right-10 w-56 h-56 rounded-full border-[3px] border-white" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full border-[3px] border-white" />
        </div>

        {/* Top — Logo / Site name */}
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">{SITE_NAME}</h1>
        </div>

        {/* Centre — Tagline */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Quality printing,
            <br />
            delivered fast.
          </h2>
          <p className="text-lg text-white/80 max-w-md">
            {SITE_DESCRIPTION}
          </p>
        </div>

        {/* Bottom — Decoration / copyright */}
        <div className="relative z-10 text-sm text-white/60">
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
