'use client'

import { useState } from 'react'
import { Sparkles, Wand2, Image as ImageIcon, Palette } from 'lucide-react'

export default function AICreationPanel() {
  const [prompt, setPrompt] = useState('')

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2">
        <h2 className="text-sm font-semibold text-ed-text mb-1">AI Creation</h2>
        <p className="text-xs text-ed-text-dim mb-3">Generate designs with AI assistance</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 editor-scrollbar">
        {/* AI prompt input */}
        <div className="mb-5">
          <label className="text-xs font-medium text-ed-text-muted mb-1.5 block">Describe your design</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A modern product label with clean typography..."
            rows={3}
            className="w-full px-3 py-2 border border-ed-border rounded-lg text-sm resize-none focus:outline-none editor-input"
          />
          <button
            disabled
            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
          >
            <Sparkles size={16} />
            Generate (Coming Soon)
          </button>
        </div>

        {/* AI features preview */}
        <p className="text-xs font-semibold text-ed-text-dim uppercase tracking-wide mb-3">AI Features</p>

        <div className="space-y-2">
          <div className="bg-ed-bg border border-ed-border rounded-lg p-3 opacity-60">
            <div className="flex items-center gap-2 mb-1">
              <Wand2 size={16} className="text-purple-500" />
              <span className="text-sm font-medium text-ed-text-muted">Auto Layout</span>
            </div>
            <p className="text-[10px] text-ed-text-dim">Automatically arrange elements on your canvas</p>
            <span className="inline-block mt-1.5 text-[9px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">Coming Soon</span>
          </div>

          <div className="bg-ed-bg border border-ed-border rounded-lg p-3 opacity-60">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-ed-text-muted">AI Image Gen</span>
            </div>
            <p className="text-[10px] text-ed-text-dim">Generate custom images from text descriptions</p>
            <span className="inline-block mt-1.5 text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">Coming Soon</span>
          </div>

          <div className="bg-ed-bg border border-ed-border rounded-lg p-3 opacity-60">
            <div className="flex items-center gap-2 mb-1">
              <Palette size={16} className="text-pink-500" />
              <span className="text-sm font-medium text-ed-text-muted">Color Palette</span>
            </div>
            <p className="text-[10px] text-ed-text-dim">AI-suggested color combinations for your brand</p>
            <span className="inline-block mt-1.5 text-[9px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-medium">Coming Soon</span>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-5 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
          <p className="text-xs text-purple-700 font-medium mb-0.5">AI-Powered Design</p>
          <p className="text-[10px] text-purple-500">
            AI creation features are being developed. Stay tuned for automatic design generation,
            smart layouts, and AI-powered image creation.
          </p>
        </div>
      </div>
    </div>
  )
}
