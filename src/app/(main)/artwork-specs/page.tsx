import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, XCircle, AlertTriangle, Download, FileText, Image as ImageIcon, Layers, Type } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: `Artwork & Print Specifications | ${SITE_NAME}`,
  description:
    'File formats, resolution requirements, colour mode, bleed, safe zones, and font guidelines for submitting print-ready artwork to Speedy Print.',
}

const TEMPLATES = [
  { name: 'Business Card Template', file: '/templates/business-card-template.svg', download: 'Speedy-Print-Business-Card-Template.svg', note: '90×50mm — with bleed, trim & safe zone guides' },
  { name: 'Coffee Cup Sleeve Template', file: '/templates/coffee-cup-sleeve-template.svg', download: 'Speedy-Print-Coffee-Cup-Sleeve-Template.svg', note: '270×70mm — wrap sleeve with layout zones' },
  { name: 'A4 Label Sheet Template', file: '/templates/a4-label-template.svg', download: 'Speedy-Print-A4-Label-Template.svg', note: 'A4 (210×297mm) — bleed & safe zone guides included' },
  { name: '100×50mm Label Template', file: '/templates/100x50mm-label-template.svg', download: 'Speedy-Print-100x50mm-Label-Template.svg', note: 'Standard product label size — with bleed & trim marks' },
  { name: 'Race Number Template (Standard)', file: '/templates/race-number-standard-template.svg', download: 'Speedy-Print-Race-Number-Standard-Template.svg', note: '148×210mm — standard bib size with layout zones' },
  { name: 'Race Number Template (Small)', file: '/templates/race-number-template.svg', download: 'Speedy-Print-Race-Number-Template.svg', note: '200×150mm — small bib size with layout zones' },
  { name: 'MTB Board Template', file: '/templates/mtb-board-template.svg', download: 'Speedy-Print-MTB-Board-Template.svg', note: '250×200mm — Correx board with bleed & safe zone' },
]

