'use client'

import React from 'react'
import { Pencil, Circle, Wind, Trash2, X } from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { Button } from '@/components/ui/button'

const RECOMMENDED_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
  '#FFFF00', '#FF00FF', '#00FFFF', '#FF8C00', '#8B4513'
]

export default function DrawPanel() {
  const isDrawingMode = useEditorStore((s) => s.isDrawingMode)
  const setDrawingMode = useEditorStore((s) => s.setDrawingMode)
  const brushColor = useEditorStore((s) => s.brushColor)
  const setBrushColor = useEditorStore((s) => s.setBrushColor)
  const brushWidth = useEditorStore((s) => s.brushWidth)
  const setBrushWidth = useEditorStore((s) => s.setBrushWidth)
  const canvas = useEditorStore((s) => s.canvas)

  const handleBrushTypeChange = (type: 'pencil' | 'circle' | 'spray') => {
    if (!canvas) return
    
    // In Fabric v6, we need to import or access the brushes
    // Since we are in a client component, we can use the fabric object if it's on window or imported
    // For now, let's assume the canvas is already setup with a default brush and we just toggle mode
    // We can refine this in EditorShell if needed
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Draw</h2>
        <p className="text-xs text-ed-text-dim">Sketch freely on your design</p>
      </div>

      {/* Toggle Drawing Mode */}
      <div className="space-y-3">
        <Button 
          variant={isDrawingMode ? "default" : "outline"}
          className="w-full justify-start gap-3 h-12"
          onClick={() => setDrawingMode(!isDrawingMode)}
        >
          <div className={`p-2 rounded-lg ${isDrawingMode ? 'bg-white/20 text-white' : 'bg-ed-accent/10 text-ed-accent'}`}>
            <Pencil size={18} />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-bold leading-none">{isDrawingMode ? 'Drawing Mode: ON' : 'Start Drawing'}</p>
            <p className="text-[10px] opacity-70 leading-none mt-1">
              {isDrawingMode ? 'Canvas is locked for drawing' : 'Click to enable pencil'}
            </p>
          </div>
        </Button>
      </div>

      {isDrawingMode && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Brush Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-ed-text-dim">Brush Size</label>
              <span className="text-[11px] font-mono bg-ed-bg px-1.5 py-0.5 rounded border border-ed-border">{brushWidth}px</span>
            </div>
            <input 
              type="range"
              value={brushWidth} 
              min={1} 
              max={50} 
              step={1} 
              onChange={(e) => setBrushWidth(Number(e.target.value))}
              className="w-full h-1.5 bg-ed-border rounded-lg appearance-none cursor-pointer accent-ed-accent"
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-ed-text-dim">Stroke Color</label>
            <div className="grid grid-cols-5 gap-2">
              {RECOMMENDED_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setBrushColor(color)}
                  className={`w-full aspect-square rounded-full border-2 transition-transform hover:scale-110 ${
                    brushColor === color ? 'border-ed-accent scale-110 shadow-sm' : 'border-ed-border'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="relative group overflow-hidden rounded-full border border-ed-border aspect-square cursor-pointer">
                <input 
                  type="color" 
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-ed-border text-center">
            <p className="text-[10px] text-ed-text-dim mb-4 italic">Disable drawing mode to select and move objects again.</p>
            <Button 
              size="sm" 
              variant="ghost"
              className="w-full text-xs gap-2"
              onClick={() => {
                const { canvas } = useEditorStore.getState()
                if (canvas) {
                  // In a real app we'd clear last stroke or all drawings, but for now just disable
                  setDrawingMode(false)
                }
              }}
            >
              <X size={14} />
              Done Drawing
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
