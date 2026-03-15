'use client'

import { type ReactNode } from 'react'
import { useEditorStore } from '@/lib/designer/store'
import { StatusBar } from './StatusBar'
import { ContextMenu } from './ContextMenu'
import { cn } from '@/lib/utils'

interface EditorLayoutProps {
  /** Top bar content (back button, design name, save/export/cart actions) */
  topBar: ReactNode
  /** Left panel content (toolbar tabs) */
  leftPanel: ReactNode
  /** Canvas workspace content */
  canvas: ReactNode
  /** Right panel content (properties panel) */
  rightPanel: ReactNode
  /** Optional class for the root element */
  className?: string
}

/**
 * EditorLayout — Full-screen 5-region layout for the design editor.
 *
 * ┌──────────────────────────────────────────┐
 * │              TopBar (48px)               │
 * ├────────┬─────────────────────┬───────────┤
 * │ Left   │                     │  Right    │
 * │ Panel  │   Canvas Workspace  │  Panel    │
 * │(280px) │                     │  (300px)  │
 * ├────────┴─────────────────────┴───────────┤
 * │           StatusBar (32px)               │
 * └──────────────────────────────────────────┘
 */
export function EditorLayout({
  topBar,
  leftPanel,
  canvas,
  rightPanel,
  className,
}: EditorLayoutProps) {
  const showLeftPanel = useEditorStore((s) => s.showLeftPanel)
  const showRightPanel = useEditorStore((s) => s.showRightPanel)

  return (
    <div className={cn('flex h-screen flex-col overflow-hidden', className)}>
      {/* Top Bar */}
      <div className="flex h-12 shrink-0 items-center border-b bg-background">
        {topBar}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        {showLeftPanel && (
          <div className="w-[280px] shrink-0 overflow-y-auto border-r bg-background">
            {leftPanel}
          </div>
        )}

        {/* Canvas Workspace */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {canvas}
        </div>

        {/* Right Panel */}
        {showRightPanel && (
          <div className="w-[300px] shrink-0 overflow-y-auto border-l bg-background">
            {rightPanel}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Context Menu (floating) */}
      <ContextMenu />
    </div>
  )
}
