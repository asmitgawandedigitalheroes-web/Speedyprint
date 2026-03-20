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
} from 'lucide-react'
import { useEditorStore } from '@/lib/designer/store'
import { cn } from '@/lib/utils'
import { GOOGLE_FONTS } from '@/lib/designer/fonts'

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

  if (!selectedObject) {
    return (
      <div
        className={cn(
          'flex w-[280px] shrink-0 flex-col items-center justify-center border-l bg-background p-6',
          className
        )}
      >
        <MousePointer2 className="mb-3 size-10 text-muted-foreground/40" />
        <p className="text-center text-sm text-muted-foreground">
          Select an element to edit its properties
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex w-[280px] shrink-0 flex-col overflow-y-auto border-l bg-background p-4',
        className
      )}
    >
      <h3 className="mb-3 text-sm font-semibold capitalize text-foreground">
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
        <Label className="text-xs font-medium text-muted-foreground">Size</Label>
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
