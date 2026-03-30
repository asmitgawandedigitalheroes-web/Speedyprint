/* Root layout for the dashboard route group.
   Intentionally minimal — no site header, footer, or WhatsApp widget.
   The (main) layout handles the public-facing site;
   this layout handles the authenticated user panel. */
export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
