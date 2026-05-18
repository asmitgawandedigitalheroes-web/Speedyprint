import { redirect } from 'next/navigation'

// /account/sign-up is an alias — canonical signup is at /register
export default function AccountSignUpPage() {
  redirect('/register')
}
