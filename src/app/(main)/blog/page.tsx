import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { BlogCard } from '@/components/blog/BlogCard'
import type { BlogPost } from '@/types'

export const metadata: Metadata = {
  // BUG-023 FIX: Use just 'Blog' — the root layout template appends '| SpeedyPrint'.
  // Previously 'Blog | SpeedyPrint' + template '...| SpeedyPrint' = 'Blog | SpeedyPrint | SpeedyPrint'.
  title: 'Blog',
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
    <div className="bg-brand-bg min-h-screen">
      {/* Page header */}
      <div className="bg-brand-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-white">Blog</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            Tips, guides, and insights about custom stickers, labels, and printing.
          </p>
        </div>
      </div>

      {/* Posts grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="rounded-md border border-gray-100 bg-white p-16 text-center">
              <div className="mx-auto mb-4 h-1 w-8 bg-brand-primary" />
              <p className="text-brand-text-muted">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
