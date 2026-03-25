'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { DesignerCanvasRef } from '@/hooks/useDesigner'
import {
  Trash2,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImagePlus,
  MousePointer2,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  FlipHorizontal2,
  FlipVertical2,
  Group,
  Ungroup,
  Droplets,
  Sun,
  Palette,
  Ruler,
  Maximize2,
} from 'lucide-react'
import { useEditorStore } from '@/lib/designer/store'
import { cn } from '@/lib/utils'
import { GOOGLE_FONTS } from '@/lib/designer/fonts'

// Recommended colors palette
const RECOMMENDED_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E',
  '#E17055', '#00B894', '#00CEC9', '#0984E3', '#6C5CE7',
]

// --- Props ---

interface PropertiesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedObject: any | null
  canvasRef: React.RefObject<DesignerCanvasRef | null>
  onObjectModified?: () => void
  className?: string
}

// --- Helper to detect object type ---

function getObjectType(obj: { type?: string } | null): string {
  if (!obj) return 'none'
  const type = obj.type || ''
  if (type === 'i-text' || type === 'textbox' || type === 'text') return 'text'
  if (type === 'image') return 'image'
  if (type === 'rect' || type === 'circle' || type === 'ellipse' || type === 'triangle' || type === 'polygon') return 'shape'
  if (type === 'line') return 'shape'
  if (type === 'group') return 'group'
  return 'unknown'
}

// --- Component ---

