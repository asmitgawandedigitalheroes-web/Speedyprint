/**
 * Pricing verification script — compares Supabase rules against Excel expected values.
 * Usage: node verify-pricing.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('G:/New folder (1)/New folder/Speedyprint/.env.local', 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// ── Calculator (ported from src/lib/pricing/calculator.ts) ──────────────────
function calculatePrice(rules, params) {
  const activeRules = rules.filter(r => r.is_active)
  let unitPrice = 0
  const quantity = params.quantity || 1
  const QTY_META_KEYS = new Set(['min_qty', 'max_qty', 'discount_type', 'description'])

  const quantityRules = activeRules
    .filter(r => r.rule_type === 'quantity_break')
    .sort((a, b) => ((a.conditions.min_qty ?? 0) - (b.conditions.min_qty ?? 0)))

  let appliedQtyBreak = null
  let appliedSpec = -1
  for (const rule of quantityRules) {
    const cond = rule.conditions
    const minQty = cond.min_qty ?? 0
    const maxQty = cond.max_qty ?? Infinity
    if (quantity < minQty || quantity > maxQty) continue
    const extraKeys = Object.keys(cond).filter(k => !QTY_META_KEYS.has(k))
    const extraMatch = extraKeys.every(k => String(params[k]) === String(cond[k]))
    if (!extraMatch) continue
    if (extraKeys.length >= appliedSpec) {
      appliedQtyBreak = rule
      appliedSpec = extraKeys.length
    }
  }

  const isFixedPrice = appliedQtyBreak !== null && appliedQtyBreak.conditions.discount_type !== 'percentage'

  if (isFixedPrice && appliedQtyBreak) {
    unitPrice = appliedQtyBreak.price_value
  } else {
    const baseRule = activeRules.filter(r => r.rule_type === 'base_price')
      .sort((a, b) => a.display_order - b.display_order)[0]
    if (baseRule) unitPrice = baseRule.price_value
  }

  // size_tier
  if (params.size) {
    const match = activeRules.filter(r => r.rule_type === 'size_tier')
      .find(r => r.conditions.size === params.size)
    if (match) unitPrice += match.price_value
  }

  // per_area_m2
  const widthMm = params.width_mm ? Number(params.width_mm) : null
  const heightMm = params.height_mm ? Number(params.height_mm) : null
  if (widthMm && heightMm) {
    const areaMm2 = widthMm * heightMm
    const totalM2 = (areaMm2 / 1_000_000) * quantity
    const AREA_META = new Set(['description', 'min_total_m2', 'max_total_m2'])
    const perAreaRule = activeRules.filter(r => r.rule_type === 'per_area_m2')
      .sort((a, b) => {
        const ak = Object.keys(a.conditions).filter(k => !AREA_META.has(k)).length
        const bk = Object.keys(b.conditions).filter(k => !AREA_META.has(k)).length
        return bk - ak
      })
      .find(r => {
        const cond = r.conditions
        if (cond.min_total_m2 !== undefined && totalM2 < cond.min_total_m2) return false
        if (cond.max_total_m2 !== undefined && totalM2 > cond.max_total_m2) return false
        return Object.entries(cond)
          .filter(([k]) => !AREA_META.has(k))
          .every(([k, v]) => String(params[k]) === String(v))
      })
    if (perAreaRule) {
      unitPrice = Math.round(perAreaRule.price_value * (areaMm2 / 1_000_000) * 100) / 100
    }
  }

  // material_addon
  if (params.material) {
    const match = activeRules.filter(r => r.rule_type === 'material_addon')
      .find(r => r.conditions.material === params.material)
    if (match) unitPrice += match.price_value
  }

  // finish_addon
  for (const rule of activeRules.filter(r => r.rule_type === 'finish_addon')) {
    const condKey = Object.keys(rule.conditions).find(k => k !== 'description')
    if (condKey && params[condKey] === rule.conditions[condKey]) {
      unitPrice += rule.price_value
      break
    }
  }

  // option_addon
  for (const rule of activeRules.filter(r => r.rule_type === 'option_addon')) {
    const condKey = Object.keys(rule.conditions)[0]
    if (condKey && params[condKey] === rule.conditions[condKey]) {
      unitPrice += rule.price_value
    }
  }

  unitPrice = Math.max(0, unitPrice)
  const realSubtotal = Math.round(unitPrice * quantity * 100) / 100
  const minimumRule = activeRules.find(r => r.rule_type === 'minimum_order')
  const minimumValue = minimumRule ? minimumRule.price_value : null
  const subtotal = minimumValue && realSubtotal < minimumValue ? minimumValue : realSubtotal

  return { unitPrice: Math.round(unitPrice * 100) / 100, subtotal, realSubtotal }
}

// ── Test runner ─────────────────────────────────────────────────────────────
let pass = 0, fail = 0

function check(label, got, expected, tolerance = 0.02) {
  const ok = Math.abs(got - expected) <= tolerance
  if (ok) {
    pass++
    // console.log('  ✓', label, got)
  } else {
    fail++
    console.log('  ✗', label)
    console.log('      got:', got, '  expected:', expected, '  diff:', Math.round((got-expected)*100)/100)
  }
  return ok
}

async function getRules(slug) {
  const { data: g } = await sb.from('product_groups').select('id').eq('slug', slug).single()
  const { data: rules } = await sb.from('pricing_rules').select('*').eq('product_group_id', g.id).eq('is_active', true)
  return rules
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n════════════════════════════════════════════════════')
console.log('  PRICING VERIFICATION vs EXCEL')
console.log('════════════════════════════════════════════════════\n')

// ── 1. BUSINESS CARDS ───────────────────────────────────────────────────────
console.log('── Business Cards ──')
{
  const rules = await getRules('business-cards')
  // SS no lam
  check('SS qty 50',   calculatePrice(rules,{quantity:50}).unitPrice,  2.50)
  check('SS qty 100',  calculatePrice(rules,{quantity:100}).unitPrice, 1.99)
  check('SS qty 250',  calculatePrice(rules,{quantity:250}).unitPrice, 0.85)
  check('SS qty 500',  calculatePrice(rules,{quantity:500}).unitPrice, 0.50)
  check('SS qty 1000', calculatePrice(rules,{quantity:1000}).unitPrice,0.32)
  // DS no lam
  check('DS qty 50',   calculatePrice(rules,{quantity:50,  print_option:'Full Colour Double Sided'}).unitPrice, 2.75)
  check('DS qty 100',  calculatePrice(rules,{quantity:100, print_option:'Full Colour Double Sided'}).unitPrice, 2.10)
  check('DS qty 250',  calculatePrice(rules,{quantity:250, print_option:'Full Colour Double Sided'}).unitPrice, 1.00)
  check('DS qty 500',  calculatePrice(rules,{quantity:500, print_option:'Full Colour Double Sided'}).unitPrice, 0.60)
  check('DS qty 1000', calculatePrice(rules,{quantity:1000,print_option:'Full Colour Double Sided'}).unitPrice, 0.39)
  // SS + Gloss lam (combined = base+addon)
  check('SS+Gloss lam qty 50',   calculatePrice(rules,{quantity:50,  lamination:'Gloss'}).unitPrice, 5.60)
  check('SS+Gloss lam qty 100',  calculatePrice(rules,{quantity:100, lamination:'Gloss'}).unitPrice, 4.59)
  check('SS+Gloss lam qty 250',  calculatePrice(rules,{quantity:250, lamination:'Gloss'}).unitPrice, 2.10)
  check('SS+Gloss lam qty 500',  calculatePrice(rules,{quantity:500, lamination:'Gloss'}).unitPrice, 1.22)
  check('SS+Gloss lam qty 1000', calculatePrice(rules,{quantity:1000,lamination:'Gloss'}).unitPrice, 0.835)
  // DS + Gloss lam
  check('DS+Gloss lam qty 50',   calculatePrice(rules,{quantity:50,  print_option:'Full Colour Double Sided',lamination:'Gloss'}).unitPrice, 6.55)
  check('DS+Gloss lam qty 100',  calculatePrice(rules,{quantity:100, print_option:'Full Colour Double Sided',lamination:'Gloss'}).unitPrice, 5.20)
  check('DS+Gloss lam qty 250',  calculatePrice(rules,{quantity:250, print_option:'Full Colour Double Sided',lamination:'Gloss'}).unitPrice, 2.45)
  check('DS+Gloss lam qty 1000', calculatePrice(rules,{quantity:1000,print_option:'Full Colour Double Sided',lamination:'Gloss'}).unitPrice, 1.01)
  // Finishing path (same prices, different param)
  check('SS+GlossLam (finishing) qty 50',  calculatePrice(rules,{quantity:50, finishing:'Gloss Lamination'}).unitPrice, 5.60)
  check('SS+MattLam (finishing) qty 100',  calculatePrice(rules,{quantity:100,finishing:'Matt Lamination'}).unitPrice, 4.59)
  // Spot UV addon
  check('SS+SpotUV qty 50', calculatePrice(rules,{quantity:50, finishing:'Spot UV'}).unitPrice, 2.50+0.80)
  // 400gsm material addon
  check('SS 400gsm qty 50', calculatePrice(rules,{quantity:50, material:'400gsm'}).unitPrice, 2.50+0.30)
  // Minimum order
  check('minimum order', calculatePrice(rules,{quantity:10}).subtotal, 195)
}

// ── 2. COFFEE CUP SLEEVES ───────────────────────────────────────────────────
console.log('\n── Coffee Cup Sleeves ──')
{
  const rules = await getRules('coffee-cup-sleeves')
  check('250W Colour qty 100',  calculatePrice(rules,{quantity:100, material:'250gsm White',       print_option:'Full Colour Single Sided'}).unitPrice, 1.813)
  check('250W Colour qty 500',  calculatePrice(rules,{quantity:500, material:'250gsm White',       print_option:'Full Colour Single Sided'}).unitPrice, 1.554)
  check('250W Colour qty 1000', calculatePrice(rules,{quantity:1000,material:'250gsm White',       print_option:'Full Colour Single Sided'}).unitPrice, 1.4504)
  check('250W Black  qty 100',  calculatePrice(rules,{quantity:100, material:'250gsm White',       print_option:'Black Single Sided'}).unitPrice,       0.973)
  check('250W Black  qty 500',  calculatePrice(rules,{quantity:500, material:'250gsm White',       print_option:'Black Single Sided'}).unitPrice,       0.834)
  check('250W Black  qty 1000', calculatePrice(rules,{quantity:1000,material:'250gsm White',       print_option:'Black Single Sided'}).unitPrice,       0.7784)
  check('Kraft Colour qty 100', calculatePrice(rules,{quantity:100, material:'Kraft Paper (Brown)',print_option:'Full Colour Single Sided'}).unitPrice, 1.96)
  check('Kraft Colour qty 500', calculatePrice(rules,{quantity:500, material:'Kraft Paper (Brown)',print_option:'Full Colour Single Sided'}).unitPrice, 1.68)
  check('Kraft Colour qty 1000',calculatePrice(rules,{quantity:1000,material:'Kraft Paper (Brown)',print_option:'Full Colour Single Sided'}).unitPrice, 1.568)
  check('Kraft Black  qty 100', calculatePrice(rules,{quantity:100, material:'Kraft Paper (Brown)',print_option:'Black Single Sided'}).unitPrice,       1.12)
  check('Kraft Black  qty 500', calculatePrice(rules,{quantity:500, material:'Kraft Paper (Brown)',print_option:'Black Single Sided'}).unitPrice,       0.96)
  check('Kraft Black  qty 1000',calculatePrice(rules,{quantity:1000,material:'Kraft Paper (Brown)',print_option:'Black Single Sided'}).unitPrice,       0.896)
  check('minimum order', calculatePrice(rules,{quantity:50,material:'250gsm White',print_option:'Full Colour Single Sided'}).subtotal, 195)
}

// ── 3. LARGE FORMAT UV LABELS ───────────────────────────────────────────────
// Area-based: unitPrice = rate × (w×h / 1e6) — we verify that
// Test at qty=1 so totalM2 = area of one label
// For a 500×500mm label, area = 0.25 m²
// For a 1000×1000mm label, area = 1 m² → totalM2 = 1 → tier 0-2m²
console.log('\n── Large Format UV Labels (per m²) ──')
{
  const rules = await getRules('large-format-uv-labels')
  // White Vinyl, 1000×1000mm, qty 1 → total=1m² → tier 0-2 → rate 383.69 → unitPrice = 383.69×1 = 383.69
  const test = (mat, po, wMm, hMm, qty, expectedRate) => {
    const areaM2 = wMm * hMm / 1_000_000
    const expectedUnit = Math.round(expectedRate * areaM2 * 100) / 100
    const res = calculatePrice(rules, {quantity:qty, material:mat, print_option:po, width_mm:wMm, height_mm:hMm})
    check(`${mat} | ${po} | ${wMm}×${hMm} qty${qty}`, res.unitPrice, expectedUnit, 0.05)
  }
  // White Vinyl Colour SS — tier 0-2m² (qty 1 of 1m² label = 1m² total)
  test('White Vinyl',       'Colour Single Sided',           1000,1000, 1, 383.69)
  // White Vinyl Colour+SpotGloss — tier 0-2m²
  test('White Vinyl',       'Colour + Spot Gloss',           1000,1000, 1, 508.69)
  // Grey Back Vinyl — tier 0-2m²
  test('Grey Back Vinyl',   'Colour Single Sided',           1000,1000, 1, 425.47)
  test('Grey Back Vinyl',   'Colour + Spot Gloss',           1000,1000, 1, 550.47)
  // Clear Vinyl — tier 0-2m²
  test('Clear Vinyl',       'Colour Single Sided',           1000,1000, 1, 415.52)
  test('Clear Vinyl',       'White Single Sided',            1000,1000, 1, 314.22)
  test('Clear Vinyl',       'Colour + White',                1000,1000, 1, 621.27)
  test('Clear Vinyl',       'Colour + White + Spot Gloss',  1000,1000, 1, 746.27)
  // Polylaser — tier 0-2m²
  test('Polylaser Adhesive','Colour Single Sided',           1000,1000, 1, 624.80)
  test('Polylaser Adhesive','Black Single Sided',            1000,1000, 1, 586.52)
  // Paper Adhesive — tier 0-2m²
  test('Paper Adhesive',    'Colour Single Sided',           1000,1000, 1, 160.99)
  test('Paper Adhesive',    'Black Single Sided',            1000,1000, 1, 134.45)
  // Tier change: qty 10 × 500×500mm = 2.5 m² total → tier 2-4m² → White Vinyl rate 361.97
  test('White Vinyl',       'Colour Single Sided',           500, 500, 10, 361.97)
  // Tier: qty 20 × 500×500mm = 5 m² total → tier 4-8m² → White Vinyl rate 336.57
  test('White Vinyl',       'Colour Single Sided',           500, 500, 20, 336.57)
}

// ── 4. RACE NUMBERS ─────────────────────────────────────────────────────────
console.log('\n── Race Numbers ──')
{
  const rules = await getRules('race-numbers')
  // TEX21 Standard (default, no size)
  check('TEX21 Std Colour qty 20',   calculatePrice(rules,{quantity:20,   material:'TEX21'}).unitPrice, 6.31)
  check('TEX21 Std Colour qty 51',   calculatePrice(rules,{quantity:51,   material:'TEX21'}).unitPrice, 5.66)
  check('TEX21 Std Colour qty 200',  calculatePrice(rules,{quantity:200,  material:'TEX21'}).unitPrice, 5.66)
  check('TEX21 Std Colour qty 601',  calculatePrice(rules,{quantity:601,  material:'TEX21'}).unitPrice, 4.47)
  check('TEX21 Std Colour qty 1001', calculatePrice(rules,{quantity:1001, material:'TEX21'}).unitPrice, 4.28)
  check('TEX21 Std Colour qty 5001', calculatePrice(rules,{quantity:5001, material:'TEX21'}).unitPrice, 4.13)

  check('TEX21 Std Black qty 20',    calculatePrice(rules,{quantity:20,   material:'TEX21',print_option:'Black Single Sided'}).unitPrice, 4.57)
  check('TEX21 Std Black qty 51',    calculatePrice(rules,{quantity:51,   material:'TEX21',print_option:'Black Single Sided'}).unitPrice, 4.33)
  check('TEX21 Std Black qty 601',   calculatePrice(rules,{quantity:601,  material:'TEX21',print_option:'Black Single Sided'}).unitPrice, 4.06)
  check('TEX21 Std Black qty 1001',  calculatePrice(rules,{quantity:1001, material:'TEX21',print_option:'Black Single Sided'}).unitPrice, 3.64)
  check('TEX21 Std Black qty 5001',  calculatePrice(rules,{quantity:5001, material:'TEX21',print_option:'Black Single Sided'}).unitPrice, 3.51)

  check('TEX21 Std CBB qty 20',      calculatePrice(rules,{quantity:20,   material:'TEX21',print_option:'Full Colour Front / Black Back'}).unitPrice, 7.572)
  check('TEX21 Std CBB qty 51',      calculatePrice(rules,{quantity:51,   material:'TEX21',print_option:'Full Colour Front / Black Back'}).unitPrice, 6.792)
  check('TEX21 Std CBB qty 601',     calculatePrice(rules,{quantity:601,  material:'TEX21',print_option:'Full Colour Front / Black Back'}).unitPrice, 5.364)

  // TEX21 Small
  check('TEX21 Small Colour qty 50',  calculatePrice(rules,{quantity:50,  size:'Small — 150mm × 150mm',material:'TEX21'}).unitPrice, 5.01)
  check('TEX21 Small Colour qty 600', calculatePrice(rules,{quantity:600, size:'Small — 150mm × 150mm',material:'TEX21'}).unitPrice, 4.33)
  check('TEX21 Small Black  qty 50',  calculatePrice(rules,{quantity:50,  size:'Small — 150mm × 150mm',material:'TEX21',print_option:'Black Single Sided'}).unitPrice, 4.03)

  // TEX21 Large
  check('TEX21 Large Colour qty 50',  calculatePrice(rules,{quantity:50,  size:'Large — 200mm × 210mm',material:'TEX21'}).unitPrice, 6.78)
  check('TEX21 Large Black  qty 600', calculatePrice(rules,{quantity:600, size:'Large — 200mm × 210mm',material:'TEX21',print_option:'Black Single Sided'}).unitPrice, 4.87)

  // Ecoflex Standard
  check('Ecoflex Std Colour qty 50',  calculatePrice(rules,{quantity:50,  material:'Ecoflex'}).unitPrice, 5.06)
  check('Ecoflex Std Colour qty 600', calculatePrice(rules,{quantity:600, material:'Ecoflex'}).unitPrice, 4.43)
  check('Ecoflex Std Black  qty 50',  calculatePrice(rules,{quantity:50,  material:'Ecoflex',print_option:'Black Single Sided'}).unitPrice, 4.05)

  // Ecoflex Small
  check('Ecoflex Small Colour qty 50', calculatePrice(rules,{quantity:50, size:'Small — 150mm × 150mm',material:'Ecoflex'}).unitPrice, 4.29)
  // Ecoflex Large
  check('Ecoflex Large Colour qty 50', calculatePrice(rules,{quantity:50, size:'Large — 200mm × 210mm',material:'Ecoflex'}).unitPrice, 6.07)
  check('Ecoflex Large Black qty 10000', calculatePrice(rules,{quantity:10000,size:'Large — 200mm × 210mm',material:'Ecoflex',print_option:'Black Single Sided'}).unitPrice, 3.54)

  // Holes add-on
  check('2 holes addon', calculatePrice(rules,{quantity:100,material:'TEX21',holes:'2 Holes'}).unitPrice, 5.66+0.15)
  check('4 holes addon', calculatePrice(rules,{quantity:100,material:'TEX21',holes:'4 Holes'}).unitPrice, 5.66+0.30)
  // Minimum
  check('minimum order', calculatePrice(rules,{quantity:5,material:'TEX21'}).subtotal, 495)
}

// ── 5. STAMPS ───────────────────────────────────────────────────────────────
// Only 2 templates exist in DB: 38×14mm and 58×22mm. size_key set on each template.
// quantity_break with size condition replaces base price.
console.log('\n── Self-Inking Stamps ──')
{
  const rules = await getRules('self-inking-stamps')
  check('C20 stamp (38mm × 14mm)', calculatePrice(rules,{quantity:1, size:'38mm × 14mm'}).unitPrice, 234.78)
  check('C30 stamp (58mm × 22mm)', calculatePrice(rules,{quantity:1, size:'58mm × 22mm'}).unitPrice, 285.22)
}

// ── Summary ─────────────────────────────────────────────────────────────────
const total = pass + fail
console.log(`\n════════════════════════════════════════════════════`)
console.log(`  RESULTS: ${pass}/${total} passed  ${fail > 0 ? '(' + fail + ' FAILED)' : '✓ ALL PASS'}`)
console.log(`════════════════════════════════════════════════════\n`)
