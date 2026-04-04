'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Upload, PencilLine, Eye, ArrowRight, CheckCircle2 } from 'lucide-react'

const PANELS = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload your artwork',
    description: 'Drop in a PNG, SVG, or PDF — or pick from 1,200+ ready-made templates.',
    mockup: (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-brand-primary/30 bg-brand-primary/5 px-6 py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
          <Upload className="h-5 w-5 text-brand-primary" />
        </div>
        <p className="text-xs font-medium text-brand-text">Drop file here</p>
        <p className="text-[10px] text-brand-text-muted">PNG · SVG · PDF up to 50 MB</p>
        <div className="rounded-md bg-brand-primary px-3 py-1 text-[10px] font-semibold text-white">
          Browse files
        </div>
      </div>
    ),
  },
  {
    step: '02',
    icon: PencilLine,
    title: 'Edit text & colours',
    description: 'Change fonts, swap colours, and resize everything in our browser-based editor — no software needed.',
    mockup: (
      <div className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
          <span className="text-[10px] font-medium text-brand-text-muted w-12">Font</span>
          <span className="text-xs font-semibold text-brand-text">Montserrat</span>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
          <span className="text-[10px] font-medium text-brand-text-muted w-12">Colour</span>
          <span className="h-4 w-4 rounded-full bg-brand-primary inline-block" />
          <span className="text-xs font-semibold text-brand-text">#E30613</span>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
          <span className="text-[10px] font-medium text-brand-text-muted w-12">Text</span>
          <span className="text-xs font-semibold text-brand-text">Your Brand Name</span>
        </div>
        <div className="mt-1 flex gap-1.5">
          {['B', 'I', 'U'].map((f) => (
            <span key={f} className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-[10px] font-bold text-brand-text-muted">
              {f}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    step: '03',
    icon: Eye,
    title: 'Preview your print',
    description: 'See a pixel-perfect proof before committing to print. Approve or request changes instantly.',
    mockup: (
      <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">Preview</span>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">Print-ready</span>
        </div>
        <div className="flex items-center justify-center rounded-md bg-gradient-to-br from-gray-50 to-gray-100 py-5">
          <div className="rounded-md bg-brand-primary px-4 py-2 shadow-md">
            <p className="text-xs font-bold text-white">Your Brand Name</p>
            <p className="text-[9px] text-white/70">speedyprint.co.za</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          <span className="text-[10px] text-brand-text-muted">Bleed & safe zone verified</span>
        </div>
      </div>
    ),
  },
]

export function DesignerDemo() {
  const [active, setActive] = useState(0)

  const advance = useCallback(() => {
    setActive((prev) => (prev + 1) % PANELS.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(advance, 2000)
    return () => clearInterval(timer)
  }, [advance])

  const handleSelect = (i: number) => {
    setActive(i)
  }

  return (
    <section className="bg-brand-bg py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 lg:p-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">

            {/* Left — copy */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-primary">
                Online designer
              </p>
              <h2 className="font-heading text-3xl font-bold text-brand-text lg:text-4xl">
                Design your label in minutes
              </h2>
              <p className="mt-4 text-brand-text-muted">
                No design software, no account required. Upload your logo or pick a template, customise it in the browser, and get a print-ready proof — all before you spend a cent.
              </p>

              {/* Step list (clickable) */}
              <div className="mt-8 flex flex-col gap-3">
                {PANELS.map((panel, i) => {
                  const Icon = panel.icon
                  return (
                    <button
                      key={panel.step}
                      onClick={() => handleSelect(i)}
                      className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                        active === i
                          ? 'border-brand-primary/40 bg-brand-primary/5 shadow-sm'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        active === i ? 'bg-brand-primary text-white' : 'bg-gray-100 text-brand-text-muted'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold transition-colors ${
                          active === i ? 'text-brand-primary' : 'text-brand-text'
                        }`}>
                          {panel.title}
                        </p>
                        <p className="mt-0.5 text-xs text-brand-text-muted">{panel.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <Link
                href="/templates"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                Try it now — no account needed
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right — active panel mockup */}
            <div className="hidden lg:block">
              <div className="rounded-2xl border border-gray-100 bg-brand-bg p-8 shadow-inner">
                {/* Step indicator */}
                <div className="mb-6 flex items-center gap-3">
                  {PANELS.map((p, i) => (
                    <button
                      key={p.step}
                      onClick={() => setActive(i)}
                      className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        active === i
                          ? 'bg-brand-primary text-white'
                          : 'bg-gray-100 text-brand-text-muted hover:bg-gray-200'
                      }`}
                    >
                      <span>{p.step}</span>
                      <span className="hidden sm:inline">{p.title.split(' ').slice(0, 2).join(' ')}</span>
                    </button>
                  ))}
                </div>

                {/* Active panel mockup */}
                <div className="transition-all duration-300">
                  {PANELS[active].mockup}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
