import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  User, 
  Clock, 
  Share2, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Bookmark,
  ChevronRight,
  UserCheck
} from 'lucide-react'
import { unstable_cache } from 'next/cache'
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants'
import { sanitizeHtml } from '@/lib/utils/sanitize'
import { createAdminClient } from '@/lib/supabase/admin'
import { BlogCard } from '@/components/blog/BlogCard'
import type { BlogPost } from '@/types'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
}

const getPost = unstable_cache(
  async (slug: string): Promise<BlogPost | null> => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()
    return data as BlogPost | null
  },
  ['blog-post'],
  { revalidate: 3600, tags: ['blog'] }
)

const getRelatedPosts = unstable_cache(
  async (excludeId: string): Promise<BlogPost[]> => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .neq('id', excludeId)
      .limit(3)
      .order('published_at', { ascending: false })
    return (data as BlogPost[]) || []
  },
  ['blog-related'],
  { revalidate: 3600, tags: ['blog'] }
)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.title,
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

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  if (!slug) notFound()
  const post = await getPost(slug)

  if (!post) notFound()

  const relatedPosts = await getRelatedPosts(post.id)

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="bg-white min-h-screen Selection:bg-brand-primary/10">
      {/* Top Professional Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <Link
            href="/blog"
            className="group flex items-center gap-2 text-sm font-semibold text-brand-secondary transition hover:text-brand-primary"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Insights
          </Link>
          <div className="flex items-center gap-4">
             <button className="text-gray-400 hover:text-brand-secondary transition"><Bookmark className="h-5 w-5" /></button>
             <button className="text-gray-400 hover:text-brand-secondary transition"><Share2 className="h-5 w-5" /></button>
          </div>
        </div>
      </nav>

      <article className="animate-slide-up">
        {/* Editorial Header */}
        <header className="mx-auto max-w-3xl px-4 pt-16 pb-12 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-brand-primary">
              <span className="h-px w-8 bg-brand-primary/30" />
              Technical Guide
              <span className="h-px w-8 bg-brand-primary/30" />
            </div>
            
            <h1 className="font-heading text-4xl font-black tracking-tight text-brand-secondary sm:text-6xl leading-[1.1]">
              {post.title}
            </h1>
            
            <div className="flex items-center justify-center gap-4 py-6 border-y border-gray-50 w-full max-w-sm mt-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-brand-secondary/5 border border-brand-secondary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-brand-secondary/40" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-brand-secondary">{post.author}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{publishedDate}</p>
                </div>
              </div>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                <span>6 min read</span>
              </div>
            </div>
          </div>
        </header>

        {/* Professional Leading Image */}
        <div className="mx-auto max-w-5xl px-4 pb-16">
          <div className="relative aspect-[21/9] overflow-hidden rounded-[2.5rem] shadow-2xl shadow-brand-secondary/10 border border-gray-100">
            {post.featured_image ? (
              <Image 
                src={post.featured_image} 
                alt={post.title} 
                fill 
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full w-full bg-brand-secondary/5" />
            )}
          </div>
        </div>

        {/* Content Flow */}
        <div className="mx-auto max-w-3xl px-4 pb-20">
          <div
            className="prose-editorial prose-a:text-brand-primary prose-a:font-bold prose-img:rounded-3xl prose-img:border prose-img:border-gray-100"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
          />

          {/* Professional Author Footer */}
          <div className="mt-20 rounded-3xl bg-gray-50 border border-gray-100 p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8">
            <div className="h-24 w-24 rounded-2xl bg-brand-secondary flex items-center justify-center text-3xl font-black text-white shadow-xl rotate-3">
              SP
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <h4 className="font-heading text-xl font-bold text-brand-secondary">About {post.author}</h4>
                <UserCheck className="h-4 w-4 text-brand-primary" />
              </div>
              <p className="text-sm leading-relaxed text-gray-500 mb-6">
                Expert in custom print solutions and high-quality fabrication. Sharing knowledge on how to achieve 
                the best results for your brand and business.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <button className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand-primary transition-all"><Twitter className="h-4 w-4" /></button>
                <button className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand-primary transition-all"><Linkedin className="h-4 w-4" /></button>
                <button className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand-primary transition-all"><Facebook className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Corporate Grade Newsletter CTA */}
      <section className="bg-brand-secondary py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
          <h2 className="font-heading text-4xl font-black text-white mb-6">Master Your Brand Strategy</h2>
          <p className="text-white/60 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
            Get professional printing tips, branding insights, and exclusive industry updates 
            straight to your inbox every fortnight.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto bg-white/5 p-2 rounded-2xl border border-white/10">
            <input 
              type="email" 
              placeholder="work@company.com" 
              className="flex-1 rounded-xl px-6 py-4 bg-white text-brand-secondary placeholder-gray-400 focus:outline-none transition-all"
            />
            <button className="bg-brand-primary hover:bg-brand-primary-dark text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-brand-primary/20 transition-all active:scale-95 whitespace-nowrap">
              Join Insights
            </button>
          </form>
          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => <div key={i} className="h-8 w-8 rounded-full border-2 border-brand-secondary bg-gray-700" />)}
            </div>
            <p className="text-xs font-bold text-white/40 tracking-widest uppercase">Joined by 12k designers</p>
          </div>
        </div>
      </section>

      {/* Elegant Related Content */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="font-heading text-3xl font-black text-brand-secondary">Further Reading</h2>
            <div className="h-1 w-12 bg-brand-primary mt-2" />
          </div>
          <Link href="/blog" className="hidden sm:flex items-center gap-2 text-sm font-bold text-brand-primary group">
            Explore All <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {relatedPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  )
}
