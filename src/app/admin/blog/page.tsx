'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText } from 'lucide-react'
import { toast } from 'sonner'
import {
  PageHeader, SectionCard, EmptyState, StatusBadge, SkeletonRows, ActionBtn,
} from '@/components/admin/AdminUI'
import type { BlogPost } from '@/types'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminBlogPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => { fetchPosts() }, [])

  async function fetchPosts() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/blog')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch {
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post? This cannot be undone.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setPosts((prev) => prev.filter((p) => p.id !== id))
      toast.success('Post deleted')
    } catch {
      toast.error('Failed to delete post')
    } finally {
      setDeleting(null)
    }
  }

  const handleTogglePublish = async (post: BlogPost) => {
    setToggling(post.id)
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !post.published }),
      })
      if (!res.ok) throw new Error()
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, published: !p.published } : p))
      toast.success(post.published ? 'Post unpublished' : 'Post published')
    } catch {
      toast.error('Failed to update post')
    } finally {
      setToggling(null)
    }
  }

  const published = posts.filter(p => p.published).length
  const drafts = posts.filter(p => !p.published).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Posts"
        description="Manage articles and content for your website"
        actions={
          <div className="flex items-center gap-2">
            {!loading && posts.length > 0 && (
              <>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">{published} published</span>
                {drafts > 0 && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{drafts} draft{drafts > 1 ? 's' : ''}</span>}
              </>
            )}
            <Link
              href="/admin/blog/new"
              className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-primary-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Post
            </Link>
          </div>
        }
      />

      <SectionCard noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Title</th>
                <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">Author</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">Date</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={5} cols={5} />
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={FileText}
                      title="No blog posts yet"
                      description="Create your first post to start engaging your audience"
                      action={
                        <Link href="/admin/blog/new" className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-dark transition-colors shadow-sm">
                          <Plus className="h-4 w-4" /> Create Post
                        </Link>
                      }
                    />
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800 truncate max-w-[260px]">{post.title}</p>
                      <p className="text-[11px] text-gray-400 font-mono">/{post.slug}</p>
                    </td>
                    <td className="hidden px-5 py-3.5 text-xs text-gray-500 md:table-cell">
                      {post.author || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge
                        label={post.published ? 'Published' : 'Draft'}
                        color={post.published ? 'green' : 'yellow'}
                      />
                    </td>
                    <td className="hidden px-5 py-3.5 text-xs text-gray-400 sm:table-cell">
                      {formatDate(post.published_at || post.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <ActionBtn
                          onClick={() => handleTogglePublish(post)}
                          icon={post.published ? EyeOff : Eye}
                          label={post.published ? 'Unpublish' : 'Publish'}
                          disabled={toggling === post.id}
                        />
                        <ActionBtn
                          onClick={() => router.push(`/admin/blog/${post.id}/edit`)}
                          icon={Pencil}
                          label="Edit"
                        />
                        <ActionBtn
                          onClick={() => handleDelete(post.id)}
                          icon={Trash2}
                          label="Delete"
                          danger
                          disabled={deleting === post.id}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
