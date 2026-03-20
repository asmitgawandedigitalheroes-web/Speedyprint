/**
 * One-time script to create the admin user for SpeedyPrint.
 * Run: node scripts/create-admin.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ADMIN_EMAIL = 'superadmin@speedyprint.com'
const ADMIN_PASSWORD = 'Test@1234#'
const ADMIN_NAME = 'Super Admin'

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`Creating admin user: ${ADMIN_EMAIL}`)

  // 1. Check if auth user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(
    (u) => u.email === ADMIN_EMAIL
  )

  let authUserId

  if (existingUser) {
    console.log(`Auth user already exists: ${existingUser.id}`)
    authUserId = existingUser.id
  } else {
    // 2. Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      })

    if (authError) {
      console.error('Failed to create auth user:', authError.message)
      process.exit(1)
    }

    authUserId = authData.user.id
    console.log(`Auth user created: ${authUserId}`)
  }

  // 3. Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', authUserId)
    .single()

  if (existingProfile) {
    if (existingProfile.role === 'admin') {
      console.log('Profile already exists with admin role. Done!')
      return
    }
    // Update role to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin', full_name: ADMIN_NAME })
      .eq('id', authUserId)

    if (updateError) {
      console.error('Failed to update profile:', updateError.message)
      process.exit(1)
    }
    console.log('Profile updated to admin role.')
  } else {
    // 4. Create profile with admin role
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authUserId,
      email: ADMIN_EMAIL,
      full_name: ADMIN_NAME,
      role: 'admin',
    })

    if (profileError) {
      console.error('Failed to create profile:', profileError.message)
      process.exit(1)
    }
    console.log('Profile created with admin role.')
  }

  console.log('\nAdmin user ready!')
  console.log(`  Email:    ${ADMIN_EMAIL}`)
  console.log(`  Password: ${ADMIN_PASSWORD}`)
  console.log(`  Role:     admin`)
  console.log(`\nLog in at: /login`)
}

main().catch(console.error)
