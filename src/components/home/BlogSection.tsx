import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { BlogCard } from '@/components/blog/BlogCard'
import type { BlogPost } from '@/types'

interface BlogSectionProps {
  posts: BlogPost[]
}

export function BlogSection({ posts }: BlogSectionProps) {
  if (!posts || posts.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-brand-bg py-24 lg:py-32">
      {/* Decorative background elements */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-20 pointer-events-none">
        <div className="h-[400px] w-[800px] rounded-full bg-gradient-to-r from-brand-primary/30 to-brand-secondary/30" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3 py-1.5 mb-4">
              <BookOpen className="h-4 w-4 text-brand-primary" />
              <span className="text-[10px] font-bold tracking-widest text-brand-primary uppercase">
                Insights & Guides
              </span>
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-text sm:text-4xl lg:text-5xl">
              From Our Workshop <br className="hidden sm:block" />
              <span className="text-brand-primary">& Studio</span>
            </h2>
            <p className="mt-4 text-lg text-brand-text-muted">
              Expert tips on custom stickers, race numbering, trophy design, and making your brand stand out.
            </p>
          </div>

          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm font-bold text-brand-primary transition-colors hover:text-brand-primary-dark"
          >
            View All Articles
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, idx) => (
            <div 
              key={post.id} 
              className="opacity-0 animate-fade-in-up h-full" 
              style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'forwards' }}
            >
              <BlogCard post={post} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
