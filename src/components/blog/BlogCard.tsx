import Link from 'next/link'
import Image from 'next/image'
import type { BlogPost } from '@/types'
import { ChevronRight } from 'lucide-react'

interface BlogCardProps {
  post: BlogPost
}

export function BlogCard({ post }: BlogCardProps) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden bg-white transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-gray-100">
        {post.featured_image ? (
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50">
            <svg width="40" height="40" viewBox="0 0 56 56" fill="none" className="opacity-10" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="10" width="40" height="5" rx="2.5" fill="currentColor" />
              <rect x="8" y="20" width="32" height="4" rx="2" fill="currentColor" />
              <rect x="8" y="29" width="36" height="4" rx="2" fill="currentColor" />
              <circle cx="44" cy="40" r="8" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col py-6">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
          <span className="text-brand-primary">Technical</span>
          <span className="h-1 w-1 rounded-full bg-gray-200" />
          <span>{date || 'Insights'}</span>
        </div>

        <h3 className="mt-4 line-clamp-2 font-heading text-xl font-bold leading-tight text-brand-secondary transition-colors group-hover:text-brand-primary">
          {post.title}
        </h3>
        
        {post.excerpt && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-500">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto pt-6 flex items-center justify-between">
          <span className="text-xs font-bold text-brand-secondary flex items-center gap-1 group-hover:gap-2 transition-all">
            Read More
            <ChevronRight className="h-3 w-3 text-brand-primary" />
          </span>
          
          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-brand-secondary">
            SP
          </div>
        </div>
      </div>
    </Link>
  )
}

