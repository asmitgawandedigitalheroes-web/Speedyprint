-- ============================================================
-- Pricing Exact Sync — 14 May 2026
-- Source: Provided JSON pricing reference (excl. VAT)
-- Scope:  Replaces flat-addon approximations with exact per-tier
--         per-combination fixed_price quantity_break rules for:
--           1. Business Cards  — double-sided and lamination per tier
--           2. Coffee Sleeves  — all 4 material×print combos per tier
--           3. Race Numbers    — all material×size×print combos per tier
--         Labels per-m² rates are already correct — no change.
-- Strategy: quantity_break rules with extra conditions (material,
--           print_option, lamination, size) use the calculator's
--           specificity mechanism to override the default base.
--           Flat option_addon / material_addon / finish_addon for
--           these products are removed to prevent double-counting.
-- ============================================================


-- ============================================================
-- 1. BUSINESS CARDS  (slug: business-cards)
-- ============================================================
-- Exact prices per JSON:
--   Single Sided:  50=2.50, 100=1.99, 250=0.85, 500=0.50, 1000=0.32
--   Single + Lam:  50=3.10, 100=2.60, 250=1.25, 500=0.72, 1000=0.515
--   Double Sided:  50=2.75, 100=2.10, 250=1.00, 500=0.60, 1000=0.39
--   Double + Lam:  50=3.80, 100=3.10, 250=1.45, 500=0.89, 1000=0.62
-- Model: per-tier qty_break rules with lamination / print_option
--        conditions. Removes flat finish_addon and option_addon
--        for lam/double-sided to prevent double-counting.
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'business-cards';
  IF v_grp IS NULL THEN RAISE NOTICE 'business-cards not found, skipping.'; RETURN; END IF;

  DELETE FROM pricing_rules WHERE product_group_id = v_grp;

  -- ── Single Sided — no lamination (default, no extra conditions) ──
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'base_price',
     '{"description":"Colour Single Sided per card (qty 1-99)"}',
     2.50, 'ZAR', true, 1),
    (v_grp, 'quantity_break',
     '{"min_qty":100,"max_qty":249,"discount_type":"fixed_price","description":"SS 100-249"}',
     1.99, 'ZAR', true, 2),
    (v_grp, 'quantity_break',
     '{"min_qty":250,"max_qty":499,"discount_type":"fixed_price","description":"SS 250-499"}',
     0.85, 'ZAR', true, 3),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","description":"SS 500-999"}',
     0.50, 'ZAR', true, 4),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","description":"SS 1000+"}',
     0.32, 'ZAR', true, 5);

  -- ── Single Sided + Lamination (Gloss) — specificity 1 ──
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":99,"discount_type":"fixed_price","lamination":"Gloss","description":"SS+Gloss 1-99"}',
     3.10, 'ZAR', true, 10),
    (v_grp, 'quantity_break',
     '{"min_qty":100,"max_qty":249,"discount_type":"fixed_price","lamination":"Gloss","description":"SS+Gloss 100-249"}',
     2.60, 'ZAR', true, 11),
    (v_grp, 'quantity_break',
     '{"min_qty":250,"max_qty":499,"discount_type":"fixed_price","lamination":"Gloss","description":"SS+Gloss 250-499"}',
     1.25, 'ZAR', true, 12),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","lamination":"Gloss","description":"SS+Gloss 500-999"}',
     0.72, 'ZAR', true, 13),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","lamination":"Gloss","description":"SS+Gloss 1000+"}',
     0.515, 'ZAR', true, 14);

  -- ── Single Sided + Matt Lamination (same prices as Gloss) ──
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":99,"discount_type":"fixed_price","lamination":"Matt","description":"SS+Matt 1-99"}',
     3.10, 'ZAR', true, 20),
    (v_grp, 'quantity_break',
     '{"min_qty":100,"max_qty":249,"discount_type":"fixed_price","lamination":"Matt","description":"SS+Matt 100-249"}',
     2.60, 'ZAR', true, 21),
    (v_grp, 'quantity_break',
     '{"min_qty":250,"max_qty":499,"discount_type":"fixed_price","lamination":"Matt","description":"SS+Matt 250-499"}',
     1.25, 'ZAR', true, 22),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","lamination":"Matt","description":"SS+Matt 500-999"}',
     0.72, 'ZAR', true, 23),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","lamination":"Matt","description":"SS+Matt 1000+"}',
     0.515, 'ZAR', true, 24);

  -- ── Double Sided — no lamination — specificity 1 ──
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":99,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","description":"DS 1-99"}',
     2.75, 'ZAR', true, 30),
    (v_grp, 'quantity_break',
     '{"min_qty":100,"max_qty":249,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","description":"DS 100-249"}',
     2.10, 'ZAR', true, 31),
    (v_grp, 'quantity_break',
     '{"min_qty":250,"max_qty":499,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","description":"DS 250-499"}',
     1.00, 'ZAR', true, 32),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","description":"DS 500-999"}',
     0.60, 'ZAR', true, 33),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","description":"DS 1000+"}',
     0.39, 'ZAR', true, 34);

  -- ── Double Sided + Gloss Lamination — specificity 2 ──
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":99,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","lamination":"Gloss","description":"DS+Gloss 1-99"}',
     3.80, 'ZAR', true, 40),
    (v_grp, 'quantity_break',
     '{"min_qty":100,"max_qty":249,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","lamination":"Gloss","description":"DS+Gloss 100-249"}',
     3.10, 'ZAR', true, 41),
    (v_grp, 'quantity_break',
     '{"min_qty":250,"max_qty":499,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","lamination":"Gloss","description":"DS+Gloss 250-499"}',
     1.45, 'ZAR', true, 42),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","lamination":"Gloss","description":"DS+Gloss 500-999"}',
     0.89, 'ZAR', true, 43),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","lamination":"Gloss","description":"DS+Gloss 1000+"}',
     0.62, 'ZAR', true, 44);

  -- ── Double Sided + Matt Lamination — specificity 2 ──
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":99,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","lamination":"Matt","description":"DS+Matt 1-99"}',
     3.80, 'ZAR', true, 50),
    (v_grp, 'quantity_break',
     '{"min_qty":100,"max_qty":249,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","lamination":"Matt","description":"DS+Matt 100-249"}',
     3.10, 'ZAR', true, 51),
    (v_grp, 'quantity_break',
     '{"min_qty":250,"max_qty":499,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","lamination":"Matt","description":"DS+Matt 250-499"}',
     1.45, 'ZAR', true, 52),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","lamination":"Matt","description":"DS+Matt 500-999"}',
     0.89, 'ZAR', true, 53),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","print_option":"Full Colour Double Sided","lamination":"Matt","description":"DS+Matt 1000+"}',
     0.62, 'ZAR', true, 54);

  -- ── Finishing key aliases (legacy param name support) ──
  -- Same prices as lamination variants above
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":99,"discount_type":"fixed_price","finishing":"Gloss Lamination","description":"SS+GlossLam 1-99"}',
     3.10, 'ZAR', true, 60),
    (v_grp, 'quantity_break',
     '{"min_qty":100,"max_qty":249,"discount_type":"fixed_price","finishing":"Gloss Lamination","description":"SS+GlossLam 100-249"}',
     2.60, 'ZAR', true, 61),
    (v_grp, 'quantity_break',
     '{"min_qty":250,"max_qty":499,"discount_type":"fixed_price","finishing":"Gloss Lamination","description":"SS+GlossLam 250-499"}',
     1.25, 'ZAR', true, 62),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","finishing":"Gloss Lamination","description":"SS+GlossLam 500-999"}',
     0.72, 'ZAR', true, 63),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","finishing":"Gloss Lamination","description":"SS+GlossLam 1000+"}',
     0.515, 'ZAR', true, 64),
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":99,"discount_type":"fixed_price","finishing":"Matt Lamination","description":"SS+MattLam 1-99"}',
     3.10, 'ZAR', true, 65),
    (v_grp, 'quantity_break',
     '{"min_qty":100,"max_qty":249,"discount_type":"fixed_price","finishing":"Matt Lamination","description":"SS+MattLam 100-249"}',
     2.60, 'ZAR', true, 66),
    (v_grp, 'quantity_break',
     '{"min_qty":250,"max_qty":499,"discount_type":"fixed_price","finishing":"Matt Lamination","description":"SS+MattLam 250-499"}',
     1.25, 'ZAR', true, 67),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","finishing":"Matt Lamination","description":"SS+MattLam 500-999"}',
     0.72, 'ZAR', true, 68),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","finishing":"Matt Lamination","description":"SS+MattLam 1000+"}',
     0.515, 'ZAR', true, 69);

  -- ── Spot UV (no per-tier data — keep as finish addon) ──
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'finish_addon', '{"finishing":"Spot UV"}', 0.80, 'ZAR', true, 90);

  -- ── Other addons (unchanged) ──
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'option_addon', '{"corners":"Rounded"}',  0.05, 'ZAR', true, 91),
    (v_grp, 'material_addon', '{"material":"400gsm"}', 0.30, 'ZAR', true, 92);

  RAISE NOTICE 'business-cards pricing updated with exact per-tier values.';