export function PropertiesPanel({
  selectedObject,
  canvasRef,
  onObjectModified,
  className,
}: PropertiesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editor = useEditorStore((s) => s.editor)

  // Object transform properties
  const [posX, setPosX] = useState(0)
  const [posY, setPosY] = useState(0)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [opacity, setOpacity] = useState(100)
  const [isLocked, setIsLocked] = useState(false)

  // Text properties
  const [fontFamily, setFontFamily] = useState('Inter')
  const [fontSize, setFontSize] = useState(24)
  const [textColor, setTextColor] = useState('#000000')
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [textAlign, setTextAlign] = useState('left')

  // Shape properties
  const [shapeFill, setShapeFill] = useState('#3b82f6')
  const [shapeStroke, setShapeStroke] = useState('#1d4ed8')
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2)

  // Background color for canvas
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')

  const objType = getObjectType(selectedObject)

  // --- Sync state from selected object ---

  useEffect(() => {
    if (!selectedObject) return

    setPosX(Math.round(selectedObject.left || 0))
    setPosY(Math.round(selectedObject.top || 0))

    const bound = selectedObject.getBoundingRect?.() || { width: 0, height: 0 }
    setWidth(Math.round(bound.width || selectedObject.width || 0))
    setHeight(Math.round(bound.height || selectedObject.height || 0))

    setRotation(Math.round(selectedObject.angle || 0))
    setOpacity(Math.round((selectedObject.opacity ?? 1) * 100))
    setIsLocked(!selectedObject.selectable)

    if (objType === 'text') {
      setFontFamily(selectedObject.fontFamily || 'Inter')
      setFontSize(selectedObject.fontSize || 24)
      setTextColor(selectedObject.fill || '#000000')
      setIsBold(selectedObject.fontWeight === 'bold')
      setIsItalic(selectedObject.fontStyle === 'italic')
      setIsUnderline(selectedObject.underline || false)
      setTextAlign(selectedObject.textAlign || 'left')
    }

    if (objType === 'shape') {
      setShapeFill(selectedObject.fill || '#3b82f6')
      setShapeStroke(selectedObject.stroke || '#1d4ed8')
      setShapeStrokeWidth(selectedObject.strokeWidth || 2)
    }
  }, [selectedObject, objType])

  // --- Update selected object property ---

  const updateObject = useCallback(
    (property: string, value: unknown) => {
      if (!selectedObject) return

      selectedObject.set(property, value)
      selectedObject.setCoords?.()

      const canvas = canvasRef.current?.getCanvas()
      canvas?.renderAll()
      onObjectModified?.()
    },
    [selectedObject, canvasRef, onObjectModified]
  )

  // --- Layer controls ---

  const bringForward = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas || !selectedObject) return
    canvas.bringObjectForward(selectedObject)
    canvas.renderAll()
    onObjectModified?.()
  }, [canvasRef, selectedObject, onObjectModified])

  const sendBackward = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas || !selectedObject) return
    canvas.sendObjectBackwards(selectedObject)
    canvas.renderAll()
    onObjectModified?.()
  }, [canvasRef, selectedObject, onObjectModified])

  const bringToFront = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas || !selectedObject) return
    canvas.bringObjectToFront(selectedObject)
    canvas.renderAll()
    onObjectModified?.()
  }, [canvasRef, selectedObject, onObjectModified])

  const sendToBack = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas || !selectedObject) return
    canvas.sendObjectToBack(selectedObject)
    canvas.renderAll()
    onObjectModified?.()
  }, [canvasRef, selectedObject, onObjectModified])

  // --- Lock / Unlock ---

  const toggleLock = useCallback(() => {
    if (!selectedObject) return
    const next = !isLocked
    setIsLocked(next)

    selectedObject.set({
      selectable: !next,
      evented: !next,
      lockMovementX: next,
      lockMovementY: next,
      lockScalingX: next,
      lockScalingY: next,
      lockRotation: next,
      hasControls: !next,
    })

    const canvas = canvasRef.current?.getCanvas()
    if (next) {
      canvas?.discardActiveObject()
    }
    canvas?.renderAll()
  }, [selectedObject, isLocked, canvasRef])

  // --- Delete ---

  const handleDelete = useCallback(() => {
    canvasRef.current?.deleteSelected()
  }, [canvasRef])

  // --- Replace Image ---

  const handleReplaceImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !selectedObject) return
      e.target.value = ''

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

      if (isPdf) {
        // PDFs: route through ImportPlugin (renders first page as image)
        if (!editor) return
        const plugin = editor.getPlugin<{ importFile: (f: File) => Promise<void> }>('ImportPlugin')
        if (plugin) await plugin.importFile(file)
        return
      }

      // Images: use smartUpload (local for small, CDN for large), then swap element
      try {
        const { smartUpload } = await import('@/lib/upload')
        const url = await smartUpload(file)
        const imgElement = new Image()
        imgElement.crossOrigin = 'anonymous'
        imgElement.onload = () => {
          selectedObject.setElement(imgElement)
          const canvas = canvasRef.current?.getCanvas()
          canvas?.renderAll()
          onObjectModified?.()
        }
        imgElement.src = url
      } catch {
        // Fallback to local data URL
        const reader = new FileReader()
        reader.onload = () => {
          const imgElement = new Image()
          imgElement.crossOrigin = 'anonymous'
          imgElement.onload = () => {
            selectedObject.setElement(imgElement)
            const canvas = canvasRef.current?.getCanvas()
            canvas?.renderAll()
            onObjectModified?.()
          }
          imgElement.src = reader.result as string
        }
        reader.readAsDataURL(file)
      }
    },
    [selectedObject, canvasRef, onObjectModified, editor]
  )

  // --- Render ---

  return (
    <div
      className={cn(
        'flex w-[300px] shrink-0 flex-col overflow-y-auto border-l bg-background',
        className
      )}
    >
      {/* Preview Section */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Preview</h3>
        <div className="aspect-[4/3] bg-gray-100 rounded-lg border overflow-hidden flex items-center justify-center">
          <div className="text-center text-gray-400 text-xs">
            <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Design Preview
          </div>
        </div>
      </div>

      {/* Background Color Section */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Background Color</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-10 h-10 rounded-lg border cursor-pointer"
            />
          </div>
          <Input
            type="text"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="flex-1 h-10"
            placeholder="#FFFFFF"
          />
        </div>
      </div>

      {/* Recommended Colors */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Recommended Colors</h3>
        <div className="grid grid-cols-5 gap-2">
          {RECOMMENDED_COLORS.map((color, index) => (
            <button
              key={index}
              onClick={() => setBackgroundColor(color)}
              className="w-8 h-8 rounded-full border border-gray-200 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Object Properties */}
      {selectedObject ? (
        <div className="p-4 flex-1">
          <h3 className="text-sm font-semibold capitalize text-foreground mb-3">
            {objType} Properties
          </h3>

      {/* --- Position --- */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Position</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">X</Label>
            <Input
              type="number"
              value={posX}
              onChange={(e) => {
                const val = Number(e.target.value)
                setPosX(val)
                updateObject('left', val)
              }}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Y</Label>
            <Input
              type="number"
              value={posY}
              onChange={(e) => {
                const val = Number(e.target.value)
                setPosY(val)
                updateObject('top', val)
              }}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* --- Size --- */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">Size</Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              // Reset to original size
              updateObject('scaleX', 1)
              updateObject('scaleY', 1)
              setWidth(selectedObject.width * 1)
              setHeight(selectedObject.height * 1)
            }}
          >
            <Maximize2 className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
        
        {/* Size Presets */}
        <div className="grid grid-cols-4 gap-1">
          {[
            { w: 50, h: 50, label: '50×50' },
            { w: 100, h: 100, label: '100×100' },
            { w: 150, h: 100, label: '150×100' },
            { w: 200, h: 100, label: '200×100' },
          ].map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                setWidth(preset.w)
                setHeight(preset.h)
                const scaleX = preset.w / (selectedObject.width || 1)
                const scaleY = preset.h / (selectedObject.height || 1)
                updateObject('scaleX', scaleX)
                updateObject('scaleY', scaleY)
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">W</Label>
            <Input
              type="number"
              value={width}
              onChange={(e) => {
                const val = Number(e.target.value)
                setWidth(val)
                const scale = val / (selectedObject.width || 1)
                updateObject('scaleX', scale)
              }}
              className="h-7 text-xs"
              min={1}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">H</Label>
            <Input
              type="number"
              value={height}
              onChange={(e) => {
                const val = Number(e.target.value)
                setHeight(val)
                const scale = val / (selectedObject.height || 1)
                updateObject('scaleY', scale)
              }}
              className="h-7 text-xs"
              min={1}
            />
          </div>
        </div>

        {/* Constrain Proportions */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="constrain"
            className="h-3 w-3"
            defaultChecked={true}
            onChange={(e) => {
              // TODO: Implement constrain proportions logic
            }}
          />
          <Label htmlFor="constrain" className="text-xs">Constrain proportions</Label>
        </div>
      </div>

      {/* --- Rotation --- */}
      <div className="mt-3 space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Rotation</Label>
        <Input
          type="number"
          value={rotation}
          min={0}
          max={360}
          onChange={(e) => {
            const val = Number(e.target.value) % 360
            setRotation(val)
            updateObject('angle', val)
          }}
          className="h-7 text-xs"
        />
      </div>

      {/* --- Opacity --- */}
      <div className="mt-3 space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          Opacity: {opacity}%
        </Label>
        <input
          type="range"
          min={0}
          max={100}
          value={opacity}
          onChange={(e) => {
            const val = Number(e.target.value)
            setOpacity(val)
            updateObject('opacity', val / 100)
          }}
          className="w-full accent-primary"
        />
      </div>

      {/* --- Shadow Effects --- */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">Shadow</Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              // Remove shadow
              updateObject('shadow', '')
              updateObject('shadowBlur', 0)
              updateObject('shadowOffsetX', 0)
              updateObject('shadowOffsetY', 0)
              updateObject('shadowColor', 'transparent')
            }}
          >
            <Sun className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>

        {/* Shadow Presets */}
        <div className="grid grid-cols-3 gap-1">
          {[
            { blur: 5, x: 2, y: 2, color: 'rgba(0,0,0,0.2)', label: 'Soft' },
            { blur: 10, x: 4, y: 4, color: 'rgba(0,0,0,0.3)', label: 'Medium' },
            { blur: 15, x: 6, y: 6, color: 'rgba(0,0,0,0.4)', label: 'Hard' },
          ].map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                updateObject('shadow', `${preset.color} ${preset.x}px ${preset.y}px ${preset.blur}px`)
                updateObject('shadowBlur', preset.blur)
                updateObject('shadowOffsetX', preset.x)
                updateObject('shadowOffsetY', preset.y)
                updateObject('shadowColor', preset.color)
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Custom Shadow Controls */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">X Offset</Label>
              <Input
                type="number"
                defaultValue={0}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  updateObject('shadowOffsetX', val)
                }}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Y Offset</Label>
              <Input
                type="number"
                defaultValue={0}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  updateObject('shadowOffsetY', val)
                }}
                className="h-7 text-xs"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs">Blur</Label>
            <Input
              type="number"
              defaultValue={0}
              min={0}
              max={50}
              onChange={(e) => {
                const val = Number(e.target.value)
                updateObject('shadowBlur', val)
              }}
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                defaultValue="#000000"
                onChange={(e) => {
                  const hex = e.target.value
                  const rgba = `${hex}88` // Add transparency
                  updateObject('shadowColor', rgba)
                }}
                className="h-7 w-7 border border-border rounded"
              />
              <Input
                type="text"
                defaultValue="#000000"
                onChange={(e) => {
                  const hex = e.target.value
                  const rgba = `${hex}88`
                  updateObject('shadowColor', rgba)
                }}
                className="h-7 text-xs flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-3" />

      {/* --- Text Properties --- */}
      {objType === 'text' && (
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground">Text</Label>

          {/* Font */}
          <div className="space-y-1">
            <Label className="text-xs">Font</Label>
            <Select
              value={fontFamily}
              onValueChange={(val) => {
                setFontFamily(val)
                updateObject('fontFamily', val)
              }}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOOGLE_FONTS.map((font) => (
                  <SelectItem key={font} value={font} className="text-xs">
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-1">
            <Label className="text-xs">Size</Label>
            <Input
              type="number"
              min={8}
              max={200}
              value={fontSize}
              onChange={(e) => {
                const val = Number(e.target.value)
                setFontSize(val)
                updateObject('fontSize', val)
              }}
              className="h-7 text-xs"
            />
          </div>

          {/* Text Color */}
          <div className="space-y-1">
            <Label className="text-xs">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value)
                  updateObject('fill', e.target.value)
                }}
                className="size-7 cursor-pointer rounded border"
              />
              <Input
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value)
                  updateObject('fill', e.target.value)
                }}
                className="h-7 flex-1 text-xs"
                maxLength={7}
              />
            </div>
          </div>

          {/* Bold / Italic / Underline */}
          <div className="flex items-center gap-1">
            <Button
              variant={isBold ? 'default' : 'outline'}
              size="icon-xs"
              onClick={() => {
                const next = !isBold
                setIsBold(next)
                updateObject('fontWeight', next ? 'bold' : 'normal')
              }}
            >
              <Bold className="size-3" />
            </Button>
            <Button
              variant={isItalic ? 'default' : 'outline'}
              size="icon-xs"
              onClick={() => {
                const next = !isItalic
                setIsItalic(next)
                updateObject('fontStyle', next ? 'italic' : 'normal')
              }}
            >
              <Italic className="size-3" />
            </Button>
            <Button
              variant={isUnderline ? 'default' : 'outline'}
              size="icon-xs"
              onClick={() => {
                const next = !isUnderline
                setIsUnderline(next)
                updateObject('underline', next)
              }}
            >
              <Underline className="size-3" />
            </Button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1">
            <Button
              variant={textAlign === 'left' ? 'default' : 'outline'}
              size="icon-xs"
              onClick={() => {
                setTextAlign('left')
                updateObject('textAlign', 'left')
              }}
            >
              <AlignLeft className="size-3" />
            </Button>
            <Button
              variant={textAlign === 'center' ? 'default' : 'outline'}
              size="icon-xs"
              onClick={() => {
                setTextAlign('center')
                updateObject('textAlign', 'center')
              }}
            >
              <AlignCenter className="size-3" />
            </Button>
            <Button
              variant={textAlign === 'right' ? 'default' : 'outline'}
              size="icon-xs"
              onClick={() => {
                setTextAlign('right')
                updateObject('textAlign', 'right')
              }}
            >
              <AlignRight className="size-3" />
            </Button>
          </div>

          <Separator className="my-2" />
        </div>
      )}

      {/* --- Image Properties --- */}
      {objType === 'image' && (
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground">Image</Label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
            className="hidden"
            onChange={handleReplaceImage}
          />

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            Replace Image
          </Button>

          <Separator className="my-2" />
        </div>
      )}

      {/* --- Shape Properties --- */}
      {objType === 'shape' && (
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground">Shape</Label>

          {/* Fill Color */}
          <div className="space-y-1">
            <Label className="text-xs">Fill</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={shapeFill}
                onChange={(e) => {
                  setShapeFill(e.target.value)
                  updateObject('fill', e.target.value)
                }}
                className="size-7 cursor-pointer rounded border"
              />
              <Input
                value={shapeFill}
                onChange={(e) => {
                  setShapeFill(e.target.value)
                  updateObject('fill', e.target.value)
                }}
                className="h-7 flex-1 text-xs"
                maxLength={7}
              />
            </div>
          </div>

          {/* Stroke Color */}
          <div className="space-y-1">
            <Label className="text-xs">Stroke</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={shapeStroke}
                onChange={(e) => {
                  setShapeStroke(e.target.value)
                  updateObject('stroke', e.target.value)
                }}
                className="size-7 cursor-pointer rounded border"
              />
              <Input
                value={shapeStroke}
                onChange={(e) => {
                  setShapeStroke(e.target.value)
                  updateObject('stroke', e.target.value)
                }}
                className="h-7 flex-1 text-xs"
                maxLength={7}
              />
            </div>
          </div>

          {/* Stroke Width */}
          <div className="space-y-1">
            <Label className="text-xs">Stroke Width</Label>
            <Input
              type="number"
              min={0}
              max={20}
              value={shapeStrokeWidth}
              onChange={(e) => {
                const val = Number(e.target.value)
                setShapeStrokeWidth(val)
                updateObject('strokeWidth', val)
              }}
              className="h-7 text-xs"
            />
          </div>

          <Separator className="my-2" />
        </div>
      )}

      {/* --- Alignment Controls --- */}
      <AlignmentSection />

      <Separator className="my-3" />

      {/* --- Layer Controls --- */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Layer Order</Label>
        <div className="grid grid-cols-4 gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={bringToFront}
            title="Bring to Front"
          >
            <ChevronsUp className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={bringForward}
            title="Bring Forward"
          >
            <ChevronUp className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={sendBackward}
            title="Send Backward"
          >
            <ChevronDown className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={sendToBack}
            title="Send to Back"
          >
            <ChevronsDown className="size-3" />
          </Button>
        </div>
      </div>

      <Separator className="my-3" />

      {/* --- Flip + Group --- */}
      <FlipGroupSection />

      <Separator className="my-3" />

      {/* --- Lock / Delete --- */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={toggleLock}
        >
          {isLocked ? (
            <>
              <Unlock className="size-3.5" />
              Unlock
            </>
          ) : (
            <>
              <Lock className="size-3.5" />
              Lock
            </>
          )}
        </Button>

        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={handleDelete}
        >
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      </div>
    </div>
  ) : (
    /* Empty state - no object selected */
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
      <MousePointer2 className="h-12 w-12 text-gray-300 mb-3" />
      <p className="text-sm text-gray-500">Select an element to edit its properties</p>
    </div>
  )}
    </div>
  )
}

