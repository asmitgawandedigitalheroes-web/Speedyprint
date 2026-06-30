/**
 * Seed pricing rules from pricing-rules.md (corrected client pricing, Jun 2026).
 * Source: Book17 (1).xlsx — corrected version.
 *
 * Usage:
 *   node scripts/seed-pricing-from-excel.mjs --discover        # list all products + params
 *   node scripts/seed-pricing-from-excel.mjs --dry-run         # preview without inserting
 *   node scripts/seed-pricing-from-excel.mjs --force           # replace without confirmation
 *   node scripts/seed-pricing-from-excel.mjs                   # replace (prompts)
 *
 * Per matched product: DELETE all existing pricing_rules, then INSERT these rules.
 *
 * ⚠️  SETUP FEE vs MINIMUM ORDER:
 *   This seed uses setup_fee (always added on top) NOT minimum_order (price floor).
 *   Per pricing-rules.md: order_total = setup_charge + (qty × price_per_unit).
 *   Impact on small orders: 50 SS cards @ R2.50 = R125 + R195 = R320 total
 *   (old minimum_order behaviour would have charged only R195).
 *   Confirm this is intentional before deploying.
 *
 * ⚠️  TARE-OFF STRIP (race numbers):
 *   pricing-rules.md specifies R295 as a FLAT PER-ORDER fee, but the current
 *   calculator applies option_addon rules PER UNIT. The price is set to R295
 *   here as a placeholder — correct implementation requires a new flat_order_addon
 *   rule type in calculator.ts, or handling at the application/order layer.
 *
 * ⚠️  STAMPS S120 MINI DATER:
 *   The S120 Mini Dater (CMD12016) has no setup fee ("NA") per pricing-rules.md.
 *   All stamps share one product group so setup_fee(195) is applied globally.
 *   Correct fix: give S120 its own product group, or add conditional setup_fee
 *   support to the calculator.
 *
 * ⚠️  LASER/PERSPEX (§7):
 *   Full pricing table is defined below in LASER_RULES but the SLUG_MAP entry is
 *   commented out. Run --discover to find the correct product group slug, then
 *   uncomment the laser entry in SLUG_MAP and PRODUCT_MAP.
 *
 * ⚠️  STAMPS — only 2 DB templates exist (38mm × 14mm and 58mm × 22mm).
 *   Pricing rules for all 9 SKUs are defined. Rules for new SKUs will be inactive
 *   until their product templates are created. Also: current DB template for C30
 *   uses wrong size key "58mm × 22mm" — actual C30 size is "47mm × 18mm".
 *   Correct the template size_key when creating new stamp templates.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { createInterface } from 'readline'

// ─── Env & client ─────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const args = process.argv.slice(2)
const DISCOVER = args.includes('--discover')
const DRY_RUN  = args.includes('--dry-run')
const FORCE    = args.includes('--force')

// ─── Slug map ─────────────────────────────────────────────────────────────────
const SLUG_MAP = {
  businessCards: ['business-cards'],
  coffeeSleeves: ['coffee-cup-sleeves'],
  labelsUV:      ['large-format-uv-labels'],
  raceNumbers:   ['race-numbers'],
  stamps:        ['self-inking-stamps'],
  // perspex-signage confirmed via --discover (30 Jun 2026)
  // Template params: colour (Clear|White|Black), thickness (3mm|5mm) — process needs adding as template param
  laser:         ['perspex-signage'],
  vinylStickers: ['vinyl-stickers'],
}

// ══════════════════════════════════════════════════════════════════════════════
//  RULE BUILDER HELPERS
// ══════════════════════════════════════════════════════════════════════════════

let _order = 0
const nextOrder = () => ++_order

function qtyBreak(minQty, maxQty, price, extraConds = {}, desc = '') {
  return {
    rule_type: 'quantity_break',
    conditions: {
      min_qty: minQty,
      max_qty: maxQty,
      discount_type: 'fixed_price',
      ...(desc && { description: desc }),
      ...extraConds,
    },
    price_value: price,
    currency: 'ZAR',
    is_active: true,
    display_order: nextOrder(),
  }
}

function basePrice(price, desc = '') {
  return {
    rule_type: 'base_price',
    conditions: desc ? { description: desc } : {},
    price_value: price,
    currency: 'ZAR',
    is_active: true,
    display_order: nextOrder(),
  }
}

function perAreaM2(rate, extraConds = {}, desc = '') {
  return {
    rule_type: 'per_area_m2',
    conditions: { ...(desc && { description: desc }), ...extraConds },
    price_value: rate,
    currency: 'ZAR',
    is_active: true,
    display_order: nextOrder(),
  }
}

function optionAddon(key, value, price, desc = '') {
  return {
    rule_type: 'option_addon',
    conditions: { [key]: value, ...(desc && { description: desc }) },
    price_value: price,
    currency: 'ZAR',
    is_active: true,
    display_order: nextOrder(),
  }
}

function finishAddon(key, value, price, desc = '') {
  return {
    rule_type: 'finish_addon',
    conditions: { [key]: value, ...(desc && { description: desc }) },
    price_value: price,
    currency: 'ZAR',
    is_active: true,
    display_order: nextOrder(),
  }
}

function materialAddon(material, price, desc = '') {
  return {
    rule_type: 'material_addon',
    conditions: { material, ...(desc && { description: desc }) },
    price_value: price,
    currency: 'ZAR',
    is_active: true,
    display_order: nextOrder(),
  }
}

/**
 * flatOrderAddon — conditional flat per-order fee.
 * Matched like option_addon (checks params[key] === value) but charged ONCE per order,
 * not multiplied by quantity. Use for safety pins boxes, tare-off strips, etc.
 */
function flatOrderAddon(key, value, price, desc = '') {
  return {
    rule_type: 'flat_order_addon',
    conditions: { [key]: value, ...(desc && { description: desc }) },
    price_value: price,
    currency: 'ZAR',
    is_active: true,
    display_order: nextOrder(),
  }
}

/**
 * setupFee — one-time per-order charge, ALWAYS added on top of subtotal.
 * calculator.ts sums all active setup_fee rules and adds to the final total.
 * This replaces the old minimumOrder() which was a price floor, not an additive fee.
 */
