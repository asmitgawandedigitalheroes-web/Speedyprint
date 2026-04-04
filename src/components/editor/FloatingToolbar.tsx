'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Copy,
  Trash2,
  Lock,
  ChevronRight,
  ChevronsUp,
  ChevronsDown,
  ArrowUp,
  ArrowDown,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical as AlignTop,
  AlignCenterVertical as AlignMiddle,
  AlignEndVertical as AlignBottom,
  Clipboard,
  Paintbrush,
  CopyPlus,
  Type,
  FlipHorizontal,
  FlipVertical,
  MoreHorizontal,
  Unlock,
} from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import {
  duplicateSelected,
  deleteSelected,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  toggleLock,
  copyToClipboard,
  pasteFromClipboard,
  copyStyle,
  pasteStyle,
  alignLeft,
  alignRight,
  alignTop,
  alignBottom,
  alignCenterHorizontal,
  alignCenterVertical,
  flipHorizontal,
  flipVertical,
} from '@/lib/editor/fabricUtils'

interface ToolbarPos {
  x: number
  y: number
}

type SubMenuType = 'layers' | 'align' | null

export default function FloatingToolbar() {
  const canvas = useEditorStore((s) => s.canvas)
  const activeObject = useEditorStore((s) => s.activeObject)
  const setLeftPanel = useEditorStore((s) => s.setLeftPanel)
  const [pos, setPos] = useState<ToolbarPos | null>(null)
  const [subMenu, setSubMenu] = useState<SubMenuType>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [tick, setTick] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // Auto-reset expansion on new object selection
  useEffect(() => {
    setIsExpanded(false)
    setSubMenu(null)
  }, [activeObject])

  const updatePosition = useCallback(() => {
    if (!canvas || !activeObject) {
      setPos(null)
      return
    }

    const bound = activeObject.getBoundingRect()
    const vpt = canvas.viewportTransform
    if (!vpt) return

    // Transform object coords to screen coords
    const screenX = bound.left * vpt[0] + vpt[4]
    const screenY = bound.top * vpt[3] + vpt[5]
    const screenW = bound.width * vpt[0]

    // Position above the object, centered horizontally
    const pillWidth = isExpanded ? 230 : 160
    const pillHeight = 44
    
    let x = screenX + (screenW - pillWidth) / 2
    let y = screenY - pillHeight - 12

    const winW = window.innerWidth
    
    // Horizontal bounds
    if (x < 12) x = 12
    if (x + pillWidth > winW - 12) x = winW - pillWidth - 12

    // Vertical bounds - if too close to top, flip to bottom
    if (y < 80) {
      const screenH = bound.height * vpt[3]
      y = screenY + screenH + 12
    }

    setPos({ x, y })
  }, [canvas, activeObject, isExpanded])

  useEffect(() => {
    updatePosition()
  }, [updatePosition])

  useEffect(() => {
    if (!canvas) return
    const handler = () => {
      updatePosition()
      setTick(prev => prev + 1)
    }
    canvas.on('object:moving', handler)
    canvas.on('object:scaling', handler)
    canvas.on('object:rotating', handler)
    canvas.on('object:modified', handler)
    return () => {
      canvas.off('object:moving', handler)
      canvas.off('object:scaling', handler)
      canvas.off('object:rotating', handler)
      canvas.off('object:modified', handler)
    }
  }, [canvas, updatePosition])

  if (!pos || !canvas || !activeObject) return null

  const isText =
    activeObject.type === 'text' ||
    activeObject.type === 'i-text' ||
    activeObject.type === 'textbox'

  const itemClass =
    'flex items-center justify-between w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-md group'
  const subItemClass =
    'flex items-center justify-between w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-md'
  const shortcutClass = 'text-[9px] text-gray-400 font-semibold bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded uppercase tracking-tighter'
  const iconClass = 'text-gray-400 group-hover:text-gray-600 transition-colors'
  
  const compactBtnClass = 'p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all active:scale-90'
  const lockText = activeObject.selectable === false ? 'Unlock' : 'Lock'
  const isLocked = activeObject.selectable === false

  return (
    <div
      ref={menuRef}
      className={`absolute z-30 flex flex-col gap-2 animate-in fade-in zoom-in duration-150`}
      style={{
        left: pos.x,
        top: Math.max(80, pos.y),
        pointerEvents: 'auto',
      }}
    >
      {/* Compact Header Bar */}
      <div className="bg-white border border-gray-200 rounded-full shadow-xl py-1 px-1.5 flex items-center gap-0.5 self-start">
        <button onClick={() => toggleLock(canvas, activeObject)} title={isLocked ? "Unlock" : "Lock"} className={compactBtnClass}>
          {isLocked ? <Unlock size={18} /> : <Lock size={18} />}
        </button>
        <button onClick={() => duplicateSelected(canvas)} title="Duplicate (Ctrl+D)" className={compactBtnClass}>
          <CopyPlus size={18} />
        </button>
        <button onClick={() => deleteSelected(canvas)} title="Delete (DEL)" className={compactBtnClass}>
          <Trash2 size={18} />
        </button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          title="More Options" 
          className={`${compactBtnClass} ${isExpanded ? 'bg-gray-100 text-gray-900' : ''}`}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Expanded (Full) Menu */}
      {isExpanded && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 px-1.5 min-w-[230px] animate-in fade-in slide-in-from-top-2 duration-150">
          {isText && (
            <>
              <button
                onClick={() => {
                  canvas.setActiveObject(activeObject)
                  ;(activeObject as any).enterEditing?.()
                  canvas.renderAll()
                }}
                className={itemClass}
              >
                <span className="flex items-center gap-3 font-medium">
                  <Type size={16} className={iconClass} />
                  Edit Text
                </span>
                <span className={shortcutClass}>Double Click</span>
              </button>
              <div className="h-px bg-gray-100/80 my-1.5 mx-2" />
            </>
          )}

          <button onClick={() => copyToClipboard(canvas)} className={itemClass}>
            <span className="flex items-center gap-3 font-medium">
              <Copy size={16} className={iconClass} />
              Copy
            </span>
            <span className={shortcutClass}>Ctrl+C</span>
          </button>

          <button onClick={() => copyStyle(canvas)} className={itemClass}>
            <span className="flex items-center gap-3 font-medium">
              <Paintbrush size={16} className={iconClass} />
              Copy style
            </span>
            <span className={shortcutClass}>Ctrl+Alt+C</span>
          </button>

          <button onClick={() => pasteFromClipboard(canvas)} className={itemClass}>
            <span className="flex items-center gap-3 font-medium">
              <Clipboard size={16} className={iconClass} />
              Paste
            </span>
            <span className={shortcutClass}>Ctrl+V</span>
          </button>

          <button onClick={() => duplicateSelected(canvas)} className={itemClass}>
            <span className="flex items-center gap-3 font-medium">
              <CopyPlus size={16} className={iconClass} />
              Duplicate
            </span>
            <span className={shortcutClass}>Ctrl+D</span>
          </button>

          <button onClick={() => deleteSelected(canvas)} className={itemClass}>
            <span className="flex items-center gap-3 font-medium">
              <Trash2 size={16} className={iconClass} />
              Delete
            </span>
            <span className={shortcutClass}>DELETE</span>
          </button>

          <div className="h-px bg-gray-100/80 my-1.5 mx-2" />

          {/* Layer Submenu */}
          <div className="relative">
            <button
              onMouseEnter={() => setSubMenu('layers')}
              className={itemClass}
            >
              <span className="flex items-center gap-3 font-medium">
                <Layers size={16} className={iconClass} />
                Layer
              </span>
              <ChevronRight size={14} className="text-gray-300" />
            </button>
            {subMenu === 'layers' && (
              <div 
                className="absolute left-[calc(100%-8px)] top-[-8px] bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 px-1.5 min-w-[200px] animate-in fade-in slide-in-from-left-1 duration-150"
                onMouseLeave={() => setSubMenu(null)}
              >
                <button onClick={() => bringForward(canvas)} className={subItemClass}>
                  <span className="flex items-center gap-3 font-medium">
                    <ArrowUp size={16} className={iconClass} />
                    Bring forward
                  </span>
                  <span className={shortcutClass}>Ctrl+]</span>
                </button>
                <button onClick={() => bringToFront(canvas)} className={subItemClass}>
                  <span className="flex items-center gap-3 font-medium">
                    <ChevronsUp size={16} className={iconClass} />
                    Bring to front
                  </span>
                  <span className={shortcutClass}>Ctrl+Alt+]</span>
                </button>
                <button onClick={() => sendBackward(canvas)} className={subItemClass}>
                  <span className="flex items-center gap-3 font-medium">
                    <ArrowDown size={16} className={iconClass} />
                    Send backward
                  </span>
                  <span className={shortcutClass}>Ctrl+[</span>
                </button>
                <button onClick={() => sendToBack(canvas)} className={subItemClass}>
                  <span className="flex items-center gap-3 font-medium">
                    <ChevronsDown size={16} className={iconClass} />
                    Send to back
                  </span>
                  <span className={shortcutClass}>Ctrl+Alt+[</span>
                </button>
                <div className="h-px bg-gray-100/80 my-1.5 mx-2" />
                <button onClick={() => setLeftPanel('layers')} className={subItemClass}>
                  <span className="flex items-center gap-3 font-medium">
                    <Layers size={16} className={iconClass} />
                    Show layers
                  </span>
                  <span className={shortcutClass}>Alt+1</span>
                </button>
              </div>
            )}
          </div>

          {/* Align Submenu */}
          <div className="relative">
            <button
              onMouseEnter={() => setSubMenu('align')}
              className={itemClass}
            >
              <span className="flex items-center gap-3 font-medium">
                <AlignLeft size={16} className={iconClass} />
                Align to page
              </span>
              <ChevronRight size={14} className="text-gray-300" />
            </button>
            {subMenu === 'align' && (
              <div 
                className="absolute left-[calc(100%-8px)] top-[-8px] bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 px-1.5 min-w-[150px] animate-in fade-in slide-in-from-left-1 duration-150"
                onMouseLeave={() => setSubMenu(null)}
              >
                <button onClick={() => alignLeft(canvas)} className={subItemClass}>
                  <span className="flex items-center gap-3 font-medium">
                    <AlignLeft size={16} className={iconClass} />
                    Left
                  </span>
                </button>
                <button onClick={() => alignCenterHorizontal(canvas)} className={subItemClass}>
                  <span className="flex items-center gap-3 font-medium">
                    <AlignCenter size={16} className={iconClass} />
                    Center
                  </span>
                </button>
                <button onClick={() => alignRight(canvas)} className={subItemClass}>
                  <span className="flex items-center gap-3 font-medium">
                    <AlignRight size={16} className={iconClass} />
                    Right
                  </span>
                </button>
                <div className="h-px bg-gray-100/80 my-1.5 mx-2" />
                <button onClick={() => alignTop(canvas)} className={subItemClass}>
                  <span className="flex items-center gap-3 font-medium">
                    <AlignTop size={16} className={iconClass} />
                    Top
                  </span>
                </button>
                <button onClick={() => alignCenterVertical(canvas)} className={subItemClass}>
                  <span className="flex items-center gap-3 font-medium">
                    <AlignCenter size={16} className={iconClass} />
                    Middle
                  </span>
                </button>
                <button onClick={() => alignBottom(canvas)} className={subItemClass}>
                  <span className="flex items-center gap-3 font-medium">
                    <AlignBottom size={16} className={iconClass} />
                    Bottom
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-100/80 my-1.5 mx-2" />

          <button onClick={() => flipHorizontal(canvas)} className={itemClass}>
            <span className="flex items-center gap-3 font-medium">
              <FlipHorizontal size={16} className={iconClass} />
              Flip Horizontal
            </span>
          </button>

          <button onClick={() => flipVertical(canvas)} className={itemClass}>
            <span className="flex items-center gap-3 font-medium">
              <FlipVertical size={16} className={iconClass} />
              Flip Vertical
            </span>
          </button>

          <div className="h-px bg-gray-100/80 my-1.5 mx-2" />

          <button onClick={() => toggleLock(canvas, activeObject)} className={itemClass}>
            <span className="flex items-center gap-3 font-medium">
              {isLocked ? <Unlock size={16} className={iconClass} /> : <Lock size={16} className={iconClass} />}
              {isLocked ? 'Unlock' : 'Lock'}
            </span>
            <span className={shortcutClass}>Alt+Shift+L</span>
          </button>
        </div>
      )}
    </div>
  )
}
