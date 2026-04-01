import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/lib/utils/constants'

interface JsonLdProps {
  type: 'Organization' | 'LocalBusiness' | 'Product' | 'BreadcrumbList' | 'WebSite' | 'FAQPage'
  data?: Record<string, unknown>
}

export function JsonLd({ type, data }: JsonLdProps) {
  let structuredData: Record<string, unknown> = {}

  switch (type) {
    case 'Organization':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/images/logo.png`,
        description: SITE_DESCRIPTION,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: ['English'],
        },
        sameAs: [],
        ...data,
      }
      break

    case 'LocalBusiness':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#localbusiness`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/images/logo.png`,
        description: SITE_DESCRIPTION,
        image: `${SITE_URL}/images/logo.png`,
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'ZA',
        },
        priceRange: '₹',
        ...data,
      }
      break

    case 'WebSite':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        ...data,
      }
      break

    case 'Product':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        ...data,
      }
      break

    case 'BreadcrumbList':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        ...data,
      }
      break

    case 'FAQPage':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        ...data,
      }
      break
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function OrganizationJsonLd() {
  return <JsonLd type="Organization" />
}

export function WebSiteJsonLd() {
  return <JsonLd type="WebSite" />
}

export function LocalBusinessJsonLd() {
  return <JsonLd type="LocalBusiness" />
}

interface ProductJsonLdProps {
  name: string
  description: string
  image?: string
  slug: string
  price?: number
  currency?: string
}

export function ProductJsonLd({ name, description, image, slug, price, currency = 'INR' }: ProductJsonLdProps) {
  return (
    <JsonLd
      type="Product"
      data={{
        name,
        description,
        image: image ? `${SITE_URL}${image}` : `${SITE_URL}/images/logo.png`,
        url: `${SITE_URL}/products/${slug}`,
        brand: {
          '@type': 'Brand',
          name: SITE_NAME,
        },
        ...(price && {
          offers: {
            '@type': 'Offer',
            price: price.toString(),
            priceCurrency: currency,
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: SITE_NAME,
            },
          },
        }),
      }}
    />
  )
}

interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <JsonLd
      type="BreadcrumbList"
      data={{
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  )
}