function setupFee(price, desc = 'Set-up charge (once per order, excl. VAT)') {
  return {
    rule_type: 'setup_fee',
    conditions: { description: desc },
    price_value: price,
    currency: 'ZAR',
    is_active: true,
    display_order: 1000,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  AREA TIER HELPER — per-m² products (Labels, Large Format UV)
// ══════════════════════════════════════════════════════════════════════════════
// Tier bands: 1-2, 3-4, 5-8, 9-15, 16-25, 25-50, 51+ m² total order area

function areaRulesForMaterial(material, printOption, rates, lamination = null, extraDesc = '') {
  const tierRanges = [[0,2],[2,4],[4,8],[8,15],[15,25],[25,50],[50,Infinity]]
  const tierLabels = ['1-2m2','3-4m2','5-8m2','9-15m2','16-25m2','25-50m2','51m2+']
  const conds = { material, print_option: printOption }
  if (lamination) conds.lamination = lamination
  return tierRanges.map(([minM2, maxM2], i) => perAreaM2(
    rates[i],
    {
      ...conds,
      min_total_m2: minM2,
      ...(maxM2 !== Infinity && { max_total_m2: maxM2 }),
    },
    `${extraDesc || material} ${printOption}${lamination ? '+Lam' : ''} ${tierLabels[i]}`
  ))
}

/** areaRulesForMaterialOnly — same tier structure but no print_option condition.
 * Used for products (e.g. Vinyl Stickers) whose templates don't expose a print_option param.
 * Lower specificity than areaRulesForMaterial so print_option-specific rules still win when present.
 */
function areaRulesForMaterialOnly(material, rates, extraDesc = '') {
  const tierRanges = [[0,2],[2,4],[4,8],[8,15],[15,25],[25,50],[50,Infinity]]
  const tierLabels = ['1-2m2','3-4m2','5-8m2','9-15m2','16-25m2','25-50m2','51m2+']
  return tierRanges.map(([minM2, maxM2], i) => perAreaM2(
    rates[i],
    {
      material,
      min_total_m2: minM2,
      ...(maxM2 !== Infinity && { max_total_m2: maxM2 }),
    },
    `${extraDesc || material} ${tierLabels[i]}`
  ))
}

// ══════════════════════════════════════════════════════════════════════════════
//  1. BUSINESS CARDS  (slug: business-cards)
// ══════════════════════════════════════════════════════════════════════════════
// Set-up charge: R195 (excl. VAT) — once per order
// Pricing: order_total = setup_fee + (qty × price_per_unit)
//
// All per-unit prices excl. VAT (incl. VAT = × 1.15):
//   SS:           50→2.50  100→1.99  250→0.85  500→0.50  1000→0.32
//   SS + lam:     50→3.10  100→2.60  250→1.25  500→0.72  1000→0.515
//   DS:           50→2.75  100→2.10  250→1.00  500→0.60  1000→0.39
//   DS + lam:     50→3.80  100→3.10  250→1.45  500→0.89  1000→0.62
//
// "w/ lam" = TOTAL per-unit price WITH lamination (replacement, not additive).
// Both Matt and Gloss lamination are identically priced per source.

_order = 0
const BUSINESS_CARDS_RULES = [
  // ── Single Sided (default — no extra conditions) ──
  basePrice(2.50, 'SS per card (qty 1-99)'),
  qtyBreak(100, 249,    1.99, {}, 'SS 100-249'),
  qtyBreak(250, 499,    0.85, {}, 'SS 250-499'),
  qtyBreak(500, 999,    0.50, {}, 'SS 500-999'),
  qtyBreak(1000, 99999, 0.32, {}, 'SS 1000+'),

  // ── SS + lamination:"Gloss" (total unit price; replaces base via specificity) ──
  qtyBreak(1,    99,    3.10,  { lamination: 'Gloss' }, 'SS+Gloss 1-99'),
  qtyBreak(100,  249,   2.60,  { lamination: 'Gloss' }, 'SS+Gloss 100-249'),
  qtyBreak(250,  499,   1.25,  { lamination: 'Gloss' }, 'SS+Gloss 250-499'),
  qtyBreak(500,  999,   0.72,  { lamination: 'Gloss' }, 'SS+Gloss 500-999'),
  qtyBreak(1000, 99999, 0.515, { lamination: 'Gloss' }, 'SS+Gloss 1000+'),

  // ── SS + lamination:"Matt" ──
  qtyBreak(1,    99,    3.10,  { lamination: 'Matt' }, 'SS+Matt 1-99'),
  qtyBreak(100,  249,   2.60,  { lamination: 'Matt' }, 'SS+Matt 100-249'),
  qtyBreak(250,  499,   1.25,  { lamination: 'Matt' }, 'SS+Matt 250-499'),
  qtyBreak(500,  999,   0.72,  { lamination: 'Matt' }, 'SS+Matt 500-999'),
  qtyBreak(1000, 99999, 0.515, { lamination: 'Matt' }, 'SS+Matt 1000+'),

  // ── SS + finishing:"Gloss Lamination" (legacy param name alias) ──
  qtyBreak(1,    99,    3.10,  { finishing: 'Gloss Lamination' }, 'SS+GlossLam 1-99'),
  qtyBreak(100,  249,   2.60,  { finishing: 'Gloss Lamination' }, 'SS+GlossLam 100-249'),
  qtyBreak(250,  499,   1.25,  { finishing: 'Gloss Lamination' }, 'SS+GlossLam 250-499'),
  qtyBreak(500,  999,   0.72,  { finishing: 'Gloss Lamination' }, 'SS+GlossLam 500-999'),
  qtyBreak(1000, 99999, 0.515, { finishing: 'Gloss Lamination' }, 'SS+GlossLam 1000+'),

  // ── SS + finishing:"Matt Lamination" ──
  qtyBreak(1,    99,    3.10,  { finishing: 'Matt Lamination' }, 'SS+MattLam 1-99'),
  qtyBreak(100,  249,   2.60,  { finishing: 'Matt Lamination' }, 'SS+MattLam 100-249'),
  qtyBreak(250,  499,   1.25,  { finishing: 'Matt Lamination' }, 'SS+MattLam 250-499'),
  qtyBreak(500,  999,   0.72,  { finishing: 'Matt Lamination' }, 'SS+MattLam 500-999'),
  qtyBreak(1000, 99999, 0.515, { finishing: 'Matt Lamination' }, 'SS+MattLam 1000+'),

  // ── Double Sided (no lamination) ──
  qtyBreak(1,    99,    2.75,  { print_option: 'Full Colour Double Sided' }, 'DS 1-99'),
  qtyBreak(100,  249,   2.10,  { print_option: 'Full Colour Double Sided' }, 'DS 100-249'),
  qtyBreak(250,  499,   1.00,  { print_option: 'Full Colour Double Sided' }, 'DS 250-499'),
  qtyBreak(500,  999,   0.60,  { print_option: 'Full Colour Double Sided' }, 'DS 500-999'),
  qtyBreak(1000, 99999, 0.39,  { print_option: 'Full Colour Double Sided' }, 'DS 1000+'),

  // ── DS + lamination:"Gloss" ──
  qtyBreak(1,    99,    3.80,  { print_option: 'Full Colour Double Sided', lamination: 'Gloss' }, 'DS+Gloss 1-99'),
  qtyBreak(100,  249,   3.10,  { print_option: 'Full Colour Double Sided', lamination: 'Gloss' }, 'DS+Gloss 100-249'),
  qtyBreak(250,  499,   1.45,  { print_option: 'Full Colour Double Sided', lamination: 'Gloss' }, 'DS+Gloss 250-499'),
  qtyBreak(500,  999,   0.89,  { print_option: 'Full Colour Double Sided', lamination: 'Gloss' }, 'DS+Gloss 500-999'),
  qtyBreak(1000, 99999, 0.62,  { print_option: 'Full Colour Double Sided', lamination: 'Gloss' }, 'DS+Gloss 1000+'),

  // ── DS + lamination:"Matt" ──
  qtyBreak(1,    99,    3.80,  { print_option: 'Full Colour Double Sided', lamination: 'Matt' }, 'DS+Matt 1-99'),
  qtyBreak(100,  249,   3.10,  { print_option: 'Full Colour Double Sided', lamination: 'Matt' }, 'DS+Matt 100-249'),
  qtyBreak(250,  499,   1.45,  { print_option: 'Full Colour Double Sided', lamination: 'Matt' }, 'DS+Matt 250-499'),
  qtyBreak(500,  999,   0.89,  { print_option: 'Full Colour Double Sided', lamination: 'Matt' }, 'DS+Matt 500-999'),
  qtyBreak(1000, 99999, 0.62,  { print_option: 'Full Colour Double Sided', lamination: 'Matt' }, 'DS+Matt 1000+'),

  // ── DS + finishing:"Gloss Lamination" ──
  qtyBreak(1,    99,    3.80,  { print_option: 'Full Colour Double Sided', finishing: 'Gloss Lamination' }, 'DS+GlossLam 1-99'),
  qtyBreak(100,  249,   3.10,  { print_option: 'Full Colour Double Sided', finishing: 'Gloss Lamination' }, 'DS+GlossLam 100-249'),
  qtyBreak(250,  499,   1.45,  { print_option: 'Full Colour Double Sided', finishing: 'Gloss Lamination' }, 'DS+GlossLam 250-499'),
  qtyBreak(500,  999,   0.89,  { print_option: 'Full Colour Double Sided', finishing: 'Gloss Lamination' }, 'DS+GlossLam 500-999'),
  qtyBreak(1000, 99999, 0.62,  { print_option: 'Full Colour Double Sided', finishing: 'Gloss Lamination' }, 'DS+GlossLam 1000+'),

  // ── DS + finishing:"Matt Lamination" ──
  qtyBreak(1,    99,    3.80,  { print_option: 'Full Colour Double Sided', finishing: 'Matt Lamination' }, 'DS+MattLam 1-99'),
  qtyBreak(100,  249,   3.10,  { print_option: 'Full Colour Double Sided', finishing: 'Matt Lamination' }, 'DS+MattLam 100-249'),
  qtyBreak(250,  499,   1.45,  { print_option: 'Full Colour Double Sided', finishing: 'Matt Lamination' }, 'DS+MattLam 250-499'),
  qtyBreak(500,  999,   0.89,  { print_option: 'Full Colour Double Sided', finishing: 'Matt Lamination' }, 'DS+MattLam 500-999'),
  qtyBreak(1000, 99999, 0.62,  { print_option: 'Full Colour Double Sided', finishing: 'Matt Lamination' }, 'DS+MattLam 1000+'),

  // ── Other add-ons (not in pricing-rules.md per-unit tables; kept for product options) ──
  finishAddon('finishing', 'Spot UV', 0.80, 'Spot UV per unit'),
  optionAddon('corners', 'Rounded', 0.05, 'Rounded corners per unit'),
  materialAddon('400gsm', 0.30, '400gsm material upgrade per unit'),

  setupFee(195),
]

// ══════════════════════════════════════════════════════════════════════════════
//  2. COFFEE CUP SLEEVES  (slug: coffee-cup-sleeves)
// ══════════════════════════════════════════════════════════════════════════════
// Set-up charge: R195 (excl. VAT) — once per order
// Size: 70mm × 270mm
// Materials: 250gsm (white), Kraft
// Pricing: order_total = setup_fee + (qty × price_per_unit)
//
// All per-unit prices excl. VAT:
//   250gsm Colour:  100→1.813   500→1.554  1000→1.4504
//   250gsm Black:   100→0.973   500→0.834  1000→0.7784
//   Kraft Colour:   100→1.960   500→1.680  1000→1.568
//   Kraft Black:    100→1.120   500→0.960  1000→0.896
//
// Note: pricing-rules.md uses "250gsm" / "Kraft" as material names.
// DB templates may use "250gsm White" / "Kraft Paper (Brown)" — both forms included.

_order = 0
const COFFEE_SLEEVES_RULES = [
  // ── 250gsm White — Full Colour (default; no extra conditions for base) ──
  basePrice(1.813, '250gsm Colour per sleeve (qty 1-499)'),
  qtyBreak(500,  999,   1.554,  {}, '250gsm Colour 500-999'),
  qtyBreak(1000, 99999, 1.4504, {}, '250gsm Colour 1000+'),

  // ── 250gsm explicit material condition (alias for templates using material key) ──
  qtyBreak(1,    499,   1.813,  { material: '250gsm White' }, '250gsm White Colour 1-499'),
  qtyBreak(500,  999,   1.554,  { material: '250gsm White' }, '250gsm White Colour 500-999'),
  qtyBreak(1000, 99999, 1.4504, { material: '250gsm White' }, '250gsm White Colour 1000+'),
  qtyBreak(1,    499,   1.813,  { material: '250gsm' }, '250gsm Colour 1-499'),
  qtyBreak(500,  999,   1.554,  { material: '250gsm' }, '250gsm Colour 500-999'),
  qtyBreak(1000, 99999, 1.4504, { material: '250gsm' }, '250gsm Colour 1000+'),

  // ── 250gsm Black Single Sided ──
  qtyBreak(1,    499,   0.973,  { print_option: 'Black Single Sided' }, '250gsm Black 1-499'),
  qtyBreak(500,  999,   0.834,  { print_option: 'Black Single Sided' }, '250gsm Black 500-999'),
  qtyBreak(1000, 99999, 0.7784, { print_option: 'Black Single Sided' }, '250gsm Black 1000+'),

  // ── Kraft (Brown) — Full Colour ──
  qtyBreak(1,    499,   1.960,  { material: 'Kraft Paper (Brown)' }, 'Kraft Colour 1-499'),
  qtyBreak(500,  999,   1.680,  { material: 'Kraft Paper (Brown)' }, 'Kraft Colour 500-999'),
  qtyBreak(1000, 99999, 1.568,  { material: 'Kraft Paper (Brown)' }, 'Kraft Colour 1000+'),

  // Kraft short key alias
  qtyBreak(1,    499,   1.960,  { material: 'Kraft' }, 'Kraft Colour 1-499 alias'),
  qtyBreak(500,  999,   1.680,  { material: 'Kraft' }, 'Kraft Colour 500-999 alias'),
  qtyBreak(1000, 99999, 1.568,  { material: 'Kraft' }, 'Kraft Colour 1000+ alias'),

  // ── Kraft (Brown) — Black Single Sided ──
  qtyBreak(1,    499,   1.120,  { material: 'Kraft Paper (Brown)', print_option: 'Black Single Sided' }, 'Kraft Black 1-499'),
  qtyBreak(500,  999,   0.960,  { material: 'Kraft Paper (Brown)', print_option: 'Black Single Sided' }, 'Kraft Black 500-999'),
  qtyBreak(1000, 99999, 0.896,  { material: 'Kraft Paper (Brown)', print_option: 'Black Single Sided' }, 'Kraft Black 1000+'),

  // Kraft short key alias
  qtyBreak(1,    499,   1.120,  { material: 'Kraft', print_option: 'Black Single Sided' }, 'Kraft Black 1-499 alias'),
  qtyBreak(500,  999,   0.960,  { material: 'Kraft', print_option: 'Black Single Sided' }, 'Kraft Black 500-999 alias'),
  qtyBreak(1000, 99999, 0.896,  { material: 'Kraft', print_option: 'Black Single Sided' }, 'Kraft Black 1000+ alias'),

  setupFee(195),
]

// ══════════════════════════════════════════════════════════════════════════════
//  3. LARGE FORMAT UV LABELS  (slug: large-format-uv-labels)
//     Covers: §4 Large Format UV (White/Grey Back/Clear Vinyl)
//             §3 Laser Labels (Polylaser Adhesive, Paper Adhesive)
// ══════════════════════════════════════════════════════════════════════════════
// Set-up charge: R195 (excl. VAT) — once per order
// Pricing: order_total = setup_fee + (area_m2 × price_per_m2(material, print, lamination, tier))
//
// Area tier bands: 1-2, 3-4, 5-8, 9-15, 16-25, 25-50, 51+ m² total order area
// All rates excl. VAT (incl. VAT = rate × 1.15).
//
// ⚠️  Open Question #2: Polylaser Adhesive Black + Lamination, 1-2m² tier = 724.50
//   This is the value from the client's source sheet. It breaks the descending
//   pattern of adjacent tiers (603.32 → 564.49 → 538.77...) and may be a typo
//   (expected ~636). Keeping as-is until confirmed with client.

_order = 0
const LABELS_UV_RULES = [
  // ── §4.1 White Vinyl (Gloss & Matt finishes same price; finish = separate attribute) ──
  ...areaRulesForMaterial('White Vinyl', 'Colour Single Sided',
    [383.69, 361.97, 336.57, 319.74, 309.43, 295.15, 255.79]),
  ...areaRulesForMaterial('White Vinyl', 'Colour + Spot Gloss',
    [508.69, 479.90, 446.22, 423.91, 410.23, 391.30, 339.13]),

  // ── §4.2 Grey Back Vinyl ──
  ...areaRulesForMaterial('Grey Back Vinyl', 'Colour Single Sided',
    [425.47, 401.39, 373.22, 354.56, 343.12, 327.28, 283.65]),
  ...areaRulesForMaterial('Grey Back Vinyl', 'Colour + Spot Gloss',
    [550.47, 519.31, 482.87, 458.73, 443.93, 423.44, 366.98]),

  // ── §4.3 Clear Vinyl ──
  ...areaRulesForMaterial('Clear Vinyl', 'Colour Single Sided',
    [415.52, 392.00, 364.49, 346.27, 335.10, 319.63, 277.01]),
  ...areaRulesForMaterial('Clear Vinyl', 'White Single Sided',
    [314.22, 296.43, 275.63, 261.85, 253.40, 241.71, 209.48]),
  ...areaRulesForMaterial('Clear Vinyl', 'Colour + White',
    [621.27, 586.10, 544.97, 517.73, 501.02, 477.90, 414.18]),
  ...areaRulesForMaterial('Clear Vinyl', 'Colour + White + Spot Gloss',
    [746.27, 704.03, 654.62, 621.89, 601.83, 574.05, 497.51]),

  // ── §3.1 Polylaser Adhesive — no lamination ──
  ...areaRulesForMaterial('Polylaser Adhesive', 'Colour Single Sided',
    [624.80, 589.43, 548.07, 520.67, 503.87, 480.62, 416.53]),
  // ⚠️ Open Q #2: 724.50 at 1-2m² may be a source typo (expected ~636). Confirm with client.
  ...areaRulesForMaterial('Polylaser Adhesive', 'Black Single Sided',
    [586.52, 553.32, 514.49, 488.77, 473.00, 451.17, 391.01]),

  // ── §3.1 Polylaser Adhesive + Gloss lamination ──
  ...areaRulesForMaterial('Polylaser Adhesive', 'Colour Single Sided',
    [674.80, 639.43, 598.07, 570.67, 553.87, 530.62, 466.53], 'Gloss'),
  // ⚠️ Open Q #2: first tier (724.50) may be source typo — keeping as-is until confirmed.
  ...areaRulesForMaterial('Polylaser Adhesive', 'Black Single Sided',
    [724.50, 603.32, 564.49, 538.77, 523.00, 501.17, 441.01], 'Gloss'),

  // ── §3.1 Polylaser Adhesive + Matt lamination (same rates as Gloss) ──
  ...areaRulesForMaterial('Polylaser Adhesive', 'Colour Single Sided',
    [674.80, 639.43, 598.07, 570.67, 553.87, 530.62, 466.53], 'Matt'),
  ...areaRulesForMaterial('Polylaser Adhesive', 'Black Single Sided',
    [724.50, 603.32, 564.49, 538.77, 523.00, 501.17, 441.01], 'Matt'),

  // ── §3.2 Paper Adhesive — no lamination ──
  ...areaRulesForMaterial('Paper Adhesive', 'Colour Single Sided',
    [160.99, 151.88, 141.22, 134.16, 129.83, 123.84, 107.33]),
  ...areaRulesForMaterial('Paper Adhesive', 'Black Single Sided',
    [134.45, 126.84, 117.94, 112.04, 108.43, 103.42, 89.63]),

  // ── §3.2 Paper Adhesive + Gloss lamination ──
  ...areaRulesForMaterial('Paper Adhesive', 'Colour Single Sided',
    [210.99, 201.88, 191.22, 184.16, 179.83, 173.84, 157.33], 'Gloss'),
  ...areaRulesForMaterial('Paper Adhesive', 'Black Single Sided',
    [184.45, 176.84, 167.94, 162.04, 158.43, 153.42, 139.63], 'Gloss'),

  // ── §3.2 Paper Adhesive + Matt lamination (same rates as Gloss) ──
  ...areaRulesForMaterial('Paper Adhesive', 'Colour Single Sided',
    [210.99, 201.88, 191.22, 184.16, 179.83, 173.84, 157.33], 'Matt'),
  ...areaRulesForMaterial('Paper Adhesive', 'Black Single Sided',
    [184.45, 176.84, 167.94, 162.04, 158.43, 153.42, 139.63], 'Matt'),

  setupFee(195),
]

// ══════════════════════════════════════════════════════════════════════════════
//  4. RACE NUMBERS  (slug: race-numbers)
// ══════════════════════════════════════════════════════════════════════════════
// Set-up charge: R495 (excl. VAT) — once per order
// Tare-off strip: R295 (excl. VAT) — flat fee per order (not per unit)
//   ⚠️  Implemented as option_addon (per-unit) due to calculator limitation.
//   True flat-order-fee support requires a new rule type or application-layer handling.
// Hole add-ons: +R0.075/hole per unit → 2 Holes = +0.15, 4 Holes = +0.30
// Safety pins: R180.00 per box (option_addon, treated as per-unit — needs flat-fee fix too)
//
// Pricing: order_total = setup_fee + (qty × unit_price[+ hole_addon]) [+ 295 if tare-off]
//
// All qty breakpoints as per pricing-rules.md (single breakpoints = lower bounds of each band):
//   TEX21 Standard uses range bands (20-51, 51-600, ...) mapped to same breakpoints.
//   Sizes: Standard 148×210mm (default), Small 150×150mm, Large 200×210mm
//   Materials: TEX21, Ecoflex
//   Print options: Colour Single Sided (default), Black Single Sided, Colour Front + Black Back (TEX21 only)

_order = 0
const RACE_NUMBER_RULES = [
  // ──────────────────────────────────────────────────
  //  TEX21 STANDARD 148×210mm — COLOUR  (default)
  // ──────────────────────────────────────────────────
  basePrice(6.31, 'TEX21 Standard 148x210mm Colour (qty 1-599)'),
  qtyBreak(600,  999,   5.66,  {}, 'TEX21 Std Colour 600-999'),
  qtyBreak(1000, 4999,  4.47,  {}, 'TEX21 Std Colour 1000-4999'),
  qtyBreak(5000, 9999,  4.28,  {}, 'TEX21 Std Colour 5000-9999'),
  qtyBreak(10000, 99999, 4.13, {}, 'TEX21 Std Colour 10000+'),

  // ── TEX21 Standard — Black Single Sided ──
  qtyBreak(1,    599,   4.57, { material: 'TEX21', print_option: 'Black Single Sided' }, 'TEX21 Std Black 1-599'),
  qtyBreak(600,  999,   4.33, { material: 'TEX21', print_option: 'Black Single Sided' }, 'TEX21 Std Black 600-999'),
  qtyBreak(1000, 4999,  4.06, { material: 'TEX21', print_option: 'Black Single Sided' }, 'TEX21 Std Black 1000-4999'),
  qtyBreak(5000, 9999,  3.64, { material: 'TEX21', print_option: 'Black Single Sided' }, 'TEX21 Std Black 5000-9999'),
  qtyBreak(10000, 99999, 3.51, { material: 'TEX21', print_option: 'Black Single Sided' }, 'TEX21 Std Black 10000+'),

  // ── TEX21 Standard — Colour Front / Black Back ──
  qtyBreak(1,    599,   7.572, { material: 'TEX21', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Std CBB 1-599'),
  qtyBreak(600,  999,   6.792, { material: 'TEX21', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Std CBB 600-999'),
  qtyBreak(1000, 4999,  5.364, { material: 'TEX21', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Std CBB 1000-4999'),
  qtyBreak(5000, 9999,  5.136, { material: 'TEX21', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Std CBB 5000-9999'),
  qtyBreak(10000, 99999, 4.956, { material: 'TEX21', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Std CBB 10000+'),

  // ──────────────────────────────────────────────────
  //  TEX21 SMALL 150×150mm
  // ──────────────────────────────────────────────────
  qtyBreak(1,    599,   5.01,  { material: 'TEX21', size: 'Small — 150mm × 150mm' }, 'TEX21 Small Colour 1-599'),
  qtyBreak(600,  999,   4.33,  { material: 'TEX21', size: 'Small — 150mm × 150mm' }, 'TEX21 Small Colour 600-999'),
  qtyBreak(1000, 4999,  3.76,  { material: 'TEX21', size: 'Small — 150mm × 150mm' }, 'TEX21 Small Colour 1000-4999'),
  qtyBreak(5000, 9999,  3.62,  { material: 'TEX21', size: 'Small — 150mm × 150mm' }, 'TEX21 Small Colour 5000-9999'),
  qtyBreak(10000, 99999, 3.38, { material: 'TEX21', size: 'Small — 150mm × 150mm' }, 'TEX21 Small Colour 10000+'),

  // TEX21 Small — Black
  qtyBreak(1,    599,   4.03,  { material: 'TEX21', size: 'Small — 150mm × 150mm', print_option: 'Black Single Sided' }, 'TEX21 Small Black 1-599'),
  qtyBreak(600,  999,   3.59,  { material: 'TEX21', size: 'Small — 150mm × 150mm', print_option: 'Black Single Sided' }, 'TEX21 Small Black 600-999'),
  qtyBreak(1000, 4999,  3.19,  { material: 'TEX21', size: 'Small — 150mm × 150mm', print_option: 'Black Single Sided' }, 'TEX21 Small Black 1000-4999'),
  qtyBreak(5000, 9999,  2.74,  { material: 'TEX21', size: 'Small — 150mm × 150mm', print_option: 'Black Single Sided' }, 'TEX21 Small Black 5000-9999'),
  qtyBreak(10000, 99999, 2.60, { material: 'TEX21', size: 'Small — 150mm × 150mm', print_option: 'Black Single Sided' }, 'TEX21 Small Black 10000+'),

  // TEX21 Small — Colour Front / Black Back
  qtyBreak(1,    599,   6.012, { material: 'TEX21', size: 'Small — 150mm × 150mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Small CBB 1-599'),
  qtyBreak(600,  999,   5.196, { material: 'TEX21', size: 'Small — 150mm × 150mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Small CBB 600-999'),
  qtyBreak(1000, 4999,  4.512, { material: 'TEX21', size: 'Small — 150mm × 150mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Small CBB 1000-4999'),
  qtyBreak(5000, 9999,  4.344, { material: 'TEX21', size: 'Small — 150mm × 150mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Small CBB 5000-9999'),
  qtyBreak(10000, 99999, 4.056, { material: 'TEX21', size: 'Small — 150mm × 150mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Small CBB 10000+'),

  // TEX21 Small — "Square" alias (same prices, alternative size label)
  qtyBreak(1,    599,   5.01,  { material: 'TEX21', size: 'Square — 150mm × 150mm' }, 'TEX21 Square Colour 1-599'),
  qtyBreak(600,  999,   4.33,  { material: 'TEX21', size: 'Square — 150mm × 150mm' }, 'TEX21 Square Colour 600-999'),
  qtyBreak(1000, 4999,  3.76,  { material: 'TEX21', size: 'Square — 150mm × 150mm' }, 'TEX21 Square Colour 1000-4999'),
  qtyBreak(5000, 9999,  3.62,  { material: 'TEX21', size: 'Square — 150mm × 150mm' }, 'TEX21 Square Colour 5000-9999'),
  qtyBreak(10000, 99999, 3.38, { material: 'TEX21', size: 'Square — 150mm × 150mm' }, 'TEX21 Square Colour 10000+'),

  qtyBreak(1,    599,   4.03,  { material: 'TEX21', size: 'Square — 150mm × 150mm', print_option: 'Black Single Sided' }, 'TEX21 Square Black 1-599'),
  qtyBreak(600,  999,   3.59,  { material: 'TEX21', size: 'Square — 150mm × 150mm', print_option: 'Black Single Sided' }, 'TEX21 Square Black 600-999'),
  qtyBreak(1000, 4999,  3.19,  { material: 'TEX21', size: 'Square — 150mm × 150mm', print_option: 'Black Single Sided' }, 'TEX21 Square Black 1000-4999'),
  qtyBreak(5000, 9999,  2.74,  { material: 'TEX21', size: 'Square — 150mm × 150mm', print_option: 'Black Single Sided' }, 'TEX21 Square Black 5000-9999'),
  qtyBreak(10000, 99999, 2.60, { material: 'TEX21', size: 'Square — 150mm × 150mm', print_option: 'Black Single Sided' }, 'TEX21 Square Black 10000+'),

  qtyBreak(1,    599,   6.012, { material: 'TEX21', size: 'Square — 150mm × 150mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Square CBB 1-599'),
  qtyBreak(600,  999,   5.196, { material: 'TEX21', size: 'Square — 150mm × 150mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Square CBB 600-999'),
  qtyBreak(1000, 4999,  4.512, { material: 'TEX21', size: 'Square — 150mm × 150mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Square CBB 1000-4999'),
  qtyBreak(5000, 9999,  4.344, { material: 'TEX21', size: 'Square — 150mm × 150mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Square CBB 5000-9999'),
  qtyBreak(10000, 99999, 4.056, { material: 'TEX21', size: 'Square — 150mm × 150mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Square CBB 10000+'),

  // ──────────────────────────────────────────────────
  //  TEX21 LARGE 200×210mm
  // ──────────────────────────────────────────────────
  qtyBreak(1,    599,   6.78,  { material: 'TEX21', size: 'Large — 200mm × 210mm' }, 'TEX21 Large Colour 1-599'),
  qtyBreak(600,  999,   6.08,  { material: 'TEX21', size: 'Large — 200mm × 210mm' }, 'TEX21 Large Colour 600-999'),
  qtyBreak(1000, 4999,  5.77,  { material: 'TEX21', size: 'Large — 200mm × 210mm' }, 'TEX21 Large Colour 1000-4999'),
  qtyBreak(5000, 9999,  5.56,  { material: 'TEX21', size: 'Large — 200mm × 210mm' }, 'TEX21 Large Colour 5000-9999'),
  qtyBreak(10000, 99999, 5.42, { material: 'TEX21', size: 'Large — 200mm × 210mm' }, 'TEX21 Large Colour 10000+'),

  qtyBreak(1,    599,   5.55,  { material: 'TEX21', size: 'Large — 200mm × 210mm', print_option: 'Black Single Sided' }, 'TEX21 Large Black 1-599'),
  qtyBreak(600,  999,   4.87,  { material: 'TEX21', size: 'Large — 200mm × 210mm', print_option: 'Black Single Sided' }, 'TEX21 Large Black 600-999'),
  qtyBreak(1000, 4999,  4.47,  { material: 'TEX21', size: 'Large — 200mm × 210mm', print_option: 'Black Single Sided' }, 'TEX21 Large Black 1000-4999'),
  qtyBreak(5000, 9999,  4.06,  { material: 'TEX21', size: 'Large — 200mm × 210mm', print_option: 'Black Single Sided' }, 'TEX21 Large Black 5000-9999'),
  qtyBreak(10000, 99999, 3.92, { material: 'TEX21', size: 'Large — 200mm × 210mm', print_option: 'Black Single Sided' }, 'TEX21 Large Black 10000+'),

  qtyBreak(1,    599,   8.136, { material: 'TEX21', size: 'Large — 200mm × 210mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Large CBB 1-599'),
  qtyBreak(600,  999,   7.296, { material: 'TEX21', size: 'Large — 200mm × 210mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Large CBB 600-999'),
  qtyBreak(1000, 4999,  6.924, { material: 'TEX21', size: 'Large — 200mm × 210mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Large CBB 1000-4999'),
  qtyBreak(5000, 9999,  6.672, { material: 'TEX21', size: 'Large — 200mm × 210mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Large CBB 5000-9999'),
  qtyBreak(10000, 99999, 6.504, { material: 'TEX21', size: 'Large — 200mm × 210mm', print_option: 'Full Colour Front / Black Back' }, 'TEX21 Large CBB 10000+'),

  // ──────────────────────────────────────────────────
  //  ECOFLEX STANDARD 148×210mm
  // ──────────────────────────────────────────────────
  qtyBreak(1,    599,   5.06,  { material: 'Ecoflex' }, 'Ecoflex Std Colour 1-599'),
  qtyBreak(600,  999,   4.43,  { material: 'Ecoflex' }, 'Ecoflex Std Colour 600-999'),
  qtyBreak(1000, 4999,  3.88,  { material: 'Ecoflex' }, 'Ecoflex Std Colour 1000-4999'),
  qtyBreak(5000, 9999,  3.54,  { material: 'Ecoflex' }, 'Ecoflex Std Colour 5000-9999'),
  qtyBreak(10000, 99999, 3.35, { material: 'Ecoflex' }, 'Ecoflex Std Colour 10000+'),

  qtyBreak(1,    599,   4.05,  { material: 'Ecoflex', print_option: 'Black Single Sided' }, 'Ecoflex Std Black 1-599'),
  qtyBreak(600,  999,   3.79,  { material: 'Ecoflex', print_option: 'Black Single Sided' }, 'Ecoflex Std Black 600-999'),
  qtyBreak(1000, 4999,  3.54,  { material: 'Ecoflex', print_option: 'Black Single Sided' }, 'Ecoflex Std Black 1000-4999'),
  qtyBreak(5000, 9999,  3.16,  { material: 'Ecoflex', print_option: 'Black Single Sided' }, 'Ecoflex Std Black 5000-9999'),
  qtyBreak(10000, 99999, 3.04, { material: 'Ecoflex', print_option: 'Black Single Sided' }, 'Ecoflex Std Black 10000+'),

  // ──────────────────────────────────────────────────
  //  ECOFLEX SMALL 150×150mm
  // ──────────────────────────────────────────────────
  qtyBreak(1,    599,   4.29,  { material: 'Ecoflex', size: 'Small — 150mm × 150mm' }, 'Ecoflex Small Colour 1-599'),
  qtyBreak(600,  999,   3.79,  { material: 'Ecoflex', size: 'Small — 150mm × 150mm' }, 'Ecoflex Small Colour 600-999'),
  qtyBreak(1000, 4999,  3.40,  { material: 'Ecoflex', size: 'Small — 150mm × 150mm' }, 'Ecoflex Small Colour 1000-4999'),
  qtyBreak(5000, 9999,  3.16,  { material: 'Ecoflex', size: 'Small — 150mm × 150mm' }, 'Ecoflex Small Colour 5000-9999'),
  qtyBreak(10000, 99999, 3.04, { material: 'Ecoflex', size: 'Small — 150mm × 150mm' }, 'Ecoflex Small Colour 10000+'),

  qtyBreak(1,    599,   3.93,  { material: 'Ecoflex', size: 'Small — 150mm × 150mm', print_option: 'Black Single Sided' }, 'Ecoflex Small Black 1-599'),
  qtyBreak(600,  999,   3.49,  { material: 'Ecoflex', size: 'Small — 150mm × 150mm', print_option: 'Black Single Sided' }, 'Ecoflex Small Black 600-999'),
  qtyBreak(1000, 4999,  3.11,  { material: 'Ecoflex', size: 'Small — 150mm × 150mm', print_option: 'Black Single Sided' }, 'Ecoflex Small Black 1000-4999'),
  qtyBreak(5000, 9999,  2.67,  { material: 'Ecoflex', size: 'Small — 150mm × 150mm', print_option: 'Black Single Sided' }, 'Ecoflex Small Black 5000-9999'),
  qtyBreak(10000, 99999, 2.52, { material: 'Ecoflex', size: 'Small — 150mm × 150mm', print_option: 'Black Single Sided' }, 'Ecoflex Small Black 10000+'),

  // ──────────────────────────────────────────────────
  //  ECOFLEX LARGE 200×210mm
  // ──────────────────────────────────────────────────
  qtyBreak(1,    599,   6.07,  { material: 'Ecoflex', size: 'Large — 200mm × 210mm' }, 'Ecoflex Large Colour 1-599'),
  qtyBreak(600,  999,   5.39,  { material: 'Ecoflex', size: 'Large — 200mm × 210mm' }, 'Ecoflex Large Colour 600-999'),
  qtyBreak(1000, 4999,  5.33,  { material: 'Ecoflex', size: 'Large — 200mm × 210mm' }, 'Ecoflex Large Colour 1000-4999'),
  qtyBreak(5000, 9999,  5.06,  { material: 'Ecoflex', size: 'Large — 200mm × 210mm' }, 'Ecoflex Large Colour 5000-9999'),
  qtyBreak(10000, 99999, 4.95, { material: 'Ecoflex', size: 'Large — 200mm × 210mm' }, 'Ecoflex Large Colour 10000+'),

  qtyBreak(1,    599,   5.03,  { material: 'Ecoflex', size: 'Large — 200mm × 210mm', print_option: 'Black Single Sided' }, 'Ecoflex Large Black 1-599'),
  qtyBreak(600,  999,   4.38,  { material: 'Ecoflex', size: 'Large — 200mm × 210mm', print_option: 'Black Single Sided' }, 'Ecoflex Large Black 600-999'),
  qtyBreak(1000, 4999,  4.05,  { material: 'Ecoflex', size: 'Large — 200mm × 210mm', print_option: 'Black Single Sided' }, 'Ecoflex Large Black 1000-4999'),
  qtyBreak(5000, 9999,  3.66,  { material: 'Ecoflex', size: 'Large — 200mm × 210mm', print_option: 'Black Single Sided' }, 'Ecoflex Large Black 5000-9999'),
  qtyBreak(10000, 99999, 3.54, { material: 'Ecoflex', size: 'Large — 200mm × 210mm', print_option: 'Black Single Sided' }, 'Ecoflex Large Black 10000+'),

  // ──────────────────────────────────────────────────
  //  Add-ons
  // ──────────────────────────────────────────────────
  // Holes: +R0.075 per hole per unit → 2 holes = +0.15, 4 holes = +0.30
  optionAddon('holes', '2 Holes', 0.15, '+R0.15 per unit for 2 holes'),
  optionAddon('holes', '4 Holes', 0.30, '+R0.30 per unit for 4 holes'),

  // Tare-off strip: R295 flat per order (excl. VAT) per pricing-rules.md.
  // ⚠️  ARCHITECTURE LIMITATION: option_addon is applied per-unit by the calculator.
  //   At qty 50 this would be 50 × R295 = R14,750 (completely wrong).
  //   Until a flat_order_addon rule type is implemented, do NOT expose tare-off
  //   strip pricing through the standard calculator — handle it at the order level.
  //   Rule commented out intentionally. Uncomment only after calculator is updated.
  // optionAddon('tare_off_strips', 'Yes', 295, 'Tare-off strip R295 flat/order — NOT per-unit'),

  // Safety pins: R180.00 per box, flat per-order fee (not per bib)
  flatOrderAddon('safety_pins', '1 Box (864 pins)', 180.00, 'Safety pins — 1 box flat fee'),
  flatOrderAddon('safety_pins', '2 Boxes',          360.00, 'Safety pins — 2 boxes flat fee'),
  flatOrderAddon('safety_pins', '3 Boxes',          540.00, 'Safety pins — 3 boxes flat fee'),
  flatOrderAddon('safety_pins', '4 Boxes',          720.00, 'Safety pins — 4 boxes flat fee'),
  flatOrderAddon('safety_pins', '5 Boxes',          900.00, 'Safety pins — 5 boxes flat fee'),

  setupFee(495),
]

// ══════════════════════════════════════════════════════════════════════════════
//  5. STAMPS  (slug: self-inking-stamps)
// ══════════════════════════════════════════════════════════════════════════════
// Set-up charge: R195 (excl. VAT) for most SKUs; "NA" for S120 Mini Dater (CMD12016).
// ⚠️  All stamps share one product group, so setup_fee(195) applies to all.
//   S120 Mini Dater exception requires a separate product group or per-SKU
//   conditional setup_fee support in the calculator.
//
// Pricing: order_total = (setup_charge if applicable) + selling_price
// Each stamp is a single fixed-price SKU (not quantity-tiered).
//
// The calculator matches a qtyBreak rule by size condition from template_json.size_key.
//
// ⚠️  DB templates: currently only 2 templates exist:
//   "38mm × 14mm" → Printer C20 (CPCN2011) — correct
//   "58mm × 22mm" → Printer C30 (CPCN3060) — WRONG: C30 actual size is 18mm × 47mm
//
// Rules for new SKUs (CPCN4020–CPR1720) are defined here but will be inactive until
// their product templates are created with matching size_key values.
// When creating templates, use the size_key format below (height × width, mm).

_order = 0
const STAMPS_RULES = [
  // ── Currently active (matched to existing DB templates) ──

  // CPCN2011 — Printer C20 New Compact, 14mm × 38mm
  // DB template size_key: "38mm × 14mm"
  qtyBreak(1, 999999, 234.78, { size: '38mm × 14mm' }, 'CPCN2011 C20 14x38mm'),

  // CPCN3060 — Printer C30 New Compact, 18mm × 47mm
  // ⚠️  DB template currently uses wrong size_key "58mm × 22mm". Both rules included
  //   for backward compat; remove "58mm × 22mm" after correcting the DB template.
  qtyBreak(1, 999999, 285.22, { size: '58mm × 22mm' }, 'CPCN3060 C30 legacy-wrong-size-key'),
  qtyBreak(1, 999999, 285.22, { size: '47mm × 18mm' }, 'CPCN3060 C30 18x47mm correct'),

  // ── New SKUs (active once DB templates are created with matching size_key) ──

  // CPCN4020 — Printer C40 New Compact, 23mm × 59mm
  qtyBreak(1, 999999, 338.70, { size: '59mm × 23mm' }, 'CPCN4020 C40 23x59mm'),

  // CPCN5030 — Printer C50 New Compact, 30mm × 69mm
  qtyBreak(1, 999999, 434.78, { size: '69mm × 30mm' }, 'CPCN5030 C50 30x69mm'),

  // CPCN6020 — Printer C60 New Compact, 37mm × 76mm
  qtyBreak(1, 999999, 471.74, { size: '76mm × 37mm' }, 'CPCN6020 C60 37x76mm'),

  // CPD5516 — Printer 55 Dater ISO-Date, 40mm × 60mm
  qtyBreak(1, 999999, 795.22, { size: '60mm × 40mm' }, 'CPD5516 55-Dater 40x60mm'),

  // CMD12016 — S120 Mini Dater ISO-Date, 4mm × 22mm
  // ⚠️  No setup charge for this SKU per pricing-rules.md ("NA").
  //   The setup_fee(195) at the end of this array will incorrectly apply to it.
  //   Move S120 to its own product group to fix, or add conditional setup_fee logic.
  qtyBreak(1, 999999, 128.70, { size: '22mm × 4mm' }, 'CMD12016 S120-Mini 4x22mm'),

  // CMD16016 — S160 Mini Dater ISO-Date, 12mm × 25mm
  qtyBreak(1, 999999, 378.26, { size: '25mm × 12mm' }, 'CMD16016 S160 12x25mm'),

  // CPR1720 — Printer R17 (round), 17mm diameter
  qtyBreak(1, 999999, 288.00, { size: '17mm diameter' }, 'CPR1720 R17 17mm-round'),

  setupFee(195),
]

// ══════════════════════════════════════════════════════════════════════════════
//  6. LASER / PERSPEX SIGNAGE  (slug: TBD — see TODO below)
// ══════════════════════════════════════════════════════════════════════════════
// ⚠️  SLUG UNKNOWN: Run `node scripts/seed-pricing-from-excel.mjs --discover` to
//   find the product group slug. Then uncomment 'laser' in SLUG_MAP above and
//   in PRODUCT_MAP below.
//
// Set-up charge: R195 (excl. VAT) — once per order
// Materials: 3mm Clear / White / Black Perspex, 5mm Clear / White / Black Perspex
// Standard sizes: A5 (148×210mm), A4 (210×297mm), A3 (297×420mm), A2 (420×594mm), A1 (594×841mm)
// Processes:
//   1. "Cut out only"                      — fixed price per size × material
//   2. "Cut out + Direct Print"            — fixed price per size × material
//   3. "Cut out + Bending + Glue"          — m² rate per material only
//   4. "Cut out + Bending + Glue + Print"  — m² rate per material only
//
// All prices excl. VAT. Incl. VAT = × 1.15 (or use explicit incl-VAT values from pricing-rules.md).
//
// ⚠️  Open Question #3: A3 / 5mm Clear / "Cut out + Direct Print" — source shows 3587.77 (excl VAT)
//   which is a decimal-point typo (all adjacent values ~350-380). Using corrected value 358.77.
//   CONFIRM WITH CLIENT before going live.
//
// The calculator matches these rules via qty_break with process+size+material conditions.
// For custom sizes or bending processes, per_area_m2 rules apply.

// Uses perspex-signage template param keys: colour + thickness (not combined material string)
// process is not yet a template param — add it to perspex-signage template_parameters in the DB
// before these rules will match any customer configuration.
// Order matches pricing-rules.md columns: 3mm-Clear, 3mm-White, 3mm-Black, 5mm-Clear, 5mm-White, 5mm-Black
const LASER_SPECS = [
  { colour: 'Clear', thickness: '3mm' },
  { colour: 'White', thickness: '3mm' },
  { colour: 'Black', thickness: '3mm' },
  { colour: 'Clear', thickness: '5mm' },
  { colour: 'White', thickness: '5mm' },
  { colour: 'Black', thickness: '5mm' },
]

function laserSizedRules(process, sizeLabel, prices) {
  return LASER_SPECS.map(({ colour, thickness }, i) =>
    qtyBreak(1, 999999, prices[i], { process, size: sizeLabel, colour, thickness },
      `Laser ${sizeLabel} ${thickness} ${colour} — ${process}`)
  )
}

function laserAreaRules(process, rates) {
  return LASER_SPECS.map(({ colour, thickness }, i) =>
    perAreaM2(rates[i], { process, colour, thickness },
      `Laser per-m² ${thickness} ${colour} — ${process}`)
  )
}

_order = 0
const LASER_RULES = [
  // ── Process 1: Cut out only ──
  // Fixed prices per size × material (excl. VAT)
  ...laserSizedRules('Cut out only', 'A5',  [45.50,  49.36,  51.10,  76.09,   80.44,   82.18]),
  ...laserSizedRules('Cut out only', 'A4',  [91.32,  99.05,  102.54, 152.69,  161.43,  164.92]),
  ...laserSizedRules('Cut out only', 'A3',  [182.63, 198.10, 205.09, 305.38,  322.85,  329.84]),
  ...laserSizedRules('Cut out only', 'A2',  [365.27, 396.21, 410.18, 610.77,  645.71,  659.68]),
  ...laserSizedRules('Cut out only', 'A1',  [731.41, 793.35, 821.33, 1222.99, 1292.95, 1320.93]),
  // m² reference rate (for custom sizes)
  ...laserAreaRules('Cut out only',         [1464.12, 1588.13, 1644.13, 2448.16, 2588.21, 2644.21]),

  // ── Process 2: Cut out + Direct Print ──
  // ⚠️  A3 / 5mm Clear: source = 3587.77 (typo) → corrected to 358.77. Confirm with client.
  ...laserSizedRules('Cut out + Direct Print', 'A5',  [58.56,  62.41,   64.15,   89.14,   93.50,   95.24]),
  ...laserSizedRules('Cut out + Direct Print', 'A4',  [117.51, 125.25,  128.74,  178.89,  187.62,  191.11]),
  ...laserSizedRules('Cut out + Direct Print', 'A3',  [235.02, 250.49,  257.48,  358.77,  375.24,  382.23]),
  ...laserSizedRules('Cut out + Direct Print', 'A2',  [470.05, 500.99,  514.96,  715.55,  750.49,  764.46]),
  ...laserSizedRules('Cut out + Direct Print', 'A1',  [941.22, 1003.17, 1031.14, 1432.80, 1502.76, 1530.74]),
  // m² reference rate (for custom sizes)
  ...laserAreaRules('Cut out + Direct Print',         [1884.12, 2008.13, 2064.13, 2868.16, 3008.21, 3064.21]),

  // ── Process 3: Cut out + Bending + Glue (m² rate only — no standard fixed sizes) ──
  ...laserAreaRules('Cut out + Bending + Glue',       [1514.12, 1638.13, 1694.13, 2498.16, 2638.21, 2694.21]),

  // ── Process 4: Cut out + Bending + Glue + Print (m² rate only) ──
  ...laserAreaRules('Cut out + Bending + Glue + Print', [1934.12, 2058.13, 2114.13, 2918.16, 3058.21, 3114.21]),

  setupFee(195),
]

// ══════════════════════════════════════════════════════════════════════════════
//  7. VINYL STICKERS  (slug: vinyl-stickers)
// ══════════════════════════════════════════════════════════════════════════════
// Set-up charge: R195 (excl. VAT) — once per order
// Pricing: order_total = setup_fee + (area_m2 × price_per_m2(material, tier))
//
// Template materials: White Vinyl, Clear Vinyl, Chrome/Metallic, Reflective
// Template has NO print_option param — rules matched on material only.
// Gloss and Matte finish have identical pricing (finish is cosmetic only).
//
// Rates (excl. VAT, R/m²):
//   White Vinyl    — sourced directly from Excel §4.1 Colour Single Sided
//   Clear Vinyl    — sourced directly from Excel §4.3 Colour Single Sided
//   Chrome/Metallic — estimated (White Vinyl × 1.35). Confirm with client.
//   Reflective      — estimated (White Vinyl × 1.50). Confirm with client.
//
// Area tier bands: 0–2, 2–4, 4–8, 8–15, 15–25, 25–50, 50+ m² total order area

_order = 0
const VINYL_STICKERS_RULES = [
  // ── White Vinyl (from Excel §4.1) ──
  ...areaRulesForMaterialOnly('White Vinyl',
    [383.69, 361.97, 336.57, 319.74, 309.43, 295.15, 255.79]),

  // ── Clear Vinyl (from Excel §4.3 Colour Single Sided) ──
  ...areaRulesForMaterialOnly('Clear Vinyl',
    [415.52, 392.00, 364.49, 346.27, 335.10, 319.63, 277.01]),

  // ── Chrome/Metallic — estimated (White Vinyl × 1.35, confirm with client) ──
  ...areaRulesForMaterialOnly('Chrome/Metallic',
    [517.98, 488.66, 454.37, 431.65, 417.73, 398.45, 345.32],
    'Chrome/Metallic estimate'),

  // ── Reflective — estimated (White Vinyl × 1.50, confirm with client) ──
  ...areaRulesForMaterialOnly('Reflective',
    [575.54, 542.96, 504.86, 479.61, 464.15, 442.73, 383.69],
    'Reflective estimate'),

  setupFee(195),
]

// ══════════════════════════════════════════════════════════════════════════════
//  PRODUCT MAP
// ══════════════════════════════════════════════════════════════════════════════
const PRODUCT_MAP = [
  { category: 'businessCards', rules: BUSINESS_CARDS_RULES },
  { category: 'coffeeSleeves', rules: COFFEE_SLEEVES_RULES },
  { category: 'labelsUV',      rules: LABELS_UV_RULES },
  { category: 'raceNumbers',   rules: RACE_NUMBER_RULES },
  { category: 'stamps',        rules: STAMPS_RULES },
  { category: 'laser',         rules: LASER_RULES },
  { category: 'vinylStickers', rules: VINYL_STICKERS_RULES },
]

// ══════════════════════════════════════════════════════════════════════════════
//  DISCOVER MODE
// ══════════════════════════════════════════════════════════════════════════════
async function discover() {
  const { data: groups, error } = await sb
    .from('product_groups')
    .select('id, slug, name, division')
    .eq('is_active', true)
    .order('name')
  if (error) { console.error(error); process.exit(1) }

  console.log(`\n${'─'.repeat(70)}`)
  console.log(`Found ${groups.length} active product groups`)
  console.log(`${'─'.repeat(70)}`)

  for (const g of groups) {
    const { count } = await sb.from('pricing_rules').select('*', { count: 'exact', head: true })
      .eq('product_group_id', g.id).eq('is_active', true)
    const { data: templates } = await sb.from('product_templates')
      .select('name, template_parameters(param_key, options)')
      .eq('product_group_id', g.id).eq('is_active', true).limit(1)
    console.log(`\n  ${g.slug}  (${g.division ?? '—'})  rules: ${count ?? 0}`)
    for (const t of (templates ?? [])) {
      console.log(`    template: ${t.name}`)
      for (const p of (t.template_parameters ?? [])) {
        const opts = Array.isArray(p.options) ? p.options.slice(0, 6).join(' | ') : JSON.stringify(p.options).slice(0, 100)
        console.log(`      ${p.param_key}: ${opts}`)
      }
    }
  }
  console.log()
}

// ══════════════════════════════════════════════════════════════════════════════
//  SEED MODE
// ══════════════════════════════════════════════════════════════════════════════
async function seed() {
  const { data: allGroups, error } = await sb.from('product_groups').select('id, slug, name').eq('is_active', true)
  if (error) { console.error('Could not load product_groups:', error); process.exit(1) }

  const bySlug = Object.fromEntries(allGroups.map(g => [g.slug, { id: g.id, name: g.name }]))

  const resolved = PRODUCT_MAP.map(({ category, rules }) => {
    const candidates = SLUG_MAP[category] ?? []
    const match = candidates.map(s => bySlug[s]).find(Boolean)
    return { category, rules, match, candidates }
  })

  console.log(`\n${'═'.repeat(72)}`)
  console.log('  PRICING SEED PLAN')
  console.log(`${'═'.repeat(72)}`)
  for (const { category, rules, match, candidates } of resolved) {
    const status = match
      ? `✓  "${match.name}" (${Object.keys(bySlug).find(s => bySlug[s] === match)})`
      : `✗  NOT FOUND — tried: ${candidates.join(', ')}`
    console.log(`  ${category.padEnd(15)} ${status}  [${rules.length} rules]`)
  }
  console.log(`${'═'.repeat(72)}\n`)

  if (DRY_RUN) {
    console.log('DRY RUN — no changes made. Sample of rules per product:\n')
    for (const { category, rules, match } of resolved) {
      if (!match) continue
      console.log(`── ${category}`)
      rules.slice(0, 4).forEach(r => console.log('  ', JSON.stringify({ type: r.rule_type, cond: r.conditions, price: r.price_value })))
      console.log(`  ... (${rules.length} total)\n`)
    }
    return
  }

  if (!FORCE) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await new Promise(res => rl.question('Proceed? This will DELETE existing rules and INSERT new ones. (yes/no): ', res))
    rl.close()
    if (answer.trim().toLowerCase() !== 'yes') { console.log('Aborted.'); process.exit(0) }
  }

  let totalInserted = 0, totalDeleted = 0

  for (const { category, rules, match } of resolved) {
    if (!match) { console.log(`  SKIP  ${category} — no matching slug`); continue }

    const { count: deleted } = await sb
      .from('pricing_rules').delete({ count: 'exact' }).eq('product_group_id', match.id)
    totalDeleted += deleted ?? 0

    const rows = rules.map(r => ({ ...r, product_group_id: match.id }))
    const { error: err } = await sb.from('pricing_rules').insert(rows)

    if (err) {
      console.error(`  ERROR  ${category}:`, err.message)
    } else {
      console.log(`  ✓  ${category.padEnd(15)} deleted ${String(deleted ?? 0).padStart(3)}, inserted ${rows.length}  →  ${match.name}`)
      totalInserted += rows.length
    }
  }

  console.log(`\nDone. Deleted ${totalDeleted} old rules, inserted ${totalInserted} new rules.\n`)
}

if (DISCOVER) {
  await discover()
} else {
  await seed()
}
