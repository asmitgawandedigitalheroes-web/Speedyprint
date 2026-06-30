'use client'

import { useParams, useSearchParams } from 'next/navigation'
import EditorShell from '@/components/editor/EditorShell'

/**
 * /designer/[templateId]?design=[designId]
 *
 * Opens the design editor for a specific product template.
 * If a design query param is provided, the saved design is loaded onto the canvas.
 */
export default function DesignerPage() {
  const params = useParams<{ templateId: string }>()
  const searchParams = useSearchParams()

  const templateId = params.templateId
  const designId = searchParams.get('design') ?? undefined
  const mode = searchParams.get('mode') ?? undefined

  return <EditorShell templateId={templateId} designId={designId} mode={mode as 'upload'} />
}