// --- AlignmentSection component ---

function AlignmentSection() {
  const editor = useEditorStore((s) => s.editor)

  const handleAlign = (type: string) => {
    if (!editor) return
    const plugin = editor.getPlugin<{ align: (type: string) => void }>('AlignPlugin')
    plugin?.align(type)
  }

  const handleDistribute = (type: string) => {
    if (!editor) return
    const plugin = editor.getPlugin<{ distribute: (type: string) => void }>('AlignPlugin')
    plugin?.distribute(type)
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">Align</Label>
      <div className="grid grid-cols-6 gap-1">
        <Button variant="outline" size="icon-xs" onClick={() => handleAlign('left')} title="Align Left">
          <AlignStartVertical className="size-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={() => handleAlign('center-h')} title="Align Center H">
          <AlignCenterVertical className="size-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={() => handleAlign('right')} title="Align Right">
          <AlignEndVertical className="size-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={() => handleAlign('top')} title="Align Top">
          <AlignStartHorizontal className="size-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={() => handleAlign('center-v')} title="Align Center V">
          <AlignCenterHorizontal className="size-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={() => handleAlign('bottom')} title="Align Bottom">
          <AlignEndHorizontal className="size-3" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <Button variant="outline" size="xs" onClick={() => handleDistribute('horizontal')} className="text-[10px]">
          Distribute H
        </Button>
        <Button variant="outline" size="xs" onClick={() => handleDistribute('vertical')} className="text-[10px]">
          Distribute V
        </Button>
      </div>
    </div>
  )
}

