'use client'

import { use } from 'react'
import EditorShell from '@/components/editor/EditorShell'

interface DesignerPageProps {
  params: Promise<{ templateId: string }>
  searchParams: Promise<{ design?: string }>
}

/**
 * /designer/[templateId]?design=[designId]
 *
 * Opens the design editor for a specific product template.
 * If a design query param is provided, the saved design is loaded onto the canvas.
 */
export default function DesignerPage({ params, searchParams }: DesignerPageProps) {
  const { templateId } = use(params)
  const { design: designId } = use(searchParams)

  return <EditorShell templateId={templateId} designId={designId} />
}
