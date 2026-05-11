import { redirect } from 'next/navigation'

// /designer with no template ID → send users to the templates picker
export default function DesignerRootPage() {
  redirect('/templates')
}
