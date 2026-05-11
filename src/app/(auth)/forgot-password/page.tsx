import { redirect } from 'next/navigation'

// /forgot-password is an alias for /reset-password
export default function ForgotPasswordPage() {
  redirect('/reset-password')
}
