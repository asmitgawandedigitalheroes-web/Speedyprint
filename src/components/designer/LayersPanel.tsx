'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import type { DesignerCanvasRef } from '@/hooks/useDesigner'
import { isZoneGuide } from '@/lib/designer/canvas-utils'
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Type,
  Image,
  Square,
  Circle,
  Minus,
  Shapes,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Types ---

interface LayerItem {
  id: string
  name: string
  type: string
  visible: boolean
  locked: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricObject: any
}

interface LayersPanelProps {
  canvasRef: React.RefObject<DesignerCanvasRef | null>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedObject: any | null
  onClose?: () => void
  className?: string
}

// --- Get icon for object type ---

function getTypeIcon(type: string) {
  switch (type) {
    case 'i-text':
    case 'textbox':
    case 'text':
      return <Type className="size-3.5" />
    case 'image':
      return <Image className="size-3.5" />
    case 'rect':
      return <Square className="size-3.5" />
    case 'circle':
    case 'ellipse':
      return <Circle className="size-3.5" />
    case 'line':
      return <Minus className="size-3.5" />
    default:
      return <Shapes className="size-3.5" />
  }
}

// --- Get display name for object ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getObjectName(obj: any, index: number): string {
  if (obj.name && !obj.name.startsWith('__')) return obj.name

  const type = obj.type || 'unknown'

  switch (type) {
    case 'i-text':
    case 'textbox':
    case 'text': {
      const text = (obj.text || '').substring(0, 20)
      return text || `Text ${index + 1}`
    }
    case 'image':
      return `Image ${index + 1}`
    case 'rect':
      return `Rectangle ${index + 1}`
    case 'circle':
      return `Circle ${index + 1}`
    case 'line':
      return `Line ${index + 1}`
    default:
      return `Object ${index + 1}`
  }
}

// --- Component ---

export function LayersPanel({
  canvasRef,
  selectedObject,
  onClose,
  className,
}: LayersPanelProps) {
  const [layers, setLayers] = useState<LayerItem[]>([])

  // --- Sync layers from canvas ---

  const refreshLayers = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) {
      setLayers([])
      return
    }

    const objects = canvas.getObjects()
    const layerItems: LayerItem[] = []

    objects.forEach((obj: { name?: string; type?: string; visible?: boolean; selectable?: boolean }, index: number) => {
      // Skip zone guides and alignment guides
      if (
        isZoneGuide(obj) ||
        obj.name === '__print_bg' ||
        obj.name === '__alignment_guide'
      ) {
        return
      }

      layerItems.push({
        id: `layer-${index}`,
        name: getObjectName(obj, layerItems.length),
        type: obj.type || 'unknown',
        visible: obj.visible !== false,
        locked: !obj.selectable,
        fabricObject: obj,
      })
    })

    // Reverse so top layers appear first in the list
    setLayers(layerItems.reverse())
  }, [canvasRef])

  // Refresh on mount and when selection changes
  useEffect(() => {
    refreshLayers()
  }, [refreshLayers, selectedObject])

  // Also refresh on canvas events
  useEffect(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return

    const handler = () => refreshLayers()
    canvas.on('object:added', handler)
    canvas.on('object:removed', handler)
    canvas.on('object:modified', handler)

    return () => {
      canvas.off('object:added', handler)
      canvas.off('object:removed', handler)
      canvas.off('object:modified', handler)
    }
  }, [canvasRef, refreshLayers])

  // --- Layer actions ---

  const selectLayer = useCallback(
    (layer: LayerItem) => {
      const canvas = canvasRef.current?.getCanvas()
      if (!canvas || layer.locked) return

      canvas.setActiveObject(layer.fabricObject)
      canvas.renderAll()
    },
    [canvasRef]
  )

  const toggleVisibility = useCallback(
    (layer: LayerItem) => {
      const newVisible = !layer.visible
      layer.fabricObject.set('visible', newVisible)

      const canvas = canvasRef.current?.getCanvas()
      canvas?.renderAll()
      refreshLayers()
    },
    [canvasRef, refreshLayers]
  )

  const toggleLock = useCallback(
    (layer: LayerItem) => {
      const newLocked = !layer.locked
      layer.fabricObject.set({
        selectable: !newLocked,
        evented: !newLocked,
        lockMovementX: newLocked,
        lockMovementY: newLocked,
        lockScalingX: newLocked,
        lockScalingY: newLocked,
        lockRotation: newLocked,
        hasControls: !newLocked,
      })

      const canvas = canvasRef.current?.getCanvas()
      if (newLocked) {
        canvas?.discardActiveObject()
      }
      canvas?.renderAll()
      refreshLayers()
    },
    [canvasRef, refreshLayers]
  )

  const moveUp = useCallback(
    (layer: LayerItem) => {
      const canvas = canvasRef.current?.getCanvas()
      if (!canvas) return
      canvas.bringObjectForward(layer.fabricObject)
      canvas.renderAll()
      refreshLayers()
    },
    [canvasRef, refreshLayers]
  )

  const moveDown = useCallback(
    (layer: LayerItem) => {
      const canvas = canvasRef.current?.getCanvas()
      if (!canvas) return
      canvas.sendObjectBackwards(layer.fabricObject)
      canvas.renderAll()
      refreshLayers()
    },
    [canvasRef, refreshLayers]
  )

  // --- Check if a layer is currently selected ---

  const isSelected = useCallback(
    (layer: LayerItem) => {
      return selectedObject === layer.fabricObject
    },
    [selectedObject]
  )

  return (
    <div
      className={cn(
        'flex w-[250px] shrink-0 flex-col border-r bg-background',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-semibold">Layers</h3>
        {onClose && (
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No elements on canvas
          </div>
        ) : (
          <div className="divide-y">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={cn(
                  'group flex items-center gap-2 px-2 py-1.5 transition-colors',
                  isSelected(layer) && 'bg-accent',
                  !layer.visible && 'opacity-50',
                  layer.locked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'
                )}
                onClick={() => selectLayer(layer)}
              >
                {/* Type icon */}
                <span className="flex shrink-0 items-center text-muted-foreground">
                  {getTypeIcon(layer.type)}
                </span>

                {/* Name */}
                <span className="flex-1 truncate text-xs">
                  {layer.name}
                </span>

                {/* Actions (visible on hover or when selected) */}
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveUp(layer)
                    }}
                    title="Move Up"
                    className="size-5"
                  >
                    <ChevronUp className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveDown(layer)
                    }}
                    title="Move Down"
                    className="size-5"
                  >
                    <ChevronDown className="size-3" />
                  </Button>
                </div>

                {/* Visibility toggle */}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="size-5 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleVisibility(layer)
                  }}
                  title={layer.visible ? 'Hide' : 'Show'}
                >
                  {layer.visible ? (
                    <Eye className="size-3" />
                  ) : (
                    <EyeOff className="size-3" />
                  )}
                </Button>

                {/* Lock toggle */}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="size-5 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLock(layer)
                  }}
                  title={layer.locked ? 'Unlock' : 'Lock'}
                >
                  {layer.locked ? (
                    <Lock className="size-3" />
                  ) : (
                    <Unlock className="size-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
