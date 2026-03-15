'use client'

/**
 * ShortcutHelp — Modal listing all keyboard shortcuts grouped by category.
 * Triggered by `?` key or Help button.
 */

import { useEffect, useCallback } from 'react'
import { X, Keyboard } from 'lucide-react'

interface ShortcutGroup {
  title: string
  shortcuts: Array<{ keys: string; label: string }>
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: 'Ctrl+Z', label: 'Undo' },
      { keys: 'Ctrl+Y', label: 'Redo' },
      { keys: 'Ctrl+S', label: 'Save' },
      { keys: 'Ctrl+A', label: 'Select all' },
      { keys: 'Delete', label: 'Delete selected' },
      { keys: 'Escape', label: 'Deselect / Cancel' },
      { keys: '?', label: 'Show keyboard shortcuts' },
    ],
  },
  {
    title: 'Clipboard',
    shortcuts: [
      { keys: 'Ctrl+C', label: 'Copy' },
      { keys: 'Ctrl+V', label: 'Paste' },
      { keys: 'Ctrl+X', label: 'Cut' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: 'Ctrl++', label: 'Zoom in' },
      { keys: 'Ctrl+-', label: 'Zoom out' },
      { keys: 'Ctrl+0', label: 'Zoom to fit' },
      { keys: 'Scroll', label: 'Zoom (mouse wheel)' },
      { keys: 'Space+Drag', label: 'Pan canvas' },
    ],
  },
  {
    title: 'Object',
    shortcuts: [
      { keys: 'Ctrl+G', label: 'Group objects' },
      { keys: 'Ctrl+Shift+G', label: 'Ungroup objects' },
      { keys: 'Arrow Keys', label: 'Nudge 1px' },
      { keys: 'Shift+Arrow', label: 'Nudge 10px' },
    ],
  },
]

interface ShortcutHelpProps {
  open: boolean
  onClose: () => void
}

export function ShortcutHelp({ open, onClose }: ShortcutHelpProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex items-center justify-between rounded py-1.5 px-2 hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-600">{shortcut.label}</span>
                    <kbd className="inline-flex items-center gap-0.5">
                      {shortcut.keys.split('+').map((key, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-gray-300 mx-0.5">+</span>}
                          <span className="rounded bg-gray-100 border border-gray-200 px-1.5 py-0.5 text-xs font-mono text-gray-600">
                            {key}
                          </span>
                        </span>
                      ))}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 text-center text-xs text-gray-400 flex-shrink-0">
          Press <kbd className="rounded bg-gray-100 border px-1 text-xs font-mono">?</kbd> to toggle this panel
        </div>
      </div>
    </div>
  )
}