END $$;


-- ============================================================
-- 2. COFFEE CUP SLEEVES  (slug: coffee-cup-sleeves)
-- ============================================================
-- Exact prices per JSON:
--   250gsm Colour: 100=1.813, 500=1.554, 1000=1.4504
--   250gsm Black:  100=0.973, 500=0.834, 1000=0.7784
--   Kraft Colour:  100=1.960, 500=1.680, 1000=1.568
--   Kraft Black:   100=1.120, 500=0.960, 1000=0.896
-- Model: per-combination per-tier qty_break rules.
--        Removes flat material_addon and option_addon for
--        black/kraft to prevent double-counting.
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'coffee-cup-sleeves';
  IF v_grp IS NULL THEN RAISE NOTICE 'coffee-cup-sleeves not found, skipping.'; RETURN; END IF;

  DELETE FROM pricing_rules WHERE product_group_id = v_grp;

  -- ── 250gsm Colour (default — no extra conditions) ──
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'base_price',
     '{"description":"250gsm Colour Single Sided per sleeve (qty 1-499)"}',
     1.813, 'ZAR', true, 1),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","description":"250gsm Colour 500-999"}',
     1.554, 'ZAR', true, 2),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","description":"250gsm Colour 1000+"}',
     1.4504, 'ZAR', true, 3);

  -- ── 250gsm Black — specificity 1 ──
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":499,"discount_type":"fixed_price","print_option":"Black Single Sided","description":"250gsm Black 1-499"}',
     0.973, 'ZAR', true, 10),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","print_option":"Black Single Sided","description":"250gsm Black 500-999"}',
     0.834, 'ZAR', true, 11),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","print_option":"Black Single Sided","description":"250gsm Black 1000+"}',
     0.7784, 'ZAR', true, 12);

  -- ── Kraft Colour — specificity 1 ──
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":499,"discount_type":"fixed_price","material":"Kraft Paper (Brown)","description":"Kraft Colour 1-499"}',
     1.960, 'ZAR', true, 20),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","material":"Kraft Paper (Brown)","description":"Kraft Colour 500-999"}',
     1.680, 'ZAR', true, 21),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","material":"Kraft Paper (Brown)","description":"Kraft Colour 1000+"}',
     1.568, 'ZAR', true, 22);

  -- Alias for "Kraft" short key
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":499,"discount_type":"fixed_price","material":"Kraft","description":"Kraft Colour 1-499 alias"}',
     1.960, 'ZAR', true, 25),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","material":"Kraft","description":"Kraft Colour 500-999 alias"}',
     1.680, 'ZAR', true, 26),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","material":"Kraft","description":"Kraft Colour 1000+ alias"}',
     1.568, 'ZAR', true, 27);

  -- ── Kraft Black — specificity 2 ──
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":499,"discount_type":"fixed_price","material":"Kraft Paper (Brown)","print_option":"Black Single Sided","description":"Kraft Black 1-499"}',
     1.120, 'ZAR', true, 30),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","material":"Kraft Paper (Brown)","print_option":"Black Single Sided","description":"Kraft Black 500-999"}',
     0.960, 'ZAR', true, 31),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","material":"Kraft Paper (Brown)","print_option":"Black Single Sided","description":"Kraft Black 1000+"}',
     0.896, 'ZAR', true, 32);

  -- Alias for "Kraft" short key
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":499,"discount_type":"fixed_price","material":"Kraft","print_option":"Black Single Sided","description":"Kraft Black 1-499 alias"}',
     1.120, 'ZAR', true, 33),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","material":"Kraft","print_option":"Black Single Sided","description":"Kraft Black 500-999 alias"}',
     0.960, 'ZAR', true, 34),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","material":"Kraft","print_option":"Black Single Sided","description":"Kraft Black 1000+ alias"}',
     0.896, 'ZAR', true, 35);

  RAISE NOTICE 'coffee-cup-sleeves pricing updated with exact per-tier per-combination values.';
