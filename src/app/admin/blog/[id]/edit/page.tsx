'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { ImageUploader } from '@/components/admin/ImageUploader'
import type { BlogPost } from '@/types'

export default function AdminBlogEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [author, setAuthor] = useState('')
  const [published, setPublished] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/admin/blog/${id}`)
        if (!res.ok) throw new Error('Post not found')
        const data = await res.json()
        const p = data.post as BlogPost
        setPost(p)
        setTitle(p.title)
        setSlug(p.slug)
        setExcerpt(p.excerpt || '')
        setContent(p.content || '')
        setFeaturedImage(p.featured_image || '')
        setAuthor(p.author || '')
        setPublished(p.published)
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Failed to load blog post')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [id])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) {
      setError('Title is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt: excerpt || null,
          content: content || null,
          featured_image: featuredImage || null,
          author: author || null,
          published,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update post')
      }

      router.push('/admin/blog')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
        <p className="text-muted-foreground">Blog post not found.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-brand-text">Edit Blog Post</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update &quot;{post.title}&quot;
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>

            {/* Featured Image */}
            <div className="space-y-2">
              <Label>Featured Image</Label>
              <ImageUploader 
                value={featuredImage ? [featuredImage] : []}
                onChange={(urls) => setFeaturedImage(urls[0] || '')}
                maxImages={1}
                bucket="blog"
                folder="featured"
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your blog post content here..."
              />
            </div>

            {/* Published Toggle */}
            <div className="flex items-center gap-3">
              <input
                id="published"
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="published" className="cursor-pointer">
                Published
              </Label>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/blog">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
