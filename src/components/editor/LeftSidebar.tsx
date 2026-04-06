'use client'

import { useState } from 'react'
import {
  Gem,
  LayoutTemplate,
  Type,
  Shapes,
  FolderOpen,
  Sparkles,
  Layers,
  Database,
  CheckCircle2,
  X,
  Pencil,
} from 'lucide-react'
import MaterialsPanel from './left-panels/MaterialsPanel'
import TemplatesPanel from './left-panels/TemplatesPanel'
import TextPanel from './left-panels/TextPanel'
import AddPanel from './left-panels/AddPanel'
import MyUploadsPanel from './left-panels/MyUploadsPanel'
import AICreationPanel from './left-panels/AICreationPanel'
import DrawPanel from '@/components/editor/left-panels/DrawPanel'
import LayersPanel from './LayersPanel'
import BulkCreatePanel from './left-panels/BulkCreatePanel'
import FinishPanel from './left-panels/FinishPanel'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { useIsMobile } from '@/hooks/useIsMobile'

export type LeftTab = 'material' | 'template' | 'text' | 'draw' | 'add' | 'my' | 'ai' | 'layers' | 'bulk' | 'complete'

interface TabDef {
  id: LeftTab
  label: string
  icon: React.ReactNode
  group: 'tools' | 'utility'
}

const TABS: TabDef[] = [
  { id: 'material', label: 'Elements', icon: <Gem size={18} />, group: 'tools' },
  { id: 'template', label: 'Template', icon: <LayoutTemplate size={18} />, group: 'tools' },
  { id: 'draw', label: 'Draw', icon: <Pencil size={18} />, group: 'tools' },
  { id: 'text', label: 'Text', icon: <Type size={18} />, group: 'tools' },
  { id: 'add', label: 'Add', icon: <Shapes size={18} />, group: 'tools' },
  { id: 'my', label: 'My', icon: <FolderOpen size={18} />, group: 'utility' },
  // { id: 'ai', label: 'AI', icon: <Sparkles size={18} />, group: 'utility' },
  { id: 'layers', label: 'Layers', icon: <Layers size={18} />, group: 'utility' },
  { id: 'bulk', label: 'Bulk', icon: <Database size={18} />, group: 'utility' },
  { id: 'complete', label: 'Complete', icon: <CheckCircle2 size={18} />, group: 'utility' },
]



const PANEL_MAP: Record<LeftTab, React.ReactNode> = {
  material: <MaterialsPanel />,
  template: <TemplatesPanel />,
  text: <TextPanel />,
  draw: <DrawPanel />,
  add: <AddPanel />,
  my: <MyUploadsPanel />,
  ai: <AICreationPanel />,
  layers: <LayersPanel />,
  bulk: <BulkCreatePanel />,
  complete: <FinishPanel />,
}

export default function LeftSidebar() {
  const activeTab = useEditorStore((s) => s.leftPanel) as LeftTab | null
  const setLeftPanel = useEditorStore((s) => s.setLeftPanel)
  const isMobile = useIsMobile()

  const handleTabClick = (tab: LeftTab) => {
    setLeftPanel(activeTab === tab ? null : tab as any)
  }

  const toolTabs = TABS.filter((t) => t.group === 'tools')
  const utilTabs = TABS.filter((t) => t.group === 'utility')

  return (
    <div className="flex flex-col h-full bg-ed-surface">
      {/* Mobile-only header with Close button */}
      {isMobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-ed-border bg-white sticky top-0 z-10">
          <span className="text-sm font-bold uppercase tracking-widest text-ed-text-dim">
            {TABS.find(t => t.id === activeTab)?.label || 'Design Tools'}
          </span>
          <button 
            onClick={() => setLeftPanel(null)}
            className="p-1.5 hover:bg-ed-surface-hover rounded-full text-ed-text-dim transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Icon rail - show on mobile too per user request */}
      <div className="w-14 bg-ed-bg border-r border-ed-border flex flex-col items-center py-2 gap-0.5 flex-shrink-0">
        {toolTabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              title={tab.label}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-10 h-10 rounded-lg transition-all ${
                isActive
                  ? 'bg-ed-accent/15 text-ed-accent'
                  : 'text-ed-text-dim hover:bg-ed-surface-hover hover:text-ed-text-muted'
              }`}
            >
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-ed-accent" />}
              {tab.icon}
              <span className="text-[8px] font-medium leading-tight">{tab.label}</span>
            </button>
          )
        })}

        {/* Divider between tool groups */}
        <div className="h-px w-7 bg-ed-border my-1" />

        {utilTabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              title={tab.label}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-10 h-10 rounded-lg transition-all ${
                isActive
                  ? 'bg-ed-accent/15 text-ed-accent'
                  : 'text-ed-text-dim hover:bg-ed-surface-hover hover:text-ed-text-muted'
              }`}
            >
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-ed-accent" />}
              {tab.icon}
              <span className="text-[8px] font-medium leading-tight">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Expandable content panel */}
      <div
        className={`bg-ed-surface border-r border-ed-border overflow-hidden transition-all duration-200 ease-out ${
          isMobile ? (activeTab ? 'w-full' : 'w-0') : activeTab ? 'w-72' : 'w-0'
        }`}
      >
        {activeTab && (
          <div className={`${isMobile ? 'w-full' : 'w-72'} h-full overflow-y-auto overflow-x-hidden`}>
            {PANEL_MAP[activeTab]}
          </div>
        )}
      </div>
    </div>
  </div>
  )
}
