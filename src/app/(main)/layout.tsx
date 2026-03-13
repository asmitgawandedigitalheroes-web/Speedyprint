import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { OrganizationJsonLd, WebSiteJsonLd, LocalBusinessJsonLd } from '@/components/seo/JsonLd'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <LocalBusinessJsonLd />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
