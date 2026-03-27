'use client'

import { ShoppingCart, Table2, CheckCircle2, Download, FileText } from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { exportPNG } from '@/lib/editor/fabricUtils'

export default function FinishPanel() {
  const { canvas, template, designId, bulkData } = useEditorStore()

  const handleExportPNG = () => {
    if (!canvas) return
    const dataUrl = exportPNG(canvas)
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'design.png'
    a.click()
  }

  const handleGoToBatch = () => {
    if (template) {
      window.open(`/designer/${template.id}/csv${designId ? `?design=${designId}` : ''}`, '_blank')
    }
  }

  return (
    <div className="flex flex-col h-full bg-ed-surface">
      <div className="p-4 border-b border-ed-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ed-text">Complete Design</h2>
          <p className="text-xs text-ed-text-dim mt-1">
            Finalize your design and choose your next step.
          </p>
        </div>
        <button 
          onClick={() => useEditorStore.getState().setLeftPanel('bulk')}
          className="p-2 text-ed-text-dim hover:text-ed-text hover:bg-ed-surface-hover rounded-lg transition-colors"
          title="Back to Bulk"
        >
          <Table2 size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Preview Card */}
        <div className="aspect-[4/3] bg-ed-surface-hover rounded-xl border border-ed-border overflow-hidden relative group">
          {canvas && (
            <img 
              src={canvas.toDataURL({ format: 'png', multiplier: 0.2 })} 
              alt="Design Preview"
              className="w-full h-full object-contain p-4"
            />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              onClick={handleExportPNG}
              className="bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <Download size={14} /> Download Preview
            </button>
          </div>
        </div>

        {/* Primary Action */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-wider font-bold text-ed-text-dim">Standard Order</p>
          <button 
            className="w-full bg-gradient-to-r from-ed-accent to-ed-accent-hover text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-ed-accent/20 hover:shadow-ed-accent/30 active:scale-[0.98] transition-all"
            onClick={() => {
              // Trigger the existing "Add to Cart" logic from Toolbar
              const btn = document.querySelector('[title="Add to Cart"]') as HTMLButtonElement
              if (btn) btn.click()
            }}
          >
            <ShoppingCart size={18} />
            Add to Cart
          </button>
          <p className="text-[10px] text-center text-ed-text-dim px-2">
            Add this single design to your cart for checking out.
          </p>
        </div>

        {/* Secondary Actions */}
        <div className="space-y-3 pt-2">
          <p className="text-[10px] uppercase tracking-wider font-bold text-ed-text-dim">Production Options</p>
          
          <button 
            onClick={handleGoToBatch}
            className="w-full bg-ed-surface-hover border border-ed-border text-ed-text py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-ed-surface-active transition-colors active:scale-[0.98]"
          >
            <Table2 size={16} className="text-ed-text-dim" />
            Batch CSV Production
          </button>
          
          <p className="text-[10px] text-center text-ed-text-dim px-2">
            Generate multiple designs from a CSV for large batch orders.
          </p>
        </div>

        {/* Success Indicator if Bulk Data is present */}
        {bulkData && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-600">Bulk Ready</p>
              <p className="text-[10px] text-emerald-600/80 leading-relaxed mt-0.5">
                You have {bulkData.rows.length} rows of data mapped. You can now use "Batch CSV Production" to generate all files at once.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
