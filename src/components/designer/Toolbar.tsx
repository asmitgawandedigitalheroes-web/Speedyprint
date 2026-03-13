'use client'

import { useRef, useState, useCallback } from 'react'
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
  Type,
  ImagePlus,
  Square,
  Circle,
  Minus,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Google Fonts ---

const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Raleway',
  'Poppins',
  'Playfair Display',
  'Merriweather',
  'Source Sans Pro',
  'Ubuntu',
  'Nunito',
  'PT Sans',
  'Work Sans',
  'Quicksand',
  'Barlow',
  'Cabin',
  'Dosis',
  'Titillium Web',
] as const

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
  onToggleLayers,
  showLayers,
  className,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Text options
  const [fontFamily, setFontFamily] = useState('Inter')
  const [fontSize, setFontSize] = useState(24)
  const [textColor, setTextColor] = useState('#000000')
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left')

  // Shape options
  const [shapeFill, setShapeFill] = useState('#3b82f6')
  const [shapeStroke, setShapeStroke] = useState('#1d4ed8')
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2)

  // --- Text actions ---

  const handleAddText = useCallback(() => {
    canvasRef.current?.addText({
      fontFamily,
      fontSize,
      fill: textColor,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      underline: isUnderline,
      textAlign,
    })
  }, [canvasRef, fontFamily, fontSize, textColor, isBold, isItalic, isUnderline, textAlign])

  const updateSelectedText = useCallback(
    (property: string, value: unknown) => {
      const canvas = canvasRef.current?.getCanvas()
      if (!canvas) return

      const activeObj = canvas.getActiveObject()
      if (!activeObj || (activeObj.type !== 'i-text' && activeObj.type !== 'textbox')) return

      activeObj.set(property, value)
      canvas.renderAll()
    },
    [canvasRef]
  )

  // --- Image actions ---

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

      // Reset input so the same file can be uploaded again
      e.target.value = ''
    },
    [canvasRef]
  )

  // --- Shape actions ---

  const handleAddRect = useCallback(() => {
    canvasRef.current?.addShape('rect', {
      fill: shapeFill,
      stroke: shapeStroke,
      strokeWidth: shapeStrokeWidth,
    })
  }, [canvasRef, shapeFill, shapeStroke, shapeStrokeWidth])

  const handleAddCircle = useCallback(() => {
    canvasRef.current?.addShape('circle', {
      fill: shapeFill,
      stroke: shapeStroke,
      strokeWidth: shapeStrokeWidth,
    })
  }, [canvasRef, shapeFill, shapeStroke, shapeStrokeWidth])

  const handleAddLine = useCallback(() => {
    canvasRef.current?.addShape('line', {
      stroke: shapeStroke,
      strokeWidth: shapeStrokeWidth,
    })
  }, [canvasRef, shapeStroke, shapeStrokeWidth])

  return (
    <div
      className={cn(
        'flex w-[250px] shrink-0 flex-col overflow-y-auto border-r bg-background p-4',
        className
      )}
    >
      {/* --- Text Section --- */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Type className="size-4" />
          Add Text
        </h3>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleAddText}
        >
          <Type className="size-4" />
          Add Text
        </Button>

        {/* Font picker */}
        <div className="space-y-1.5">
          <Label className="text-xs">Font</Label>
          <Select
            value={fontFamily}
            onValueChange={(value) => {
              setFontFamily(value)
              updateSelectedText('fontFamily', value)
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

        {/* Font size */}
        <div className="space-y-1.5">
          <Label className="text-xs">Size</Label>
          <Input
            type="number"
            min={8}
            max={200}
            value={fontSize}
            onChange={(e) => {
              const val = Number(e.target.value)
              setFontSize(val)
              updateSelectedText('fontSize', val)
            }}
            className="h-8 text-xs"
          />
        </div>

        {/* Text color */}
        <div className="space-y-1.5">
          <Label className="text-xs">Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value)
                updateSelectedText('fill', e.target.value)
              }}
              className="size-8 cursor-pointer rounded border"
            />
            <Input
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value)
                updateSelectedText('fill', e.target.value)
              }}
              className="h-8 flex-1 text-xs"
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
              updateSelectedText('fontWeight', next ? 'bold' : 'normal')
            }}
            title="Bold"
          >
            <Bold className="size-3" />
          </Button>
          <Button
            variant={isItalic ? 'default' : 'outline'}
            size="icon-xs"
            onClick={() => {
              const next = !isItalic
              setIsItalic(next)
              updateSelectedText('fontStyle', next ? 'italic' : 'normal')
            }}
            title="Italic"
          >
            <Italic className="size-3" />
          </Button>
          <Button
            variant={isUnderline ? 'default' : 'outline'}
            size="icon-xs"
            onClick={() => {
              const next = !isUnderline
              setIsUnderline(next)
              updateSelectedText('underline', next)
            }}
            title="Underline"
          >
            <Underline className="size-3" />
          </Button>
        </div>

        {/* Text alignment */}
        <div className="flex items-center gap-1">
          <Button
            variant={textAlign === 'left' ? 'default' : 'outline'}
            size="icon-xs"
            onClick={() => {
              setTextAlign('left')
              updateSelectedText('textAlign', 'left')
            }}
            title="Align Left"
          >
            <AlignLeft className="size-3" />
          </Button>
          <Button
            variant={textAlign === 'center' ? 'default' : 'outline'}
            size="icon-xs"
            onClick={() => {
              setTextAlign('center')
              updateSelectedText('textAlign', 'center')
            }}
            title="Align Center"
          >
            <AlignCenter className="size-3" />
          </Button>
          <Button
            variant={textAlign === 'right' ? 'default' : 'outline'}
            size="icon-xs"
            onClick={() => {
              setTextAlign('right')
              updateSelectedText('textAlign', 'right')
            }}
            title="Align Right"
          >
            <AlignRight className="size-3" />
          </Button>
        </div>
      </div>

      <Separator className="my-4" />

      {/* --- Image Section --- */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ImagePlus className="size-4" />
          Add Image
        </h3>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={handleImageUpload}
        />

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          Upload Image
        </Button>
      </div>

      <Separator className="my-4" />

      {/* --- Shapes Section --- */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Square className="size-4" />
          Add Shape
        </h3>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleAddRect}
            title="Add Rectangle"
          >
            <Square className="size-3.5" />
            Rect
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleAddCircle}
            title="Add Circle"
          >
            <Circle className="size-3.5" />
            Circle
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleAddLine}
            title="Add Line"
          >
            <Minus className="size-3.5" />
            Line
          </Button>
        </div>

        {/* Shape fill color */}
        <div className="space-y-1.5">
          <Label className="text-xs">Fill Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={shapeFill}
              onChange={(e) => setShapeFill(e.target.value)}
              className="size-8 cursor-pointer rounded border"
            />
            <Input
              value={shapeFill}
              onChange={(e) => setShapeFill(e.target.value)}
              className="h-8 flex-1 text-xs"
              maxLength={7}
            />
          </div>
        </div>

        {/* Shape stroke color */}
        <div className="space-y-1.5">
          <Label className="text-xs">Stroke Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={shapeStroke}
              onChange={(e) => setShapeStroke(e.target.value)}
              className="size-8 cursor-pointer rounded border"
            />
            <Input
              value={shapeStroke}
              onChange={(e) => setShapeStroke(e.target.value)}
              className="h-8 flex-1 text-xs"
              maxLength={7}
            />
          </div>
        </div>

        {/* Shape stroke width */}
        <div className="space-y-1.5">
          <Label className="text-xs">Stroke Width</Label>
          <Input
            type="number"
            min={0}
            max={20}
            value={shapeStrokeWidth}
            onChange={(e) => setShapeStrokeWidth(Number(e.target.value))}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <Separator className="my-4" />

      {/* --- Templates / Layers Toggle --- */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Tools</h3>

        <Button
          variant={showLayers ? 'default' : 'outline'}
          size="sm"
          className="w-full"
          onClick={onToggleLayers}
        >
          <Layers className="size-4" />
          Layers
        </Button>
      </div>

      <Separator className="my-4" />

      {/* --- Templates (placeholder) --- */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Templates</h3>
        <p className="text-xs text-muted-foreground">
          Template gallery coming soon. You can design from scratch using the tools above.
        </p>
      </div>
    </div>
  )
}
