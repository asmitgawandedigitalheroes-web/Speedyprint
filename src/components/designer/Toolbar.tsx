'use client'

/**
 * Toolbar — Tabbed left panel for the designer editor.
 * Tabs: Text | Images | Shapes | QR/Barcode | Filters | Layers
 */

import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/lib/designer/store'
import { LayersPanel } from './LayersPanel'
import { TextPanel } from './panels/TextPanel'
import { ShapesPanel } from './panels/ShapesPanel'
import { QRCodePanel } from './panels/QRCodePanel'
import { BarcodePanel } from './panels/BarcodePanel'
import { ImageFiltersPanel } from './panels/ImageFiltersPanel'
import type { DesignerCanvasRef } from '@/hooks/useDesigner'
import {
  Type,
  ImagePlus,
  Shapes,
  QrCode,
  Layers,
  Upload,
  FileJson,
} from 'lucide-react'

// --- Tab definitions ---

type TabId = 'text' | 'images' | 'shapes' | 'qrcode' | 'layers' | 'filters'

interface TabDef {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: TabDef[] = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'images', label: 'Images', icon: ImagePlus },
  { id: 'shapes', label: 'Shapes', icon: Shapes },
  { id: 'qrcode', label: 'QR/Barcode', icon: QrCode },
  { id: 'filters', label: 'Filters', icon: ImagePlus },
  { id: 'layers', label: 'Layers', icon: Layers },
]

// --- Props ---

interface ToolbarProps {
  canvasRef: React.RefObject<DesignerCanvasRef | null>
  onToggleLayers?: () => void
  showLayers?: boolean
  className?: string
}

// --- Component ---

export function Toolbar({
  canvasRef,
  className,
}: ToolbarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('text')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const editor = useEditorStore((s) => s.editor)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedObject = useEditorStore((s) => s.activeObjects?.[0] as any)

  // --- Image upload ---
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        canvasRef.current?.addImage(dataUrl)
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    },
    [canvasRef]
  )

  // --- File import ---
  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !editor) return

      const plugin = editor.getPlugin<{
        importFile: (file: File) => Promise<void>
      }>('ImportPlugin')
      if (plugin) {
        plugin.importFile(file)
      }
      e.target.value = ''
    },
    [editor]
  )

  return (
    <div className={cn('flex h-full shrink-0', className)}>
      {/* Icon sidebar */}
      <div className="flex w-12 flex-col items-center border-r bg-gray-50 py-2 gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex h-10 w-10 flex-col items-center justify-center rounded-lg text-[9px] transition-colors',
                isActive
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              )}
              title={tab.label}
            >
              <Icon className="h-4 w-4" />
              <span className="mt-0.5 leading-tight">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Panel content */}
      <div className="w-[228px] overflow-y-auto border-r bg-background p-3">
        {/* Text tab */}
        {activeTab === 'text' && <TextPanel />}

        {/* Images tab */}
        {activeTab === 'images' && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-700">Images</div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <Upload className="h-5 w-5" />
              <div>
                <div className="font-medium">Upload Image</div>
                <div className="text-[10px] text-gray-400">PNG, JPG, SVG, WebP</div>
              </div>
            </button>

            {/* Import file */}
            <input
              ref={importInputRef}
              type="file"
              accept=".svg,.json,image/svg+xml,application/json"
              className="hidden"
              onChange={handleFileImport}
            />

            <button
              onClick={() => importInputRef.current?.click()}
              className="flex w-full items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FileJson className="h-4 w-4" />
              <span>Import SVG / JSON</span>
            </button>

            {/* Image filters section (shown when an image is selected) */}
            <div className="border-t pt-3">
              <ImageFiltersPanel />
            </div>
          </div>
        )}

        {/* Shapes tab */}
        {activeTab === 'shapes' && <ShapesPanel />}

        {/* QR/Barcode tab */}
        {activeTab === 'qrcode' && (
          <div className="space-y-6">
            <QRCodePanel />
            <div className="border-t pt-4">
              <BarcodePanel />
            </div>
          </div>
        )}

        {/* Filters tab */}
        {activeTab === 'filters' && <ImageFiltersPanel />}

        {/* Layers tab */}
        {activeTab === 'layers' && (
          <LayersPanel
            canvasRef={canvasRef}
            selectedObject={selectedObject}
            onClose={() => setActiveTab('text')}
          />
        )}
      </div>
    </div>
  )
}
