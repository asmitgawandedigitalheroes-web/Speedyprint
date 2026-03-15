'use client'

import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/lib/designer/store'
import { cn } from '@/lib/utils'

export function ContextMenu() {
  const contextMenu = useEditorStore((s) => s.contextMenu)
  const closeContextMenu = useEditorStore((s) => s.closeContextMenu)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside or Escape
  useEffect(() => {
    if (!contextMenu) return

    const handleClick = () => closeContextMenu()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextMenu()
    }

    // Delay to prevent immediate close from the same right-click
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClick)
      window.addEventListener('contextmenu', handleClick)
      window.addEventListener('keydown', handleKeyDown)
    }, 0)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('contextmenu', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu, closeContextMenu])

  // Adjust position to stay within viewport
  useEffect(() => {
    if (!contextMenu || !menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let adjustedX = contextMenu.x
    let adjustedY = contextMenu.y

    if (adjustedX + rect.width > vw) {
      adjustedX = vw - rect.width - 8
    }
    if (adjustedY + rect.height > vh) {
      adjustedY = vh - rect.height - 8
    }

    menu.style.left = `${adjustedX}px`
    menu.style.top = `${adjustedY}px`
  }, [contextMenu])

  if (!contextMenu) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] min-w-[180px] rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {contextMenu.items.map((item, idx) => {
        if (item.separator) {
          return <div key={`sep-${idx}`} className="my-1 h-px bg-border" />
        }

        return (
          <button
            key={`${item.label}-${idx}`}
            type="button"
            disabled={item.disabled}
            className={cn(
              'flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm',
              'hover:bg-accent hover:text-accent-foreground',
              'disabled:pointer-events-none disabled:opacity-50',
              'focus:bg-accent focus:text-accent-foreground focus:outline-none'
            )}
            onClick={() => {
              item.action()
              closeContextMenu()
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="ml-4 text-xs text-muted-foreground">
                {item.shortcut}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
