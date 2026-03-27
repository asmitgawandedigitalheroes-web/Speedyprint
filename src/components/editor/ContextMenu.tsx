'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  AlignCenter,
  Layers,
  Copy,
  Trash2,
  FlipHorizontal2,
  FlipVertical2,
  Lock,
  ChevronRight,
  ChevronsUp,
  ChevronsDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import {
  duplicateSelected,
  deleteSelected,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  flipHorizontal,
  flipVertical,
  centerOnArtboard,
  toggleLock,
} from '@/lib/editor/fabricUtils'

interface MenuPos {
  x: number
  y: number
}

export default function ContextMenu() {
  const canvas = useEditorStore((s) => s.canvas)
  const [pos, setPos] = useState<MenuPos | null>(null)
  const [subMenu, setSubMenu] = useState<'layers' | 'flip' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setPos(null)
    setSubMenu(null)
  }, [])

  useEffect(() => {
    if (!canvas) return

    const container = canvas.getElement().parentElement?.parentElement
    if (!container) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      const active = canvas.getActiveObject()
      if (!active) {
        close()
        return
      }
      const rect = container.getBoundingClientRect()
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      setSubMenu(null)
    }

    container.addEventListener('contextmenu', handleContextMenu)
    return () => container.removeEventListener('contextmenu', handleContextMenu)
  }, [canvas, close])

  // Close on outside click
  useEffect(() => {
    if (!pos) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pos, close])

  // Close on selection change
  useEffect(() => {
    if (!canvas) return
    canvas.on('selection:cleared', close)
    canvas.on('selection:updated', close)
    return () => {
      canvas.off('selection:cleared', close)
      canvas.off('selection:updated', close)
    }
  }, [canvas, close])

  if (!pos || !canvas) return null

  const doAction = (fn: () => void) => {
    fn()
    close()
  }

  const itemClass =
    'flex items-center justify-between w-full px-3 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors rounded-md'
  const subItemClass =
    'flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-200 hover:bg-white/10 transition-colors rounded-md'

  return (
    <div
      ref={menuRef}
      className="absolute z-40 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 px-1.5 min-w-[220px]"
      style={{ left: pos.x, top: pos.y }}
    >
      <button onClick={() => doAction(() => centerOnArtboard(canvas))} className={itemClass}>
        <span className="flex items-center gap-2">
          <AlignCenter size={14} />
          center horizontally and vertically
        </span>
      </button>

      {/* Layer management submenu */}
      <div className="relative">
        <button
          onClick={() => setSubMenu((s) => (s === 'layers' ? null : 'layers'))}
          className={itemClass}
        >
          <span className="flex items-center gap-2">
            <Layers size={14} />
            layer management
          </span>
          <ChevronRight size={14} />
        </button>
        {subMenu === 'layers' && (
          <div className="absolute left-full top-0 ml-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 px-1.5 min-w-[180px]">
            <button onClick={() => doAction(() => bringToFront(canvas))} className={subItemClass}>
              <ChevronsUp size={14} /> Bring to Front
            </button>
            <button onClick={() => doAction(() => bringForward(canvas))} className={subItemClass}>
              <ArrowUp size={14} /> Bring Forward
            </button>
            <button onClick={() => doAction(() => sendBackward(canvas))} className={subItemClass}>
              <ArrowDown size={14} /> Send Backward
            </button>
            <button onClick={() => doAction(() => sendToBack(canvas))} className={subItemClass}>
              <ChevronsDown size={14} /> Send to Back
            </button>
          </div>
        )}
      </div>

      <button onClick={() => doAction(() => duplicateSelected(canvas))} className={itemClass}>
        <span className="flex items-center gap-2">
          <Copy size={14} />
          copy
        </span>
        <span className="text-xs text-gray-500">Ctrl+C/V</span>
      </button>

      <button onClick={() => doAction(() => deleteSelected(canvas))} className={itemClass}>
        <span className="flex items-center gap-2">
          <Trash2 size={14} />
          delete
        </span>
        <span className="text-xs text-gray-500">DEL</span>
      </button>

      {/* Flip submenu */}
      <div className="relative">
        <button
          onClick={() => setSubMenu((s) => (s === 'flip' ? null : 'flip'))}
          className={itemClass}
        >
          <span className="flex items-center gap-2">
            <FlipHorizontal2 size={14} />
            flip
          </span>
          <ChevronRight size={14} />
        </button>
        {subMenu === 'flip' && (
          <div className="absolute left-full top-0 ml-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 px-1.5 min-w-[160px]">
            <button onClick={() => doAction(() => flipHorizontal(canvas))} className={subItemClass}>
              <FlipHorizontal2 size={14} /> Flip Horizontal
            </button>
            <button onClick={() => doAction(() => flipVertical(canvas))} className={subItemClass}>
              <FlipVertical2 size={14} /> Flip Vertical
            </button>
          </div>
        )}
      </div>

      <button onClick={() => doAction(() => toggleLock(canvas))} className={itemClass}>
        <span className="flex items-center gap-2">
          <Lock size={14} />
          lock
        </span>
      </button>
    </div>
  )
}
