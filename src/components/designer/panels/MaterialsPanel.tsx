'use client'

import { useState } from 'react'
import { Search, Palette, Download, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Material {
  id: string
  name: string
  category: string
  type: 'texture' | 'pattern' | 'background' | 'color'
  thumbnail?: string
  color?: string
  isPro?: boolean
}

const MOCK_MATERIALS: Material[] = [
  { id: '1', name: 'Wood Grain', category: 'Textures', type: 'texture', thumbnail: '/images/products/wooden-plaques.png' },
  { id: '2', name: 'Carbon Fiber', category: 'Textures', type: 'texture', thumbnail: '/images/products/custom-labels.png' },
  { id: '3', name: 'Dots Pattern', category: 'Patterns', type: 'pattern', thumbnail: '/images/products/custom-labels.png' },
  { id: '4', name: 'Stripes', category: 'Patterns', type: 'pattern', thumbnail: '/images/products/custom-labels.png' },
  { id: '5', name: 'Gradient Blue', category: 'Backgrounds', type: 'background', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: '6', name: 'Solid Orange', category: 'Colors', type: 'color', color: '#FF5C00' },
  { id: '7', name: 'Metallic Gold', category: 'Colors', type: 'color', color: '#FFD700' },
  { id: '8', name: 'Matte Black', category: 'Colors', type: 'color', color: '#1E293B' },
]

const CATEGORIES = ['All', 'Textures', 'Patterns', 'Backgrounds', 'Colors']
const TYPES = ['All', 'texture', 'pattern', 'background', 'color']

export function MaterialsPanel() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedType, setSelectedType] = useState('All')

  const filteredMaterials = MOCK_MATERIALS.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || material.category === selectedCategory
    const matchesType = selectedType === 'All' || material.type === selectedType
    return matchesSearch && matchesCategory && matchesType
  })

  const renderMaterialPreview = (material: Material) => {
    if (material.color) {
      return (
        <div 
          className="w-full h-full rounded"
          style={{ background: material.color }}
        />
      )
    }
    
    if (material.thumbnail) {
      return (
        <img
          src={material.thumbnail}
          alt={material.name}
          className="w-full h-full object-cover rounded"
        />
      )
    }
    
    return (
      <div className="w-full h-full bg-brand-bg rounded flex items-center justify-center">
        <Palette className="h-8 w-8 text-brand-text-muted" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-brand-text mb-3">Materials</h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-text-muted" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>

        {/* Categories */}
        <div className="mb-3">
          <label className="text-xs font-medium text-brand-text-muted mb-1 block">Category</label>
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-2 py-1 text-xs rounded-full transition-colors",
                  selectedCategory === category
                    ? "bg-brand-primary text-white"
                    : "bg-brand-bg text-brand-text-muted hover:bg-brand-border"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Types */}
        <div>
          <label className="text-xs font-medium text-brand-text-muted mb-1 block">Type</label>
          <div className="flex flex-wrap gap-1">
            {TYPES.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "px-2 py-1 text-xs rounded-full transition-colors",
                  selectedType === type
                    ? "bg-brand-primary text-white"
                    : "bg-brand-bg text-brand-text-muted hover:bg-brand-border"
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredMaterials.map(material => (
            <div
              key={material.id}
              className="group cursor-pointer rounded-lg border border-brand-border overflow-hidden hover:border-brand-primary transition-colors"
            >
              {/* Preview */}
              <div className="aspect-square bg-brand-bg p-2">
                {renderMaterialPreview(material)}
              </div>
              
              {/* Info */}
              <div className="p-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-brand-text truncate">{material.name}</h4>
                    <p className="text-xs text-brand-text-muted">{material.category}</p>
                  </div>
                  {material.isPro && (
                    <div className="px-1 py-0.5 bg-brand-accent text-white text-xs rounded">
                      PRO
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-1 mt-2">
                  <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-brand-primary text-white rounded hover:bg-brand-primary/90 transition-colors">
                    <Plus className="h-3 w-3" />
                    Use
                  </button>
                  <button className="p-1 text-brand-text-muted hover:text-brand-text transition-colors">
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
