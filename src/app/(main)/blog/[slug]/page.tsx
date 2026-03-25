import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
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

  if (!post) return { title: `Post Not Found | ${SITE_NAME}` }

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
    <div className="bg-brand-bg min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-brand-text-muted hover:text-brand-primary transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="rounded-md border border-gray-100 bg-white p-8 mb-6">
          <div className="h-1 w-8 bg-brand-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-brand-text sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-3 text-sm text-brand-text-muted">
            <span>By {post.author}</span>
            {publishedDate && (
              <>
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                <time>{publishedDate}</time>
              </>
            )}
          </div>
        </div>

        {/* Featured image */}
        {post.featured_image && (
          <div className="mb-6 overflow-hidden rounded-md border border-gray-100">
            <img src={post.featured_image} alt={post.title} className="w-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="rounded-md border border-gray-100 bg-white p-8">
          <div
            className="prose prose-sm max-w-none text-brand-text-muted prose-headings:font-heading prose-headings:text-brand-text prose-a:text-brand-primary prose-strong:text-brand-text"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* CTA */}
        <div className="mt-6 rounded-md border-t-4 border-brand-primary bg-brand-secondary p-8 text-center">
          <h3 className="font-heading text-xl font-semibold text-white">
            Ready to order your custom stickers?
          </h3>
          <p className="mt-2 text-sm text-white/60">
            Get an instant quote or design online today.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/order-now"
              className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
            >
              Order now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white"
            >
              Design online
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
