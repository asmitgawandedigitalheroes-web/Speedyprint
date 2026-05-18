import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { BlogCard } from '@/components/blog/BlogCard'
import { ArrowRight, Filter, Sparkles, Newspaper, PenTool, Lightbulb, Zap, ChevronRight } from 'lucide-react'
import type { BlogPost } from '@/types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Insights & Resources | SpeedyPrint',
  description: 'Professional guides, industry trends, and technical printing advice from the experts at SpeedyPrint South Africa.',
}

const getBlogPosts = unstable_cache(
  async (): Promise<BlogPost[]> => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
    return (data as BlogPost[]) || []
  },
  ['blog-posts-all'],
  { revalidate: 3600, tags: ['blog'] }
)

const CATEGORIES = [
  { label: 'All Insights', icon: Newspaper, active: true },
  { label: 'Technical Guides', icon: Sparkles },
  { label: 'Design Strategy', icon: PenTool },
  { label: 'Market Trends', icon: Lightbulb },
]

export default async function BlogPage() {
  const posts = await getBlogPosts()
  const featuredPost = posts[0]
  const remainingPosts = posts.slice(1)

  return (
    <div className="bg-white min-h-screen">
      {/* Minimalist Professional Hero */}
      <section className="relative px-4 pt-20 pb-16 text-center sm:px-6 lg:px-8 border-b border-gray-50">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-brand-primary animate-slide-up">
            <span className="h-px w-6 bg-brand-primary" />
            SpeedyPrint Journal
            <span className="h-px w-6 bg-brand-primary" />
          </div>
          <h1 className="font-heading text-5xl font-black tracking-tight text-brand-secondary sm:text-7xl animate-slide-up delay-100 italic">
            Thinking in <span className="bg-brand-primary text-white px-4 not-italic rotate-[-2deg] inline-block shadow-lg">Print</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-500 animate-slide-up delay-200">
            A curated source of technical printing knowledge, branding strategy, and local 
            craftsmanship insights for businesses across South Africa.
          </p>
        </div>
      </section>

      {/* Integrated Navigation & Filter */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between h-16">
          <div className="flex gap-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                className={`text-sm font-bold transition-all relative py-2 ${
                  cat.active 
                    ? 'text-brand-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-brand-primary' 
                    : 'text-gray-400 hover:text-brand-secondary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-brand-secondary transition">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <div className="py-24 text-center">
            <Newspaper className="mx-auto h-12 w-12 text-gray-100 mb-6" />
            <h2 className="text-2xl font-bold text-brand-secondary">No stories found</h2>
            <p className="text-gray-400 mt-2">Our editors are preparing new insights. Join the newsletter below to stay updated.</p>
          </div>
        ) : (
          <div className="space-y-24">
            {/* Split Editorial Featured Post */}
            {featuredPost && (
              <section className="animate-slide-up delay-300">
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="group flex flex-col lg:flex-row items-center gap-12"
                >
                  <div className="relative aspect-[4/3] w-full lg:w-3/5 overflow-hidden rounded-[40px] shadow-2xl shadow-brand-secondary/10">
                    {featuredPost.featured_image ? (
                      <Image
                        src={featuredPost.featured_image}
                        alt={featuredPost.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-100" />
                    )}
                    <div className="absolute top-8 left-8">
                      <span className="bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">Featured</span>
                    </div>
                  </div>
                  
                  <div className="w-full lg:w-2/5 space-y-6">
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                      <time>{featuredPost.published_at ? new Date(featuredPost.published_at).toLocaleDateString() : 'Published'}</time>
                      <span className="h-1 w-1 rounded-full bg-gray-300" />
                      <span>8 min read</span>
                    </div>
                    <h2 className="font-heading text-4xl font-black leading-[1.1] text-brand-secondary group-hover:text-brand-primary transition-colors sm:text-5xl">
                      {featuredPost.title}
                    </h2>
                    <p className="text-lg leading-relaxed text-gray-500 line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                    <div className="pt-6">
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-secondary group-hover:gap-4 transition-all uppercase tracking-widest border-b-2 border-brand-primary/20 pb-1">
                        Full Article <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* Structured Card Grid */}
            <section className="pb-24">
              <div className="flex items-center justify-between mb-12">
                <h3 className="font-heading text-3xl font-black text-brand-secondary">Latest Insights</h3>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                  Showing {remainingPosts.length} posts
                </div>
              </div>
              <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
                {remainingPosts.map((post, i) => (
                  <div key={post.id} className="animate-slide-up" style={{ animationDelay: `${400 + (i * 100)}ms` }}>
                    <BlogCard post={post} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Professional Minimalist Newsletter */}
      <section className="bg-slate-50 py-24 border-t border-gray-100">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white shadow-xl mb-8">
            <PenTool className="h-6 w-6 text-brand-primary" />
          </div>
          <h2 className="font-heading text-4xl font-black text-brand-secondary mb-6">Stay Ahead of the Curve</h2>
          <p className="text-gray-500 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
            Get technical print guides, design inspiration, and branding strategies 
            delivered to your inbox once a fortnight.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto bg-white p-2 rounded-2xl border border-gray-200">
            <input 
              type="email" 
              placeholder="work@company.com" 
              className="flex-1 rounded-xl px-6 py-4 bg-transparent text-brand-secondary focus:outline-none"
            />
            <button className="bg-brand-secondary hover:bg-brand-secondary-dark text-white font-bold px-8 py-4 rounded-xl transition-all shadow-xl shadow-brand-secondary/20">
              Join Insights
            </button>
          </form>
          <p className="text-[10px] text-gray-400 mt-6 uppercase tracking-widest font-bold">Trusted by over 4,500 branding professionals</p>
        </div>
      </section>
    </div>
  )
}

