'use client'

import { type ReactNode, useEffect } from 'react'
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
  const toggleLeftPanel = useEditorStore((s) => s.toggleLeftPanel)
  const toggleRightPanel = useEditorStore((s) => s.toggleRightPanel)

  // Close both panels on mobile screens by default
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      useEditorStore.setState({ showLeftPanel: false, showRightPanel: false })
    }
  }, [])

  return (
    <div className={cn('flex h-screen flex-col overflow-hidden', className)}>
      {/* Top Bar */}
      <div className="flex h-12 shrink-0 items-center border-b bg-background z-10">
        {topBar}
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left Panel */}
        {/* Mobile overlay (shown when panel toggled open) */}
        {showLeftPanel && (
          <>
            <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={toggleLeftPanel} />
            <div className="fixed left-0 top-12 bottom-0 w-[280px] bg-background border-r z-30 lg:hidden overflow-y-auto">
              {leftPanel}
            </div>
          </>
        )}
        {/* Desktop panel (always in flex flow; hidden when panel closed) */}
        <div className={cn(
          'shrink-0 overflow-hidden border-r bg-background flex',
          showLeftPanel ? 'hidden lg:flex lg:w-[280px]' : 'hidden'
        )}>
          {leftPanel}
        </div>

        {/* Canvas Workspace — takes all remaining space */}
        <div
          className="flex flex-1 flex-col overflow-hidden bg-[#f0f0f0]"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        >
          {canvas}
        </div>

        {/* Right Panel */}
        {/* Mobile overlay (shown when panel toggled open) */}
        {showRightPanel && (
          <>
            <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={toggleRightPanel} />
            <div className="fixed right-0 top-12 bottom-0 w-[300px] bg-background border-l z-30 lg:hidden overflow-y-auto">
              {rightPanel}
            </div>
          </>
        )}
        {/* Desktop panel (always in flex flow; hidden when panel closed) */}
        <div className={cn(
          'shrink-0 overflow-hidden border-l bg-background flex',
          showRightPanel ? 'hidden lg:flex lg:w-[300px]' : 'hidden'
        )}>
          {rightPanel}
        </div>

      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Context Menu (floating) */}
      <ContextMenu />
    </div>
  )
}
