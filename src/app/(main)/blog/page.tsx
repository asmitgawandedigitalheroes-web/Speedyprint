import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/utils/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import { BlogCard } from '@/components/blog/BlogCard'
import type { BlogPost } from '@/types'

export const metadata: Metadata = {
  title: `Blog | ${SITE_NAME}`,
  description: 'Tips, guides, and insights about custom stickers, labels, and printing from the SpeedyPrint team.',
}

export const dynamic = 'force-dynamic'

async function getBlogPosts(): Promise<BlogPost[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })
  return (data as BlogPost[]) || []
}

export default async function BlogPage() {
  const posts = await getBlogPosts()

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-brand-secondary py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold">Blog</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Tips, guides, and insights about custom stickers, labels, and
            printing.
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <p className="text-center text-brand-text-muted">
              No blog posts yet. Check back soon!
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
