/**
 * Dedicated layout for the designer editor.
 * Uses fixed positioning to overlay the entire viewport,
 * effectively hiding the parent (main) layout's header, footer,
 * and WhatsApp button for a full-screen editing experience.
 */
export default function DesignerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[100] h-screen w-screen overflow-hidden bg-background">
      {children}
    </div>
  )
}