// --- FlipGroupSection component ---

function FlipGroupSection() {
  const editor = useEditorStore((s) => s.editor)

  const handleFlipH = () => {
    if (!editor) return
    const plugin = editor.getPlugin<{ flipHorizontal: () => void }>('FlipPlugin')
    plugin?.flipHorizontal()
  }

  const handleFlipV = () => {
    if (!editor) return
    const plugin = editor.getPlugin<{ flipVertical: () => void }>('FlipPlugin')
    plugin?.flipVertical()
  }

  const handleGroup = () => {
    if (!editor) return
    const plugin = editor.getPlugin<{ group: () => void }>('GroupPlugin')
    plugin?.group()
  }

  const handleUngroup = () => {
    if (!editor) return
    const plugin = editor.getPlugin<{ ungroup: () => void }>('GroupPlugin')
    plugin?.ungroup()
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">Transform</Label>
      <div className="grid grid-cols-4 gap-1">
        <Button variant="outline" size="icon-xs" onClick={handleFlipH} title="Flip Horizontal">
          <FlipHorizontal2 className="size-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={handleFlipV} title="Flip Vertical">
          <FlipVertical2 className="size-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={handleGroup} title="Group (Ctrl+G)">
          <Group className="size-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={handleUngroup} title="Ungroup (Ctrl+Shift+G)">
          <Ungroup className="size-3" />
        </Button>
      </div>
    </div>
  )
}
