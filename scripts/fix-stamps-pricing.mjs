/**
 * Fix stamps pricing:
 *
 * Client's intended totals (ex VAT):
 *   Printer C20  (38mm × 14mm)  R234.78  setup R195
 *   Printer C30  (58mm × 22mm)  R285.22  setup R195
 *   Printer C40  (23mm × 59mm)  R338.70  setup R195
 *   Printer C50  (30mm × 69mm)  R434.78  setup R195
 *   Printer C60  (37mm × 76mm)  R471.74  setup R195
 *   Printer 55 Dater (40mm×60mm) R795.22 setup R195
 *   Printer R17  (17mm round)   R288.00  setup R195
 *   Mini Dater S160 (12mm×25mm) R378.26  setup R195
 *   Mini Dater S120 (4mm×22mm)  R128.70  NO setup fee
 *
 * Strategy:
 *   - Remove the blanket setup_fee rule from stamps (it's per-model, not blanket)
 *   - Remove the old minimum_order rule (legacy workaround)
 *   - Set quantity_break prices = total - R195 for models with setup
 *   - Mini Dater S120 stays at R128.70 (no setup)
 *   - Add individual setup_fee-like logic via the quantity_break total prices
 *     BUT keep a setup_fee rule at R195 so it shows in breakdown for all EXCEPT S120
 *
 * Simpler final approach:
 *   - Remove blanket setup_fee and minimum_order from stamps
 *   - Each model's quantity_break price = base (total - R195)
 *   - Add ONE setup_fee rule at R195 (applies to all sizes uniformly)
 *   - For Mini Dater S120: price stays at R128.70, but we accept it gets R195 setup...
 *     WAIT — client says S120 has N/A setup. So we cannot use a blanket setup_fee.
 *
 * FINAL approach:
 *   - Remove blanket setup_fee from stamps
 *   - Remove minimum_order from stamps
 *   - Each model price = the total the client wants (already includes setup in the price)
 *   - This keeps pricing simple: unit price IS the total for stamps
 *
 * Usage: node scripts/fix-stamps-pricing.mjs [--dry-run]
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
const DRY_RUN = process.argv.includes('--dry-run')

// Client's intended TOTAL prices (ex VAT) — these are the unit prices stored in DB
const STAMP_PRICES = [
  { size: '38mm × 14mm',  price: 234.78, desc: 'Printer C20' },
  { size: '58mm × 22mm',  price: 285.22, desc: 'Printer C30' },
  { size: '23mm × 59mm',  price: 338.70, desc: 'Printer C40' },
  { size: '30mm × 69mm',  price: 434.78, desc: 'Printer C50' },
  { size: '37mm × 76mm',  price: 471.74, desc: 'Printer C60' },
  { size: '40mm × 60mm',  price: 795.22, desc: 'Printer 55 Dater' },
  { size: '17mm round',   price: 288.00, desc: 'Printer R17' },
  { size: '12mm × 25mm',  price: 378.26, desc: 'Mini Dater S160' },
  { size: '4mm × 22mm',   price: 128.70, desc: 'Mini Dater S120 (no setup)' },
]

async function main() {
  const { data: g } = await sb.from('product_groups').select('id,name').eq('slug','self-inking-stamps').single()
  console.log(`Product group: ${g.name} (${g.id})\n`)

  const { data: rules } = await sb.from('pricing_rules').select('id,rule_type,price_value,conditions').eq('product_group_id', g.id)

  // 1. Delete setup_fee and minimum_order rules (stamps use flat per-model pricing)
  const toDelete = rules.filter(r => r.rule_type === 'setup_fee' || r.rule_type === 'minimum_order')
  console.log(`Removing ${toDelete.length} rule(s): setup_fee + minimum_order`)
  toDelete.forEach(r => console.log(`  DELETE [${r.rule_type}] R${r.price_value}`))

  if (!DRY_RUN && toDelete.length > 0) {
    const { error } = await sb.from('pricing_rules').delete().in('id', toDelete.map(r => r.id))
    if (error) { console.error('Delete failed:', error.message); process.exit(1) }
  }

  // 2. Update each quantity_break rule to the correct total price
  const qtyRules = rules.filter(r => r.rule_type === 'quantity_break')
  console.log(`\nUpdating ${qtyRules.length} quantity_break rule(s):`)

  for (const rule of qtyRules) {
    const cond = rule.conditions
    const match = STAMP_PRICES.find(s => s.size === cond.size)
    if (!match) {
      console.log(`  SKIP  size="${cond.size}" — not in price list`)
      continue
    }
    const old = rule.price_value
    const newPrice = match.price
    console.log(`  UPDATE "${match.desc}" (${match.size}): R${old} → R${newPrice}`)
    if (!DRY_RUN) {
      const { error } = await sb.from('pricing_rules').update({ price_value: newPrice }).eq('id', rule.id)
      if (error) { console.error(`  Failed: ${error.message}`); process.exit(1) }
    }
  }

  // 3. Insert any missing sizes
  const existingSizes = new Set(qtyRules.map(r => r.conditions.size))
  const missing = STAMP_PRICES.filter(s => !existingSizes.has(s.size))
  if (missing.length > 0) {
    console.log(`\nInserting ${missing.length} missing stamp size(s):`)
    for (const s of missing) {
      console.log(`  INSERT "${s.desc}" (${s.size}): R${s.price}`)
    }
    if (!DRY_RUN) {
      const toInsert = missing.map((s, i) => ({
        product_group_id: g.id,
        rule_type: 'quantity_break',
        conditions: { size: s.size, min_qty: 1, max_qty: 999999, discount_type: 'fixed_price', description: s.desc },
        price_value: s.price,
        currency: 'ZAR',
        is_active: true,
        display_order: 100 + i,
      }))
      const { error } = await sb.from('pricing_rules').insert(toInsert)
      if (error) { console.error('Insert failed:', error.message); process.exit(1) }
    }
  }

  console.log(`\n${DRY_RUN ? '[DRY RUN] No changes made.' : 'Done! Stamp pricing updated.'}`)
  console.log('\nExpected totals on website (ex VAT):')
  STAMP_PRICES.forEach(s => console.log(`  ${s.desc.padEnd(22)} R${s.price.toFixed(2)}`))
}

main()
