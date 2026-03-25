'use client'

import { useState } from 'react'
import { Search, Star, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Template {
  id: string
  name: string
  category: string
  thumbnail: string
  isPro?: boolean
  rating?: number
  uses?: number
}

const MOCK_TEMPLATES: Template[] = [
  { id: '1', name: 'Product Label', category: 'Labels', thumbnail: '/images/products/custom-labels.png', rating: 4.8, uses: 1250 },
  { id: '2', name: 'Coffee Cup Sleeve', category: 'Sleeves', thumbnail: '/images/products/coffee-cup-sleeves.png', rating: 4.6, uses: 890 },
  { id: '3', name: 'Race Bib', category: 'Events', thumbnail: '/images/products/race-bibs.png', rating: 4.9, uses: 2100 },
  { id: '4', name: 'Business Card', category: 'Cards', thumbnail: '/images/products/custom-labels.png', rating: 4.7, uses: 3400 },
  { id: '5', name: 'Sticker Sheet', category: 'Stickers', thumbnail: '/images/products/vinyl-stickers.png', rating: 4.5, uses: 1560 },
  { id: '6', name: 'Award Trophy', category: 'Awards', thumbnail: '/images/products/award-trophies.png', rating: 4.8, uses: 670 },
]

const CATEGORIES = ['All', 'Labels', 'Stickers', 'Events', 'Cards', 'Awards', 'Sleeves']

export function TemplatesPanel() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating'>('popular')

  const filteredTemplates = MOCK_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.uses || 0) - (a.uses || 0)
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'newest':
        return b.id.localeCompare(a.id)
      default:
        return 0
    }
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-brand-text mb-3">Templates</h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-text-muted" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1 mb-3">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-3 py-1 text-xs rounded-full transition-colors",
                selectedCategory === category
                  ? "bg-brand-primary text-white"
                  : "bg-brand-bg text-brand-text-muted hover:bg-brand-border"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('popular')}
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors",
              sortBy === 'popular' ? "bg-brand-bg text-brand-text" : "text-brand-text-muted"
            )}
          >
            <TrendingUp className="h-3 w-3" />
            Popular
          </button>
          <button
            onClick={() => setSortBy('rating')}
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors",
              sortBy === 'rating' ? "bg-brand-bg text-brand-text" : "text-brand-text-muted"
            )}
          >
            <Star className="h-3 w-3" />
            Rating
          </button>
          <button
            onClick={() => setSortBy('newest')}
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors",
              sortBy === 'newest' ? "bg-brand-bg text-brand-text" : "text-brand-text-muted"
            )}
          >
            <Clock className="h-3 w-3" />
            Newest
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {sortedTemplates.map(template => (
            <div
              key={template.id}
              className="group cursor-pointer rounded-lg border border-brand-border overflow-hidden hover:border-brand-primary transition-colors"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-brand-bg overflow-hidden">
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              
              {/* Info */}
              <div className="p-2">
                <h4 className="text-sm font-medium text-brand-text truncate">{template.name}</h4>
                <p className="text-xs text-brand-text-muted">{template.category}</p>
                
                {/* Stats */}
                <div className="flex items-center justify-between mt-1">
                  {template.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-brand-text-muted">{template.rating}</span>
                    </div>
                  )}
                  {template.uses && (
                    <span className="text-xs text-brand-text-muted">{template.uses} uses</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
