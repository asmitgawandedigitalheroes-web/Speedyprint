import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// /forgot-password is an alias for /reset-password
export default function ForgotPasswordPage() {
  redirect('/reset-password')
}
