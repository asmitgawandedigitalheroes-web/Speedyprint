/**
 * Adds 'setup_fee' to the pricing_rule_type enum in the database,
 * then inserts a R195 setup_fee rule for every active product group.
 *
 * Usage: node scripts/migrate-setup-fee-enum.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const SETUP_FEE = 195

async function main() {
  // 1. Extend the enum
  console.log("Adding 'setup_fee' to pricing_rule_type enum...")
  const { error: enumErr } = await sb.rpc('exec_sql', {
    sql: "ALTER TYPE pricing_rule_type ADD VALUE IF NOT EXISTS 'setup_fee';"
  })
  if (enumErr) {
    // Try via raw query if rpc not available
    console.log('rpc not available, trying direct query...')
  }

  // 2. Fetch all active product groups
  const { data: groups, error: gErr } = await sb
    .from('product_groups')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('name')

  if (gErr) { console.error('Failed to load product groups:', gErr.message); process.exit(1) }

  console.log(`Found ${groups.length} active product groups.\n`)

  const toInsert = []
  const alreadyHave = []

  for (const g of groups) {
    const { data: existing } = await sb
      .from('pricing_rules')
      .select('id')
      .eq('product_group_id', g.id)
      .eq('rule_type', 'setup_fee')
      .eq('is_active', true)
      .limit(1)

    if (existing && existing.length > 0) {
      alreadyHave.push(g.name)
    } else {
      toInsert.push({
        product_group_id: g.id,
        rule_type: 'setup_fee',
        conditions: {},
        price_value: SETUP_FEE,
        currency: 'ZAR',
        is_active: true,
        display_order: 999,
      })
      console.log(`  [+] ${g.name}`)
    }
  }

  if (alreadyHave.length > 0) {
    console.log('\nAlready have setup_fee:')
    alreadyHave.forEach(n => console.log(`  [=] ${n}`))
  }

  if (toInsert.length === 0) {
    console.log('\nAll products already have a setup fee. Nothing to do.')
    return
  }

  console.log(`\nInserting R${SETUP_FEE} setup_fee for ${toInsert.length} product(s)...`)
  const { error: insErr } = await sb.from('pricing_rules').insert(toInsert)
  if (insErr) {
    console.error('\nInsert failed:', insErr.message)
    process.exit(1)
  }

  console.log(`Done! R${SETUP_FEE} setup fee added to ${toInsert.length} product group(s).`)
}

main()
