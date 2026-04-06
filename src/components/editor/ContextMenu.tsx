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
  FlipHorizontal,
  FlipVertical,
  MoreHorizontal,
  Clipboard,
  Paintbrush,
  CopyPlus,
  Unlock,
  Boxes,
  Ungroup,
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
  groupSelected,
  ungroupSelected,
} from '@/lib/editor/fabricUtils'

interface MenuPos {
  x: number
  y: number
}

type SubMenuType = 'layers' | 'align' | null

export default function ContextMenu() {
  const canvas = useEditorStore((s) => s.canvas)
  const activeObject = useEditorStore((s) => s.activeObject)
  const setLeftPanel = useEditorStore((s) => s.setLeftPanel)
  const refreshObjects = useEditorStore((s) => s.refreshObjects)
  const [pos, setPos] = useState<MenuPos | null>(null)
  const [subMenu, setSubMenu] = useState<SubMenuType>(null)
  const [tick, setTick] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setPos(null)
    setSubMenu(null)
  }, [])

  useEffect(() => {
    if (!canvas) return

    const canvasEl = canvas.getElement?.()
    if (!canvasEl) return

    const container = canvasEl.parentElement?.parentElement
    if (!container) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      // Use store's activeObject if it exists (handles locked objects)
      const target = activeObject || canvas.getActiveObject()
      
      if (!target) {
        close()
        return
      }

      // Simple overflow check - if near right or bottom edge, shift menu
      let x = e.clientX
      let y = e.clientY
      const winW = window.innerWidth
      const winH = window.innerHeight
      
      if (x + 240 > winW) x -= 240
      if (y + 350 > winH) y -= 350

      setPos({ x, y })
      setSubMenu(null)
    }

    container.addEventListener('contextmenu', handleContextMenu)
    return () => container.removeEventListener('contextmenu', handleContextMenu)
  }, [canvas, activeObject, close])

  // Close on outside click
  useEffect(() => {
    if (!pos) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handleClick)
    window.addEventListener('wheel', close, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('wheel', close)
    }
  }, [pos, close])

  // Close on selection change
  useEffect(() => {
    if (!canvas) return
    canvas.on('selection:cleared', close)
    return () => {
      canvas.off('selection:cleared', close)
    }
  }, [canvas, close])

  // Update on object modification
  useEffect(() => {
    if (!canvas) return
    const handler = () => setTick(prev => prev + 1)
    canvas.on('object:modified', handler)
    return () => {
      canvas.off('object:modified', handler)
    }
  }, [canvas])

  if (!pos || !canvas) return null

  const doAction = (fn: () => void) => {
    fn()
    close()
  }

  const itemClass =
    'flex items-center justify-between w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-md group whitespace-nowrap'
  const subItemClass =
    'flex items-center justify-between w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-md whitespace-nowrap'
  const shortcutClass = 'text-[9px] text-gray-400 font-semibold bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded uppercase tracking-tighter'
  const iconClass = 'text-gray-400 group-hover:text-gray-600 transition-colors'

  const isLocked = activeObject?.selectable === false

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 px-1.5 min-w-[230px] animate-in fade-in zoom-in duration-150"
      style={{ left: pos.x, top: pos.y }}
    >
      <button onClick={() => doAction(() => copyToClipboard(canvas))} className={itemClass}>
        <span className="flex items-center gap-3 font-medium">
          <Copy size={16} className={iconClass} />
          Copy
        </span>
        <span className={shortcutClass}>Ctrl+C</span>
      </button>

      <button onClick={() => doAction(() => copyStyle(canvas))} className={itemClass}>
        <span className="flex items-center gap-3 font-medium">
          <Paintbrush size={16} className={iconClass} />
          Copy style
        </span>
        <span className={shortcutClass}>Ctrl+Alt+C</span>
      </button>

      <button onClick={() => doAction(() => pasteFromClipboard(canvas))} className={itemClass}>
        <span className="flex items-center gap-3 font-medium">
          <Clipboard size={16} className={iconClass} />
          Paste
        </span>
        <span className={shortcutClass}>Ctrl+V</span>
      </button>

      <button onClick={() => doAction(() => { duplicateSelected(canvas); refreshObjects() })} className={itemClass}>
        <span className="flex items-center gap-3 font-medium">
          <CopyPlus size={16} className={iconClass} />
          Duplicate
        </span>
        <span className={shortcutClass}>Ctrl+D</span>
      </button>

      {activeObject?.type === 'activeSelection' && (
        <button onClick={() => doAction(() => { groupSelected(canvas); refreshObjects() })} className={itemClass}>
          <span className="flex items-center gap-3 font-medium">
            <Boxes size={16} className={iconClass} />
            Group
          </span>
          <span className={shortcutClass}>Ctrl+G</span>
        </button>
      )}

      {activeObject?.type === 'group' && (
        <button onClick={() => doAction(() => { ungroupSelected(canvas); refreshObjects() })} className={itemClass}>
          <span className="flex items-center gap-3 font-medium">
            <Ungroup size={16} className={iconClass} />
            Ungroup
          </span>
          <span className={shortcutClass}>Ctrl+Shift+G</span>
        </button>
      )}

      <button onClick={() => doAction(() => { deleteSelected(canvas); refreshObjects() })} className={itemClass}>
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
            className="absolute left-[calc(100%-8px)] top-[-8px] bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 px-1.5 min-w-[240px] animate-in fade-in slide-in-from-left-1 duration-150"
            onMouseLeave={() => setSubMenu(null)}
          >
            <button 
              onClick={() => doAction(() => { bringForward(canvas); refreshObjects() })} 
              className={subItemClass}
            >
              <span className="flex items-center gap-3 font-medium text-xs lg:text-sm">
                <ArrowUp size={16} className={iconClass} />
                Bring forward
              </span>
              <span className={shortcutClass}>Ctrl+]</span>
            </button>
            <button 
              onClick={() => doAction(() => { bringToFront(canvas); refreshObjects() })} 
              className={subItemClass}
            >
              <span className="flex items-center gap-3 font-medium text-xs lg:text-sm">
                <ChevronsUp size={16} className={iconClass} />
                Bring to front
              </span>
              <span className={shortcutClass}>Ctrl+Alt+]</span>
            </button>
            <button 
              onClick={() => doAction(() => { sendBackward(canvas); refreshObjects() })} 
              className={subItemClass}
            >
              <span className="flex items-center gap-3 font-medium text-xs lg:text-sm">
                <ArrowDown size={16} className={iconClass} />
                Send backward
              </span>
              <span className={shortcutClass}>Ctrl+[</span>
            </button>
            <button 
              onClick={() => doAction(() => { sendToBack(canvas); refreshObjects() })} 
              className={subItemClass}
            >
              <span className="flex items-center gap-3 font-medium text-xs lg:text-sm">
                <ChevronsDown size={16} className={iconClass} />
                Send to back
              </span>
              <span className={shortcutClass}>Ctrl+Alt+[</span>
            </button>
            <div className="h-px bg-gray-100/80 my-1.5 mx-2" />
            <button onClick={() => doAction(() => setLeftPanel('layers'))} className={subItemClass}>
              <span className="flex items-center gap-3 font-medium text-xs lg:text-sm">
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
            <button onClick={() => doAction(() => alignLeft(canvas))} className={subItemClass}>
              <span className="flex items-center gap-3 font-medium">
                <AlignLeft size={16} className={iconClass} />
                Left
              </span>
            </button>
            <button onClick={() => doAction(() => alignCenterHorizontal(canvas))} className={subItemClass}>
              <span className="flex items-center gap-3 font-medium">
                <AlignCenter size={16} className={iconClass} />
                Center
              </span>
            </button>
            <button onClick={() => doAction(() => alignRight(canvas))} className={subItemClass}>
              <span className="flex items-center gap-3 font-medium">
                <AlignRight size={16} className={iconClass} />
                Right
              </span>
            </button>
            <div className="h-px bg-gray-100/80 my-1.5 mx-2" />
            <button onClick={() => doAction(() => alignTop(canvas))} className={subItemClass}>
              <span className="flex items-center gap-3 font-medium">
                <AlignTop size={16} className={iconClass} />
                Top
              </span>
            </button>
            <button onClick={() => doAction(() => alignCenterVertical(canvas))} className={subItemClass}>
              <span className="flex items-center gap-3 font-medium">
                <AlignCenter size={16} className={iconClass} />
                Middle
              </span>
            </button>
            <button onClick={() => doAction(() => alignBottom(canvas))} className={subItemClass}>
              <span className="flex items-center gap-3 font-medium">
                <AlignBottom size={16} className={iconClass} />
                Bottom
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="h-px bg-gray-100/80 my-1.5 mx-2" />

      <button onClick={() => doAction(() => toggleLock(canvas, activeObject || undefined))} className={itemClass}>
        <span className="flex items-center gap-3 font-medium">
          {isLocked ? (
            <>
              <Unlock size={16} className={iconClass} />
              Unlock
            </>
          ) : (
            <>
              <Lock size={16} className={iconClass} />
              Lock
            </>
          )}
        </span>
        <span className={shortcutClass}>Alt+Shift+L</span>
      </button>
    </div>
  )
}
