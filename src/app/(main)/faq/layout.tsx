import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/lib/utils/constants'
import { JsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Find answers to common questions about SpeedyPrint — ordering, pricing, turnaround times, file requirements, shipping, and custom design support.',
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
  openGraph: {
    title: 'FAQ | SpeedyPrint',
    description: 'Answers to common questions about ordering, pricing, turnaround and more.',
    url: `${SITE_URL}/faq`,
  },
}

// FAQ structured data for Google rich results
const faqStructuredData = {
  mainEntity: [
    {
      '@type': 'Question',
      name: `What is ${SITE_NAME}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${SITE_NAME} is a South African web-to-print platform offering custom printing solutions across five specialized divisions: labels, laser cutting, event numbers, stamps, and trophies/sleeves.`,
      },
    },
    {
      '@type': 'Question',
      name: 'How do I place an order?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Browse our product catalog, select a product, customize it using our online designer or upload your own artwork, approve your digital proof, and proceed to checkout.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need design software?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No! Our built-in online designer lets you create professional designs right in your browser. Just choose a template, add your text and images, and you\'re ready to print.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are your turnaround times?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Standard orders are typically ready within 3-5 business days after proof approval. Rush options may be available depending on the product type.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you ship nationwide?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we deliver across all nine provinces of South Africa. Shipping costs are calculated based on your delivery address and order size.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I track my order?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, log into your account to view your order status in real-time. You\'ll also receive email updates at each stage of production.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is your return policy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Since all products are custom-made, we cannot accept returns unless there is a manufacturing defect. Please review your digital proof carefully before approving.',
      },
    },
    {
      '@type': 'Question',
      name: 'What file formats do you accept?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We accept PNG, JPG, SVG, and PDF files. For best results, upload high-resolution images (300 DPI or higher).',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a digital proof?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A digital proof is a preview of your finished product. You can review it online, zoom in on details, and either approve it for production or request changes.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use CSV for bulk orders?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! For event numbers, race bibs, and similar products, you can upload a CSV file with participant data and we\'ll automatically generate individual designs for each entry.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is pricing calculated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pricing depends on the product type, quantity, material, size, and any finishing options. Our real-time price calculator shows you the cost as you configure your product.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are there quantity discounts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we offer tiered pricing with discounts for larger quantities. The more you order, the lower the per-unit cost.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is VAT included in the prices?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Prices displayed on our website exclude 15% VAT. VAT is calculated and shown separately during checkout.',
      },
    },
  ],
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd type="FAQPage" data={faqStructuredData} />
      {children}
    </>
  )
}
