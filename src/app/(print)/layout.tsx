/**
 * Minimal layout for print/invoice pages — no dashboard sidebar or header.
 * Renders children directly so print pages look clean.
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
