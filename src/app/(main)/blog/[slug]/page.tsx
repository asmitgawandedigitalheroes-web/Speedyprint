import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BlogPost } from '@/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  return data as BlogPost | null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return { title: `Post Not Found | ${SITE_NAME}` }
  }

  return {
    title: `${post.title} | ${SITE_NAME}`,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      type: 'article',
      url: `${SITE_URL}/blog/${post.slug}`,
      images: post.featured_image ? [{ url: post.featured_image }] : undefined,
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="bg-white py-8">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-brand-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Header */}
        <header className="mt-6">
          <h1 className="font-heading text-3xl font-bold text-brand-text sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-brand-text-muted">
            <span>By {post.author}</span>
            {publishedDate && (
              <>
                <span>•</span>
                <time>{publishedDate}</time>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <div
          className="prose prose-sm mt-8 max-w-none text-brand-text-muted prose-headings:font-heading prose-headings:text-brand-text prose-a:text-brand-primary"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <div className="mt-12 rounded-xl bg-brand-bg p-8 text-center">
          <h3 className="font-heading text-xl font-semibold text-brand-text">
            Ready to order your custom stickers?
          </h3>
          <p className="mt-2 text-brand-text-muted">
            Get an instant quote or design online today.
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link
              href="/order-now"
              className="rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-dark"
            >
              Order Now
            </Link>
            <Link
              href="/templates"
              className="rounded-lg border border-brand-primary px-6 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-primary/5"
            >
              Design Online
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
