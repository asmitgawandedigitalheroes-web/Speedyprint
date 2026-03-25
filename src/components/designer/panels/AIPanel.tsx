'use client'

import { useState } from 'react'
import { Sparkles, Wand2, Download, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIGeneration {
  id: string
  prompt: string
  type: 'logo' | 'pattern' | 'text' | 'background'
  result?: string
  isGenerating?: boolean
  error?: string
}

const AI_TYPES = [
  { id: 'logo', name: 'Logo Design', description: 'Generate professional logos' },
  { id: 'pattern', name: 'Pattern', description: 'Create seamless patterns' },
  { id: 'text', name: 'Text Effect', description: 'Apply AI text effects' },
  { id: 'background', name: 'Background', description: 'Generate backgrounds' },
]

const PROMPT_SUGGESTIONS = [
  'Modern minimalist logo for coffee shop',
  'Floral pattern for product packaging',
  'Bold typography for event banner',
  'Gradient background for tech company',
  'Vintage style badge for craft beer',
  'Geometric pattern for stickers',
]

export function AIPanel() {
  const [selectedType, setSelectedType] = useState<'logo' | 'pattern' | 'text' | 'background'>('logo')
  const [prompt, setPrompt] = useState('')
  const [generations, setGenerations] = useState<AIGeneration[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    const newGeneration: AIGeneration = {
      id: Date.now().toString(),
      prompt: prompt.trim(),
      type: selectedType,
      isGenerating: true,
    }

    setGenerations(prev => [newGeneration, ...prev])
    setIsGenerating(true)

    // Simulate AI generation
    setTimeout(() => {
      setGenerations(prev => 
        prev.map(gen => 
          gen.id === newGeneration.id 
            ? { 
                ...gen, 
                isGenerating: false,
                result: '/images/products/custom-labels.png' // Mock result
              }
            : gen
        )
      )
      setIsGenerating(false)
    }, 3000)
  }

  const handleUseResult = (generation: AIGeneration) => {
    // TODO: Add the generated result to canvas
    console.log('Using AI generation:', generation)
  }

  const handleRegenerate = (generation: AIGeneration) => {
    // TODO: Regenerate the same prompt
    console.log('Regenerating:', generation)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-brand-accent" />
          <h3 className="font-semibold text-brand-text">AI Creation</h3>
        </div>

        {/* Type Selection */}
        <div className="mb-3">
          <label className="text-xs font-medium text-brand-text-muted mb-2 block">What would you like to create?</label>
          <div className="grid grid-cols-2 gap-2">
            {AI_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id as any)}
                className={cn(
                  "p-2 rounded-lg border text-left transition-colors",
                  selectedType === type.id
                    ? "border-brand-primary bg-brand-primary/10"
                    : "border-brand-border hover:border-brand-primary/50"
                )}
              >
                <div className="font-medium text-sm text-brand-text">{type.name}</div>
                <div className="text-xs text-brand-text-muted">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="text-xs font-medium text-brand-text-muted mb-1 block">Describe what you want</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Modern minimalist logo with blue colors for a tech startup..."
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>

        {/* Prompt Suggestions */}
        <div className="mt-2">
          <p className="text-xs text-brand-text-muted mb-1">Try these:</p>
          <div className="flex flex-wrap gap-1">
            {PROMPT_SUGGESTIONS.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setPrompt(suggestion)}
                className="px-2 py-1 text-xs bg-brand-bg text-brand-text-muted rounded-full hover:bg-brand-border transition-colors"
              >
                {suggestion.length > 30 ? suggestion.substring(0, 30) + '...' : suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className={cn(
            "w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
            isGenerating || !prompt.trim()
              ? "bg-brand-border text-brand-text-muted cursor-not-allowed"
              : "bg-brand-primary text-white hover:bg-brand-primary/90"
          )}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate
            </>
          )}
        </button>
      </div>

      {/* Generations History */}
      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="text-sm font-medium text-brand-text mb-3">Recent Generations</h4>
        
        {generations.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-brand-text-muted mx-auto mb-3" />
            <p className="text-sm text-brand-text-muted">No generations yet</p>
            <p className="text-xs text-brand-text-muted mt-1">Start by describing what you want to create</p>
          </div>
        ) : (
          <div className="space-y-3">
            {generations.map(generation => (
              <div key={generation.id} className="border border-brand-border rounded-lg p-3">
                {/* Prompt */}
                <div className="mb-2">
                  <p className="text-sm text-brand-text font-medium truncate">{generation.prompt}</p>
                  <p className="text-xs text-brand-text-muted capitalize">{generation.type}</p>
                </div>

                {/* Result */}
                {generation.isGenerating ? (
                  <div className="aspect-square bg-brand-bg rounded-lg flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-brand-primary animate-spin" />
                  </div>
                ) : generation.error ? (
                  <div className="aspect-square bg-brand-bg rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                      <p className="text-xs text-brand-text-muted">Generation failed</p>
                    </div>
                  </div>
                ) : generation.result ? (
                  <div className="aspect-square bg-brand-bg rounded-lg overflow-hidden mb-2">
                    <img
                      src={generation.result}
                      alt={generation.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}

                {/* Actions */}
                {generation.result && !generation.isGenerating && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUseResult(generation)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-brand-primary text-white text-sm rounded hover:bg-brand-primary/90 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      Use
                    </button>
                    <button
                      onClick={() => handleRegenerate(generation)}
                      className="px-3 py-1.5 border border-brand-border text-brand-text text-sm rounded hover:bg-brand-bg transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
