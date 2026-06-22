import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Print to Post terms and conditions for payments, delivery, artwork, and orders.',
}

const SECTIONS = [
  {
    title: 'Payments',
    content: [
      'Please only make payment upon receipt of an invoice.',
      'Use the invoice number as your payment reference.',
      'Payments made using a quotation number cannot be tracked.',
    ],
  },
  {
    title: 'Delivery',
    content: [
      'Deliveries are fulfilled via The Courier Guy, unless otherwise arranged. Standard courier terms and conditions apply.',
      'You are welcome to use your own courier or a same-day service such as Uber Parcel.',
      'All goods are deemed to be in good order once they leave our factory. Print to Post accepts no responsibility for damage or loss occurring during transit. Please ensure that you have adequate insurance cover for goods being transported.',
    ],
  },
  {
    title: 'Artwork',
    content: [
      'All design elements must be supplied by the customer.',
      'Two (2) free proofs are included. Additional proofs are charged at R250.00 each.',
      'All artwork is reproduced from scratch, and while we take every care, minor human errors can occur.',
      'A digital proof will be supplied for approval prior to printing. Please check all details carefully, including spelling, layout, images, and colours.',
      'Final responsibility for checking artwork rests with the customer.',
      'Once artwork is approved via email, Print to Post accepts no responsibility for any errors.',
    ],
  },
  {
    title: 'Hand-Applied Labels',
    content: [
      'Due to the manual nature of hand application, minor variations may occur, such as slight misalignment, small air bubbles, or uneven adhesion. These do not affect the functionality of the product.',
      'Please inspect labels on receipt, before use. Print to Post is not liable for issues arising from these standard manual-application tolerances.',
    ],
  },
  {
    title: 'Colour Disclaimer',
    content: [
      'Please note: A 10–15% colour variation may occur between on-screen appearance and printed output, as well as across different paper stocks.',
      'We can provide a digital colour sample print on request, should you wish to check colours before proceeding.',
    ],
  },
  {
    title: 'Lead Time',
    content: [
      'Standard lead time: 4–6 working days from both artwork approval and receipt of deposit.',
      'Shorter lead times may be available depending on production load; rush fees may apply.',
      'Same-day orders carry a surcharge of R450.00 (T&Cs apply).',
    ],
  },
  {
    title: 'Quotations & Payment Terms',
    content: [
      'All quotes are valid for 15 days.',
      'Quotations are based on provided specifications, samples, or design files, and may be subject to additional charges for author\'s corrections or overtime required to meet urgent deadlines.',
      '30-day payment terms apply for approved account holders.',
      'Overdue invoices incur 0.85% interest per month plus a R100 administration fee.',
    ],
  },
  {
    title: 'Deposit',
    content: [
      'A 60% deposit is required upon acceptance of the quotation.',
      'Banking Details: Print to Post | ABSA Bank | Acc No: 404 869 3758 | Branch Code: 334 705 | SWIFT Code: ABSAZAJJ',
    ],
  },
  {
    title: 'Other Conditions',
    content: [
      'Industry standards allow for a 10% over- or under-production variance.',
      'Any complaints regarding quality must be submitted in writing within 7 days of delivery.',
      'We commit to responding to all complaints within 5 working days.',
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-1 w-8 bg-brand-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-brand-text">Terms &amp; Conditions</h1>
          <p className="mt-2 text-sm text-brand-text-muted">Last updated: June 2026</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title} className="rounded-md border border-gray-100 bg-white p-6">
            <h2 className="font-heading text-base font-semibold text-brand-text mb-3">{section.title}</h2>
            <ul className="space-y-2">
              {section.content.map((item, i) => (
                <li key={i} className="text-sm text-brand-text-muted leading-relaxed flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
