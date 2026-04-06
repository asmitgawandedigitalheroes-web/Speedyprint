'use client'

import {
  Plus,
  Layers,
  Settings2,
  Maximize2,
  LayoutTemplate,
  Type,
  Gem,
} from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { Button } from '@/components/ui/button'

interface MobileBottomBarProps {
  onOpenPanel: (panel: 'left' | 'right' | 'layers' | 'template' | 'text' | 'material') => void
  isObjectSelected: boolean
}

export function MobileBottomBar({ onOpenPanel, isObjectSelected }: MobileBottomBarProps) {
  const zoomToFit = useEditorStore((s) => s.zoomToFit)
  const leftPanel = useEditorStore((s) => s.leftPanel)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-ed-border shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        <button
          onClick={() => onOpenPanel('template')}
          className={`flex flex-col items-center justify-center flex-1 gap-1 h-full transition-colors ${
            leftPanel && leftPanel !== 'layers' ? 'text-ed-accent' : 'text-ed-text-dim hover:text-ed-text-muted'
          }`}
        >
          <div className={`p-1.5 rounded-full ${leftPanel && leftPanel !== 'layers' ? 'bg-ed-accent/10' : ''}`}>
            <Plus size={22} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Design</span>
        </button>

        <button
          onClick={() => onOpenPanel('layers')}
          className={`flex flex-col items-center justify-center flex-1 gap-1 h-full transition-colors ${
            leftPanel === 'layers' ? 'text-ed-accent' : 'text-ed-text-dim hover:text-ed-text-muted'
          }`}
        >
          <div className={`p-1.5 rounded-full ${leftPanel === 'layers' ? 'bg-ed-accent/10' : ''}`}>
            <Layers size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Layers</span>
        </button>

        <button
          onClick={() => isObjectSelected && onOpenPanel('right')}
          disabled={!isObjectSelected}
          className={`flex flex-col items-center justify-center flex-1 gap-1 h-full transition-colors ${
            !isObjectSelected ? 'opacity-30' : 'text-ed-text-dim hover:text-ed-text-muted'
          }`}
        >
          <div className="p-1.5">
            <Settings2 size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Properties</span>
        </button>
      </div>
    </div>
  )
}