export default function ArtworkSpecsPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Header */}
      <div className="bg-brand-secondary">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-white">Artwork & print specifications</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/60">
            Set up your files correctly the first time and avoid production delays. Everything you need to know about submitting print-ready artwork.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">

        {/* 1. Accepted File Formats */}
        <section className="rounded-md border border-gray-100 bg-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-primary/10">
              <FileText className="h-5 w-5 text-brand-primary" />
            </div>
            <h2 className="font-heading text-xl font-bold text-brand-text">1. Accepted file formats</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                ext: 'PDF',
                preferred: true,
                desc: 'Vector preferred. Fonts must be embedded or outlined. Bleed must be included. Crop marks optional but helpful.',
              },
              {
                ext: 'AI (Adobe Illustrator)',
                preferred: false,
                desc: 'Fonts outlined. Linked images embedded. Save as CS6 or lower for compatibility.',
              },
              {
                ext: 'EPS',
                preferred: false,
                desc: 'Vector format. All fonts outlined. Linked images embedded.',
              },
              {
                ext: 'PNG',
                preferred: false,
                desc: '300 DPI minimum at final print size. Transparent background preferred where applicable.',
              },
              {
                ext: 'JPEG / JPG',
                preferred: false,
                desc: '300 DPI minimum at final print size. Not suitable for files requiring transparency.',
              },
              {
                ext: 'SVG',
                preferred: false,
                desc: 'Accepted for online design tool exports. Fonts must be outlined/converted to paths.',
              },
            ].map((fmt) => (
              <div key={fmt.ext} className="flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-xs font-bold ${fmt.preferred ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {fmt.ext}
                  {fmt.preferred && ' ★'}
                </span>
                <p className="text-sm text-brand-text-muted">{fmt.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Resolution */}
        <section className="rounded-md border border-gray-100 bg-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-primary/10">
              <ImageIcon className="h-5 w-5 text-brand-primary" />
            </div>
            <h2 className="font-heading text-xl font-bold text-brand-text">2. Resolution requirements</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <p className="text-sm text-brand-text-muted"><strong>Minimum: 300 DPI</strong> at the final print size. This is the absolute minimum for acceptable print quality.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <p className="text-sm text-brand-text-muted"><strong>Preferred: 600 DPI</strong> for small text, fine detail, or high-end labels where sharpness is critical.</p>
            </div>
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                <strong>Files below 150 DPI will print blurry</strong> and may be returned for replacement. We will contact you before printing if your file does not meet minimum resolution requirements.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Colour Mode */}
        <section className="rounded-md border border-gray-100 bg-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-primary/10">
              <Layers className="h-5 w-5 text-brand-primary" />
            </div>
            <h2 className="font-heading text-xl font-bold text-brand-text">3. Colour mode</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <p className="text-sm text-brand-text-muted"><strong>Print files must be in CMYK colour mode.</strong> This ensures the most accurate colour reproduction on press.</p>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-sm text-brand-text-muted"><strong>RGB files will be converted to CMYK</strong> during our pre-press process. Colours — particularly bright greens, blues, and purples — may shift noticeably. For colour-critical jobs, always supply CMYK files.</p>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-sm text-brand-text-muted"><strong>Pantone / spot colours:</strong> Please contact us before submitting if your artwork uses Pantone or spot colour references. Additional charges may apply.</p>
            </div>
          </div>
        </section>

        {/* 4. Bleed & Safe Zone */}
        <section className="rounded-md border border-gray-100 bg-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-primary/10">
              <Layers className="h-5 w-5 text-brand-primary" />
            </div>
            <h2 className="font-heading text-xl font-bold text-brand-text">4. Bleed & safe zone</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            <div className="rounded-md border border-gray-100 bg-brand-bg p-4 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-red-100">
                <span className="text-xs font-bold text-red-600">BLEED</span>
              </div>
              <p className="text-sm font-semibold text-brand-text">3mm bleed</p>
              <p className="mt-1 text-xs text-brand-text-muted">Extend all background colours and images 3mm beyond the trim line on all four sides.</p>
            </div>
            <div className="rounded-md border border-gray-100 bg-brand-bg p-4 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100">
                <span className="text-xs font-bold text-blue-600">TRIM</span>
              </div>
              <p className="text-sm font-semibold text-brand-text">Trim line</p>
              <p className="mt-1 text-xs text-brand-text-muted">The final cut edge of your product. Your design should not rely on exact cutting at this line.</p>
            </div>
            <div className="rounded-md border border-gray-100 bg-brand-bg p-4 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-green-100">
                <span className="text-xs font-bold text-green-600">SAFE</span>
              </div>
              <p className="text-sm font-semibold text-brand-text">3mm safe zone</p>
              <p className="mt-1 text-xs text-brand-text-muted">Keep all critical content (text, logos) at least 3mm inside the trim edge to avoid being cut off.</p>
            </div>
          </div>
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <strong>In summary:</strong> Your artboard = final size + 3mm bleed on all sides. All important content must be 3mm inside the final size. Download one of our templates below for a pre-configured guide.
          </div>
        </section>

        {/* 5. Fonts */}
        <section className="rounded-md border border-gray-100 bg-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-primary/10">
              <Type className="h-5 w-5 text-brand-primary" />
            </div>
            <h2 className="font-heading text-xl font-bold text-brand-text">5. Font requirements</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <p className="text-sm text-brand-text-muted"><strong>All fonts must be outlined</strong> (converted to curves/paths) before saving, or embedded within the PDF.</p>
            </div>
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-brand-text-muted"><strong>Live (un-outlined) fonts without embedding will cause production errors.</strong> We cannot guarantee that our systems have your specific font installed, which can result in font substitution or missing text.</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 mt-2">
              <p className="text-xs font-semibold text-brand-text mb-1">How to outline fonts in Adobe Illustrator:</p>
              <p className="text-xs text-brand-text-muted">Select All (Ctrl/Cmd+A) → Type menu → Create Outlines. Then save or export as PDF.</p>
            </div>
          </div>
        </section>

        {/* 6. Template Downloads */}
        <section className="rounded-md border border-gray-100 bg-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-primary/10">
              <Download className="h-5 w-5 text-brand-primary" />
            </div>
            <h2 className="font-heading text-xl font-bold text-brand-text">6. Template downloads</h2>
          </div>
          <p className="text-sm text-brand-text-muted mb-6">
            Download our pre-configured artwork templates with bleed, trim line, and safe zone guides already set up.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TEMPLATES.map((template) => (
              <div
                key={template.name}
                className="flex items-center justify-between rounded-md border border-gray-100 bg-brand-bg p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-text">{template.name}</p>
                  <p className="mt-0.5 text-xs text-brand-text-muted">{template.note}</p>
                </div>
                <a
                  href={template.file}
                  download={template.download}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-primary-dark"
                >
                  <Download className="h-3 w-3" />
                  Download SVG
                </a>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-brand-text-muted">
            Need a template for a size not listed? <Link href="/contact" className="text-brand-primary underline underline-offset-2">Contact us</Link> and we&apos;ll create one for you.
          </p>
        </section>

        {/* 7. Common Mistakes Guide */}
        <section className="rounded-md border border-gray-100 bg-white p-8">
          <h2 className="font-heading text-xl font-bold text-brand-text mb-6">7. Common mistakes to avoid</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-semibold text-green-700">Correctly set up file</span>
              </div>
              <ul className="space-y-2 text-sm text-brand-text-muted">
                {[
                  'CMYK colour mode',
                  '300+ DPI at print size',
                  '3mm bleed on all sides',
                  'All fonts outlined or embedded',
                  'Critical content 3mm inside trim',
                  'PDF with embedded images',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-semibold text-red-700">Common mistakes</span>
              </div>
              <ul className="space-y-2 text-sm text-brand-text-muted">
                {[
                  'RGB colour mode (colours will shift)',
                  'Low resolution — screen-res images (72 DPI)',
                  'No bleed — white edges after cutting',
                  'Live (un-outlined) fonts',
                  'Text or logos too close to the edge',
                  'Linked images not embedded in PDF',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-md border-t-4 border-brand-primary bg-brand-secondary p-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-white">Not sure if your file is print-ready?</h2>
          <p className="mt-2 text-white/60">Send it to us and our team will check it before production begins. No charge for a preflight check.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
            >
              Send us your file
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
