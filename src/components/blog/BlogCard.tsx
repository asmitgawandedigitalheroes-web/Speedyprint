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
      className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
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
        <div className="flex aspect-[16/9] items-center justify-center bg-brand-secondary/10">
          <span className="text-4xl">📝</span>
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {date && (
          <p className="text-xs text-brand-text-muted">{date}</p>
        )}
        <h3 className="mt-1 font-heading text-lg font-semibold text-brand-text group-hover:text-brand-primary">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-brand-text-muted">
            {post.excerpt}
          </p>
        )}
        <p className="mt-3 text-sm font-medium text-brand-primary">
          Read More →
        </p>
      </div>
    </Link>
  )
}
