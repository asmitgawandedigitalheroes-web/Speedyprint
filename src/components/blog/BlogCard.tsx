import Link from 'next/link'
import Image from 'next/image'
import type { BlogPost } from '@/types'

interface BlogCardProps {
  post: BlogPost
}

export function BlogCard({ post }: BlogCardProps) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Image */}
      {post.featured_image ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ) : (
        // TODO: Replace with real blog article cover images before launch
        <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-[#1E293B] to-[#2d3f55]">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="8" y="10" width="40" height="5" rx="2.5" fill="white" fillOpacity="0.18" />
            <rect x="8" y="20" width="32" height="4" rx="2" fill="white" fillOpacity="0.12" />
            <rect x="8" y="29" width="36" height="4" rx="2" fill="white" fillOpacity="0.12" />
            <rect x="8" y="38" width="24" height="4" rx="2" fill="white" fillOpacity="0.12" />
            <circle cx="44" cy="40" r="8" fill="#E30613" fillOpacity="0.85" />
            <path d="M44 36v8M40 40h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {date && (
          <p className="text-xs text-brand-text-muted">{date}</p>
        )}
        <h3 className="mt-1 line-clamp-2 font-heading text-lg font-semibold text-brand-text group-hover:text-brand-primary">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-brand-text-muted">
            {post.excerpt}
          </p>
        )}
        <p className="mt-auto pt-4 text-sm font-medium text-brand-primary">
          Read More →
        </p>
      </div>
    </Link>
  )
}