END $$;


-- ============================================================
-- 3. LABELS  (slug: custom-labels)
-- ============================================================
-- All per-m² base rates are CORRECT in prior migration.
-- No changes required.
-- ============================================================
-- (skipped — labels pricing verified correct)


-- ============================================================
-- 4. RACE NUMBERS  (slug: race-numbers)
-- ============================================================
-- Full per-combination per-tier pricing using qty_break specificity.
-- Default (no extra conditions) = TEX21 Standard Colour.
-- All other combos use extra conditions so calculator picks the
-- most specific matching rule.
-- Removes flat size_tier, material_addon, and print option_addon
-- rules (replaced by per-combination qty_break rules).
-- Hole addon (+R0.15/2-hole set) and tear-off/safety-pins kept.
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'race-numbers';
  IF v_grp IS NULL THEN RAISE NOTICE 'race-numbers not found, skipping.'; RETURN; END IF;

  DELETE FROM pricing_rules WHERE product_group_id = v_grp;

  -- ────────────────────────────────────────────────────────
  -- TEX21 STANDARD 148×210mm — COLOUR (default, no extra conditions)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'base_price',
     '{"description":"TEX21 Standard 148x210mm Colour per unit (qty 1-599)"}',
     6.310, 'ZAR', true, 1),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","description":"TEX21 Std Colour 600-999"}',
     5.660, 'ZAR', true, 2),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","description":"TEX21 Std Colour 1000-4999"}',
     4.470, 'ZAR', true, 3),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","description":"TEX21 Std Colour 5000-9999"}',
     4.280, 'ZAR', true, 4),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","description":"TEX21 Std Colour 10000+"}',
     4.130, 'ZAR', true, 5);

  -- ────────────────────────────────────────────────────────
  -- TEX21 STANDARD — BLACK  (specificity: material+print_option = 2)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"TEX21","print_option":"Black Single Sided","description":"TEX21 Std Black 1-599"}',
     4.570, 'ZAR', true, 10),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"TEX21","print_option":"Black Single Sided","description":"TEX21 Std Black 600-999"}',
     4.330, 'ZAR', true, 11),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"TEX21","print_option":"Black Single Sided","description":"TEX21 Std Black 1000-4999"}',
     4.060, 'ZAR', true, 12),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"TEX21","print_option":"Black Single Sided","description":"TEX21 Std Black 5000-9999"}',
     3.640, 'ZAR', true, 13),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"TEX21","print_option":"Black Single Sided","description":"TEX21 Std Black 10000+"}',
     3.510, 'ZAR', true, 14);

  -- ────────────────────────────────────────────────────────
  -- TEX21 STANDARD — COLOUR FRONT / BLACK BACK  (specificity 2)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"TEX21","print_option":"Full Colour Front / Black Back","description":"TEX21 Std CBB 1-599"}',
     7.572, 'ZAR', true, 15),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"TEX21","print_option":"Full Colour Front / Black Back","description":"TEX21 Std CBB 600-999"}',
     6.792, 'ZAR', true, 16),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"TEX21","print_option":"Full Colour Front / Black Back","description":"TEX21 Std CBB 1000-4999"}',
     5.364, 'ZAR', true, 17),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"TEX21","print_option":"Full Colour Front / Black Back","description":"TEX21 Std CBB 5000-9999"}',
     5.136, 'ZAR', true, 18),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"TEX21","print_option":"Full Colour Front / Black Back","description":"TEX21 Std CBB 10000+"}',
     4.956, 'ZAR', true, 19);

  -- ────────────────────────────────────────────────────────
  -- TEX21 SMALL 150×150mm — COLOUR  (specificity 2)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","description":"TEX21 Small Colour 1-599"}',
     5.010, 'ZAR', true, 20),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","description":"TEX21 Small Colour 600-999"}',
     4.330, 'ZAR', true, 21),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","description":"TEX21 Small Colour 1000-4999"}',
     3.760, 'ZAR', true, 22),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","description":"TEX21 Small Colour 5000-9999"}',
     3.620, 'ZAR', true, 23),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","description":"TEX21 Small Colour 10000+"}',
     3.380, 'ZAR', true, 24);

  -- Square alias (same prices)
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"TEX21","size":"Square — 150mm × 150mm","description":"TEX21 Square Colour 1-599"}',
     5.010, 'ZAR', true, 25),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"TEX21","size":"Square — 150mm × 150mm","description":"TEX21 Square Colour 600-999"}',
     4.330, 'ZAR', true, 26),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"TEX21","size":"Square — 150mm × 150mm","description":"TEX21 Square Colour 1000-4999"}',
     3.760, 'ZAR', true, 27),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"TEX21","size":"Square — 150mm × 150mm","description":"TEX21 Square Colour 5000-9999"}',
     3.620, 'ZAR', true, 28),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"TEX21","size":"Square — 150mm × 150mm","description":"TEX21 Square Colour 10000+"}',
     3.380, 'ZAR', true, 29);

  -- ────────────────────────────────────────────────────────
  -- TEX21 SMALL — BLACK  (specificity 3)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","print_option":"Black Single Sided","description":"TEX21 Small Black 1-599"}',
     4.030, 'ZAR', true, 30),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","print_option":"Black Single Sided","description":"TEX21 Small Black 600-999"}',
     3.590, 'ZAR', true, 31),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","print_option":"Black Single Sided","description":"TEX21 Small Black 1000-4999"}',
     3.190, 'ZAR', true, 32),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","print_option":"Black Single Sided","description":"TEX21 Small Black 5000-9999"}',
     2.740, 'ZAR', true, 33),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","print_option":"Black Single Sided","description":"TEX21 Small Black 10000+"}',
     2.600, 'ZAR', true, 34);

  -- Square alias black
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"TEX21","size":"Square — 150mm × 150mm","print_option":"Black Single Sided","description":"TEX21 Square Black 1-599"}',
     4.030, 'ZAR', true, 35),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"TEX21","size":"Square — 150mm × 150mm","print_option":"Black Single Sided","description":"TEX21 Square Black 600-999"}',
     3.590, 'ZAR', true, 36),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"TEX21","size":"Square — 150mm × 150mm","print_option":"Black Single Sided","description":"TEX21 Square Black 1000-4999"}',
     3.190, 'ZAR', true, 37),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"TEX21","size":"Square — 150mm × 150mm","print_option":"Black Single Sided","description":"TEX21 Square Black 5000-9999"}',
     2.740, 'ZAR', true, 38),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"TEX21","size":"Square — 150mm × 150mm","print_option":"Black Single Sided","description":"TEX21 Square Black 10000+"}',
     2.600, 'ZAR', true, 39);

  -- ────────────────────────────────────────────────────────
  -- TEX21 SMALL — COLOUR FRONT / BLACK BACK  (specificity 3)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","print_option":"Full Colour Front / Black Back","description":"TEX21 Small CBB 1-599"}',
     6.012, 'ZAR', true, 40),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","print_option":"Full Colour Front / Black Back","description":"TEX21 Small CBB 600-999"}',
     5.196, 'ZAR', true, 41),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","print_option":"Full Colour Front / Black Back","description":"TEX21 Small CBB 1000-4999"}',
     4.512, 'ZAR', true, 42),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","print_option":"Full Colour Front / Black Back","description":"TEX21 Small CBB 5000-9999"}',
     4.344, 'ZAR', true, 43),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"TEX21","size":"Small — 150mm × 150mm","print_option":"Full Colour Front / Black Back","description":"TEX21 Small CBB 10000+"}',
     4.056, 'ZAR', true, 44);

  -- ────────────────────────────────────────────────────────
  -- TEX21 LARGE 200×210mm — COLOUR  (specificity 2)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","description":"TEX21 Large Colour 1-599"}',
     6.780, 'ZAR', true, 50),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","description":"TEX21 Large Colour 600-999"}',
     6.080, 'ZAR', true, 51),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","description":"TEX21 Large Colour 1000-4999"}',
     5.770, 'ZAR', true, 52),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","description":"TEX21 Large Colour 5000-9999"}',
     5.560, 'ZAR', true, 53),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","description":"TEX21 Large Colour 10000+"}',
     5.420, 'ZAR', true, 54);

  -- ────────────────────────────────────────────────────────
  -- TEX21 LARGE — BLACK  (specificity 3)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","print_option":"Black Single Sided","description":"TEX21 Large Black 1-599"}',
     5.550, 'ZAR', true, 55),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","print_option":"Black Single Sided","description":"TEX21 Large Black 600-999"}',
     4.870, 'ZAR', true, 56),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","print_option":"Black Single Sided","description":"TEX21 Large Black 1000-4999"}',
     4.470, 'ZAR', true, 57),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","print_option":"Black Single Sided","description":"TEX21 Large Black 5000-9999"}',
     4.060, 'ZAR', true, 58),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","print_option":"Black Single Sided","description":"TEX21 Large Black 10000+"}',
     3.920, 'ZAR', true, 59);

  -- ────────────────────────────────────────────────────────
  -- TEX21 LARGE — COLOUR FRONT / BLACK BACK  (specificity 3)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","print_option":"Full Colour Front / Black Back","description":"TEX21 Large CBB 1-599"}',
     8.136, 'ZAR', true, 60),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","print_option":"Full Colour Front / Black Back","description":"TEX21 Large CBB 600-999"}',
     7.296, 'ZAR', true, 61),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","print_option":"Full Colour Front / Black Back","description":"TEX21 Large CBB 1000-4999"}',
     6.924, 'ZAR', true, 62),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","print_option":"Full Colour Front / Black Back","description":"TEX21 Large CBB 5000-9999"}',
     6.672, 'ZAR', true, 63),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"TEX21","size":"Large — 200mm × 210mm","print_option":"Full Colour Front / Black Back","description":"TEX21 Large CBB 10000+"}',
     6.504, 'ZAR', true, 64);

  -- ────────────────────────────────────────────────────────
  -- ECOFLEX STANDARD — COLOUR  (specificity 1)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"Ecoflex","description":"Ecoflex Std Colour 1-599"}',
     5.060, 'ZAR', true, 70),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"Ecoflex","description":"Ecoflex Std Colour 600-999"}',
     4.430, 'ZAR', true, 71),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"Ecoflex","description":"Ecoflex Std Colour 1000-4999"}',
     3.880, 'ZAR', true, 72),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"Ecoflex","description":"Ecoflex Std Colour 5000-9999"}',
     3.540, 'ZAR', true, 73),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"Ecoflex","description":"Ecoflex Std Colour 10000+"}',
     3.350, 'ZAR', true, 74);

  -- ────────────────────────────────────────────────────────
  -- ECOFLEX STANDARD — BLACK  (specificity 2)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"Ecoflex","print_option":"Black Single Sided","description":"Ecoflex Std Black 1-599"}',
     4.050, 'ZAR', true, 75),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"Ecoflex","print_option":"Black Single Sided","description":"Ecoflex Std Black 600-999"}',
     3.790, 'ZAR', true, 76),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"Ecoflex","print_option":"Black Single Sided","description":"Ecoflex Std Black 1000-4999"}',
     3.540, 'ZAR', true, 77),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"Ecoflex","print_option":"Black Single Sided","description":"Ecoflex Std Black 5000-9999"}',
     3.160, 'ZAR', true, 78),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"Ecoflex","print_option":"Black Single Sided","description":"Ecoflex Std Black 10000+"}',
     3.040, 'ZAR', true, 79);

  -- ────────────────────────────────────────────────────────
  -- ECOFLEX SMALL 150×150mm — COLOUR  (specificity 2)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"Ecoflex","size":"Small — 150mm × 150mm","description":"Ecoflex Small Colour 1-599"}',
     4.290, 'ZAR', true, 80),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"Ecoflex","size":"Small — 150mm × 150mm","description":"Ecoflex Small Colour 600-999"}',
     3.790, 'ZAR', true, 81),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"Ecoflex","size":"Small — 150mm × 150mm","description":"Ecoflex Small Colour 1000-4999"}',
     3.400, 'ZAR', true, 82),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"Ecoflex","size":"Small — 150mm × 150mm","description":"Ecoflex Small Colour 5000-9999"}',
     3.160, 'ZAR', true, 83),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"Ecoflex","size":"Small — 150mm × 150mm","description":"Ecoflex Small Colour 10000+"}',
     3.040, 'ZAR', true, 84);

  -- ────────────────────────────────────────────────────────
  -- ECOFLEX SMALL — BLACK  (specificity 3)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"Ecoflex","size":"Small — 150mm × 150mm","print_option":"Black Single Sided","description":"Ecoflex Small Black 1-599"}',
     3.930, 'ZAR', true, 85),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"Ecoflex","size":"Small — 150mm × 150mm","print_option":"Black Single Sided","description":"Ecoflex Small Black 600-999"}',
     3.490, 'ZAR', true, 86),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"Ecoflex","size":"Small — 150mm × 150mm","print_option":"Black Single Sided","description":"Ecoflex Small Black 1000-4999"}',
     3.110, 'ZAR', true, 87),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"Ecoflex","size":"Small — 150mm × 150mm","print_option":"Black Single Sided","description":"Ecoflex Small Black 5000-9999"}',
     2.670, 'ZAR', true, 88),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"Ecoflex","size":"Small — 150mm × 150mm","print_option":"Black Single Sided","description":"Ecoflex Small Black 10000+"}',
     2.520, 'ZAR', true, 89);

  -- ────────────────────────────────────────────────────────
  -- ECOFLEX LARGE 200×210mm — COLOUR  (specificity 2)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"Ecoflex","size":"Large — 200mm × 210mm","description":"Ecoflex Large Colour 1-599"}',
     6.070, 'ZAR', true, 90),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"Ecoflex","size":"Large — 200mm × 210mm","description":"Ecoflex Large Colour 600-999"}',
     5.390, 'ZAR', true, 91),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"Ecoflex","size":"Large — 200mm × 210mm","description":"Ecoflex Large Colour 1000-4999"}',
     5.330, 'ZAR', true, 92),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"Ecoflex","size":"Large — 200mm × 210mm","description":"Ecoflex Large Colour 5000-9999"}',
     5.060, 'ZAR', true, 93),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"Ecoflex","size":"Large — 200mm × 210mm","description":"Ecoflex Large Colour 10000+"}',
     4.950, 'ZAR', true, 94);

  -- ────────────────────────────────────────────────────────
  -- ECOFLEX LARGE — BLACK  (specificity 3)
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","material":"Ecoflex","size":"Large — 200mm × 210mm","print_option":"Black Single Sided","description":"Ecoflex Large Black 1-599"}',
     5.030, 'ZAR', true, 95),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","material":"Ecoflex","size":"Large — 200mm × 210mm","print_option":"Black Single Sided","description":"Ecoflex Large Black 600-999"}',
     4.380, 'ZAR', true, 96),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","material":"Ecoflex","size":"Large — 200mm × 210mm","print_option":"Black Single Sided","description":"Ecoflex Large Black 1000-4999"}',
     4.050, 'ZAR', true, 97),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","material":"Ecoflex","size":"Large — 200mm × 210mm","print_option":"Black Single Sided","description":"Ecoflex Large Black 5000-9999"}',
     3.660, 'ZAR', true, 98),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","material":"Ecoflex","size":"Large — 200mm × 210mm","print_option":"Black Single Sided","description":"Ecoflex Large Black 10000+"}',
     3.540, 'ZAR', true, 99);

  -- ────────────────────────────────────────────────────────
  -- ADDONS: Holes, Tear-off, Safety pins
  -- Hole addon: +R0.15 per unit per 2-hole set (JSON: hole_addon_per_unit = 0.15)
  -- Tear-off strip: R495 flat per order = R9.90/unit at min qty 50
  -- ────────────────────────────────────────────────────────
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'option_addon', '{"holes":"2 Holes"}',  0.15, 'ZAR', true, 110),
    (v_grp, 'option_addon', '{"holes":"4 Holes"}',  0.30, 'ZAR', true, 111),
    (v_grp, 'option_addon', '{"tear_off_strips":"Corner Tear-off"}',          9.90, 'ZAR', true, 112),
    (v_grp, 'option_addon', '{"tear_off_strips":"Bottom Strip 1"}',           9.90, 'ZAR', true, 113),
    (v_grp, 'option_addon', '{"tear_off_strips":"Bottom Strip 1 + Corner"}',  9.90, 'ZAR', true, 114),
    (v_grp, 'option_addon', '{"tear_off_strips":"Bottom Strip 1 + 2"}',       9.90, 'ZAR', true, 115),
    (v_grp, 'option_addon', '{"safety_pins":"1 Box (864 pins)"}',           180.00, 'ZAR', true, 116);

  RAISE NOTICE 'race-numbers pricing updated with exact per-combination per-tier values.';
END $$;
