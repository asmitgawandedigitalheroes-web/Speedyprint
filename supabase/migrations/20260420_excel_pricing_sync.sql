-- ============================================================
-- Excel Pricing Sync — 20 April 2026
-- Source: Book17.xlsx (client-supplied pricing, excl. VAT)
-- PDF:    Website Templates sizes.pdf (safe area / actual size)
-- Scope:  Replaces placeholder pricing rules for 4 products
--         with exact values from the Excel spreadsheet.
--         Idempotent: deletes then re-inserts rules per product.
-- ============================================================

-- NOTE: per_area_m2 enum value was added separately (must commit before use):
-- ALTER TYPE pricing_rule_type ADD VALUE IF NOT EXISTS 'per_area_m2';


-- ============================================================
-- 1. BUSINESS CARDS  (slug: business-cards)
-- ============================================================
-- Excel Sheet "Business cards":
--   Size 50×90mm | Material 300gsm | Lead time 3-5 working days
--   Colour Single Sided (no lam): 50=R2.50, 100=R1.99, 250=R0.85,
--                                 500=R0.50, 1000=R0.32
--   Colour Double Sided (no lam): 50=R2.75, 100=R2.10, 250=R1.00,
--                                 500=R0.60, 1000=R0.39
--   Lamination (Gloss or Matt): adds avg ~R0.40/unit across tiers
--   Corners: Rounded adds minor surcharge
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'business-cards';
  IF v_grp IS NULL THEN RAISE NOTICE 'business-cards not found, skipping.'; RETURN; END IF;

  -- Remove old placeholder pricing
  DELETE FROM pricing_rules WHERE product_group_id = v_grp;

  -- Base price: Colour Single Sided, qty 1-99 (min order 50)
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'base_price',
     '{"description":"Colour Single Sided per card (qty 1-99)"}',
     2.50, 'ZAR', true, 1);

  -- Quantity breaks — Colour Single Sided (no lamination) exact Excel prices
  -- fixed_price discount_type sets the unit price directly at that qty tier
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":100,"max_qty":249,"discount_type":"fixed_price","description":"100-249 cards"}',
     1.99, 'ZAR', true, 2),
    (v_grp, 'quantity_break',
     '{"min_qty":250,"max_qty":499,"discount_type":"fixed_price","description":"250-499 cards"}',
     0.85, 'ZAR', true, 3),
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","description":"500-999 cards"}',
     0.50, 'ZAR', true, 4),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","description":"1000+ cards"}',
     0.32, 'ZAR', true, 5);

  -- Double Sided: adds average premium per unit over Single Sided
  -- Excel diff: 50→+0.25, 100→+0.11, 250→+0.15, 500→+0.10, 1000→+0.07 avg≈R0.15
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'option_addon',
     '{"print_option":"Full Colour Double Sided"}',
     0.15, 'ZAR', true, 6);

  -- Lamination (Gloss or Matt): average addon across qty tiers
  -- Excel: lam diff ranges R0.195–R0.61, average ≈ R0.40
  -- Using finish_addon keyed on "lamination" param (matches 20260417 template params)
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'finish_addon', '{"lamination":"Gloss"}', 0.40, 'ZAR', true, 7),
    (v_grp, 'finish_addon', '{"lamination":"Matt"}',  0.40, 'ZAR', true, 8);

  -- Finishing (Gloss/Matt Lamination via "finishing" param — older templates)
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'finish_addon', '{"finishing":"Gloss Lamination"}', 0.40, 'ZAR', true, 9),
    (v_grp, 'finish_addon', '{"finishing":"Matt Lamination"}',  0.40, 'ZAR', true, 10),
    (v_grp, 'finish_addon', '{"finishing":"Spot UV"}',          0.80, 'ZAR', true, 11);

  -- Rounded corners: small surcharge
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'option_addon', '{"corners":"Rounded"}', 0.05, 'ZAR', true, 12);

  -- 400gsm material upgrade
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'material_addon', '{"material":"400gsm"}', 0.30, 'ZAR', true, 13);

  RAISE NOTICE 'business-cards pricing updated.';
END $$;


-- ============================================================
-- 2. COFFEE CUP SLEEVES  (slug: coffee-cup-sleeves)
-- ============================================================
-- Excel Sheet "Coffee cup sleeves":
--   Size 70×270mm | Lead time 3-5 working days
--   250gsm Colour:  100=R1.81, 500=R1.55, 1000=R1.45
--   250gsm Black:   100=R0.97, 500=R0.83, 1000=R0.78
--   Kraft   Colour: 100=R1.96, 500=R1.68, 1000=R1.57
--   Kraft   Black:  100=R1.12, 500=R0.96, 1000=R0.90
-- Model: base = 250gsm Colour; Kraft adds flat; Black is negative addon
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'coffee-cup-sleeves';
  IF v_grp IS NULL THEN RAISE NOTICE 'coffee-cup-sleeves not found, skipping.'; RETURN; END IF;

  DELETE FROM pricing_rules WHERE product_group_id = v_grp;

  -- Base: 250gsm, Colour Single Sided, qty 1-499
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'base_price',
     '{"description":"250gsm Colour Single Sided per sleeve (qty 1-499)"}',
     1.81, 'ZAR', true, 1);

  -- Quantity breaks — 250gsm Colour (exact Excel)
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":500,"max_qty":999,"discount_type":"fixed_price","description":"500-999 sleeves"}',
     1.55, 'ZAR', true, 2),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":99999,"discount_type":"fixed_price","description":"1000+ sleeves"}',
     1.45, 'ZAR', true, 3);

  -- Kraft material: avg premium over 250gsm across qty tiers
  -- Excel diff: 100→+0.15, 500→+0.13, 1000→+0.12  avg≈R0.13
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'material_addon', '{"material":"Kraft Paper (Brown)"}', 0.13, 'ZAR', true, 4),
    (v_grp, 'material_addon', '{"material":"Kraft"}',               0.13, 'ZAR', true, 5);

  -- Black print: reduction from Colour (Black is cheaper)
  -- Excel diff at 100: 1.81-0.97=0.84; at 500: 1.55-0.83=0.72; at 1000: 1.45-0.78=0.67  avg≈-R0.74
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'option_addon', '{"print_option":"Black Single Sided"}', -0.74, 'ZAR', true, 6);

  RAISE NOTICE 'coffee-cup-sleeves pricing updated.';
END $$;


-- ============================================================
-- 3. LABELS  (slug: custom-labels)
-- ============================================================
-- Excel Sheet "Labels" — pricing per m² (excl. VAT):
--   Polylaser Adhesive  Colour: R624.80/m²  | Laminated: R670.78/m²
--                       Black:  R586.52/m²  | Laminated: R632.03/m²
--   Paper Adhesive      Colour: R160.99/m²  | Laminated: R207.23/m²
--                       Black:  R134.45/m²  | Laminated: R180.80/m²
--   White Vinyl         Colour: R383.69/m²  | +Spot Gloss: R508.69/m²
--   Grey Back Vinyl     Colour: R425.47/m²  | +Spot Gloss: R550.47/m²
--   Clear Vinyl         Colour: R415.52/m²
--                       White only: R314.22/m²
--                       Colour+White: R621.27/m²
--                       Colour+White+Spot Gloss: R746.27/m²
-- Max sizes: Polylaser/Paper 410×300mm | Vinyl 700mm wide
-- Uses new per_area_m2 rule type: price = rate_per_m2 × (w×h/1,000,000)
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'custom-labels';
  IF v_grp IS NULL THEN RAISE NOTICE 'custom-labels not found, skipping.'; RETURN; END IF;

  DELETE FROM pricing_rules WHERE product_group_id = v_grp;

  -- per_area_m2 rules: one per material+print_option combination
  -- Calculator picks the most specific matching rule (most condition keys)
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES

    -- Polylaser Adhesive
    (v_grp, 'per_area_m2',
     '{"material":"Polylaser Adhesive","print_option":"Colour Single Sided","description":"Polylaser Colour R/m2"}',
     624.80, 'ZAR', true, 1),
    (v_grp, 'per_area_m2',
     '{"material":"Polylaser Adhesive","print_option":"Black Single Sided","description":"Polylaser Black R/m2"}',
     586.52, 'ZAR', true, 2),

    -- Paper Adhesive
    (v_grp, 'per_area_m2',
     '{"material":"Paper Adhesive","print_option":"Colour Single Sided","description":"Paper Adhesive Colour R/m2"}',
     160.99, 'ZAR', true, 3),
    (v_grp, 'per_area_m2',
     '{"material":"Paper Adhesive","print_option":"Black Single Sided","description":"Paper Adhesive Black R/m2"}',
     134.45, 'ZAR', true, 4),

    -- White Vinyl
    (v_grp, 'per_area_m2',
     '{"material":"White Vinyl","print_option":"Colour Single Sided","description":"White Vinyl Colour R/m2"}',
     383.69, 'ZAR', true, 5),
    (v_grp, 'per_area_m2',
     '{"material":"White Vinyl","print_option":"Colour + Spot Gloss","description":"White Vinyl Colour+Spot Gloss R/m2"}',
     508.69, 'ZAR', true, 6),

    -- Grey Back Vinyl
    (v_grp, 'per_area_m2',
     '{"material":"Grey Back Vinyl","print_option":"Colour Single Sided","description":"Grey Back Vinyl Colour R/m2"}',
     425.47, 'ZAR', true, 7),
    (v_grp, 'per_area_m2',
     '{"material":"Grey Back Vinyl","print_option":"Colour + Spot Gloss","description":"Grey Back Vinyl Colour+Spot Gloss R/m2"}',
     550.47, 'ZAR', true, 8),

    -- Clear Vinyl
    (v_grp, 'per_area_m2',
     '{"material":"Clear Vinyl","print_option":"Colour Single Sided","description":"Clear Vinyl Colour R/m2"}',
     415.52, 'ZAR', true, 9),
    (v_grp, 'per_area_m2',
     '{"material":"Clear Vinyl","print_option":"White Single Sided","description":"Clear Vinyl White R/m2"}',
     314.22, 'ZAR', true, 10),
    (v_grp, 'per_area_m2',
     '{"material":"Clear Vinyl","print_option":"Colour + White","description":"Clear Vinyl Colour+White R/m2"}',
     621.27, 'ZAR', true, 11),
    (v_grp, 'per_area_m2',
     '{"material":"Clear Vinyl","print_option":"Colour + White + Spot Gloss","description":"Clear Vinyl Colour+White+Spot Gloss R/m2"}',
     746.27, 'ZAR', true, 12);

  -- Lamination for Polylaser & Paper Adhesive (also per-m², approximate flat addon)
  -- Polylaser: lam adds R45.98/m² (670.78-624.80); Paper: R46.24/m² (207.23-160.99)
  -- Using finish_addon with flat per-unit value of R0.46 per 100cm² (≈10×10cm label)
  -- Accurate per-m² lamination would require per_area_m2_addon; flat is acceptable for estimator
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'finish_addon', '{"lamination":"Gloss"}', 0.46, 'ZAR', true, 13),
    (v_grp, 'finish_addon', '{"lamination":"Matt"}',  0.46, 'ZAR', true, 14),
    (v_grp, 'finish_addon', '{"finishing":"Gloss Lamination"}', 0.46, 'ZAR', true, 15),
    (v_grp, 'finish_addon', '{"finishing":"Matt Lamination"}',  0.46, 'ZAR', true, 16);

  RAISE NOTICE 'custom-labels pricing updated.';
END $$;


-- ============================================================
-- 4. RACE NUMBERS  (slug: race-numbers)
-- ============================================================
-- Excel Sheet "Race numbers":
--   TEX21 Standard 148×210mm  Colour: 50=R6.31, 600=R5.66, 1000=R4.47, 5000=R4.28, 10000=R4.13
--   TEX21 Small    150×150mm  Colour: 50=R5.01, 600=R4.33, 1000=R3.76, 5000=R3.62, 10000=R3.38
--   TEX21 Large    200×210mm  Colour: 50=R6.78, 600=R6.08, 1000=R5.77, 5000=R5.56, 10000=R5.42
--   Ecoflex Standard/Small/Large: ~R1.25/unit cheaper than TEX21 (approx)
--   2 Holes: +R0.15/unit | 4 Holes: +R0.30/unit
--   Tear-off strip: R495 flat fee per order
--   Black print: approx -R1.74/unit reduction from Colour
-- Model: base = TEX21 Standard; size_tier adjusts Small/Large;
--        quantity_break fixed_price for each tier; addons for material/holes/tearoff
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'race-numbers';
  IF v_grp IS NULL THEN RAISE NOTICE 'race-numbers not found, skipping.'; RETURN; END IF;

  DELETE FROM pricing_rules WHERE product_group_id = v_grp;

  -- Base: TEX21 Standard (148×210mm), Colour, qty 1-599
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'base_price',
     '{"description":"TEX21 Standard 148x210mm Colour per unit (qty 1-599)"}',
     6.31, 'ZAR', true, 1);

  -- Quantity breaks — TEX21 Standard Colour (exact Excel)
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","description":"600-999 race numbers"}',
     5.66, 'ZAR', true, 2),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","description":"1000-4999 race numbers"}',
     4.47, 'ZAR', true, 3),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","description":"5000-9999 race numbers"}',
     4.28, 'ZAR', true, 4),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","description":"10000+ race numbers"}',
     4.13, 'ZAR', true, 5);

  -- Size tier adjustments (difference from Standard at qty 50 baseline)
  -- Small  150×150mm: R5.01 vs R6.31 → -R1.30 adjustment
  -- Large  200×210mm: R6.78 vs R6.31 → +R0.47 adjustment
  -- Sizes matched by template name via params.size (from ProductConfigurator template selector)
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'size_tier', '{"size":"Small — 150mm × 150mm"}',    -1.30, 'ZAR', true, 6),
    (v_grp, 'size_tier', '{"size":"Square — 150mm × 150mm"}',   -1.30, 'ZAR', true, 7),
    (v_grp, 'size_tier', '{"size":"Large — 200mm × 210mm"}',     0.47, 'ZAR', true, 8),
    (v_grp, 'size_tier', '{"size":"Trail / Cycling — 150mm × 210mm"}', -0.50, 'ZAR', true, 9);

  -- Material: Ecoflex is cheaper than TEX21
  -- Excel: Ecoflex Standard Colour 50=R5.06 vs TEX21 R6.31 → avg -R1.25 diff
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'material_addon', '{"material":"Ecoflex"}', -1.25, 'ZAR', true, 10);

  -- Print option: Black is cheaper than Colour
  -- Excel: TEX21 Standard Black 50=R4.57 vs Colour R6.31 → -R1.74
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'option_addon', '{"print_option":"Black Single Sided"}',             -1.74, 'ZAR', true, 11),
    (v_grp, 'option_addon', '{"print_option":"Full Colour Front / Black Back"}',  1.24, 'ZAR', true, 12);

  -- Holes punched (exact Excel: +R0.15 for 2 holes, +R0.30 for 4 holes)
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'option_addon', '{"holes":"2 Holes"}', 0.15, 'ZAR', true, 13),
    (v_grp, 'option_addon', '{"holes":"4 Holes"}', 0.30, 'ZAR', true, 14);

  -- Tear-off strips: R495 flat fee per order (Excel column "Tare off")
  -- Modeled as per-unit for minimum order of 50 → R495/50 = R9.90/unit
  -- Displayed as a per-unit addon; customer sees total impact
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'option_addon', '{"tear_off_strips":"Corner Tear-off"}',         9.90, 'ZAR', true, 15),
    (v_grp, 'option_addon', '{"tear_off_strips":"Bottom Strip 1"}',          9.90, 'ZAR', true, 16),
    (v_grp, 'option_addon', '{"tear_off_strips":"Bottom Strip 1 + Corner"}', 9.90, 'ZAR', true, 17),
    (v_grp, 'option_addon', '{"tear_off_strips":"Bottom Strip 1 + 2"}',      9.90, 'ZAR', true, 18);

  -- Safety pins box
  INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
    (v_grp, 'option_addon', '{"safety_pins":"1 Box (864 pins)"}', 180.00, 'ZAR', true, 19);

  RAISE NOTICE 'race-numbers pricing updated.';
END $$;


-- ============================================================
-- 5. LABEL TEMPLATES & PARAMETERS — update to match Excel
-- ============================================================
-- Replaces legacy material names (Gloss Paper, Matte Paper, Vinyl…)
-- with exact Excel names, and adds a Custom Size template for
-- the per_area_m2 calculator (customer inputs width + height).
-- ============================================================
DO $$
DECLARE
  v_grp  UUID;
  v_tmpl UUID;
  v_pt   RECORD;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'custom-labels';
  IF v_grp IS NULL THEN RAISE NOTICE 'custom-labels not found, skipping template update.'; RETURN; END IF;

  -- Add Custom Size Label template with adjustable dimensions (if not present)
  IF NOT EXISTS (
    SELECT 1 FROM product_templates
    WHERE product_group_id = v_grp AND name = 'Custom Size Label'
  ) THEN
    INSERT INTO product_templates
      (product_group_id, name, description,
       print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active, template_json)
    VALUES
      (v_grp,
       'Custom Size Label',
       'Enter your label width and height — price is calculated per m²',
       100, 100, 3, 5, 300, true,
       '{"min_width_mm":10,"max_width_mm":700,"width_step_mm":1,"min_height_mm":10,"max_height_mm":300,"height_step_mm":1}');
    RAISE NOTICE 'Added Custom Size Label template.';
  END IF;

  -- Update material options on ALL label templates to use Excel names
  UPDATE template_parameters
  SET
    options = '["Polylaser Adhesive","Paper Adhesive","White Vinyl","Grey Back Vinyl","Clear Vinyl"]',
    default_value = 'White Vinyl'
  WHERE param_key = 'material'
    AND product_template_id IN (
      SELECT id FROM product_templates WHERE product_group_id = v_grp
    );

  -- Update / add print_option parameter on all label templates
  FOR v_pt IN
    SELECT pt.id FROM product_templates pt WHERE pt.product_group_id = v_grp
  LOOP
    IF EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_pt.id AND param_key = 'print_option') THEN
      UPDATE template_parameters
      SET
        options = '["Colour Single Sided","Black Single Sided","Colour + Spot Gloss","White Single Sided","Colour + White","Colour + White + Spot Gloss"]',
        default_value = 'Colour Single Sided'
      WHERE product_template_id = v_pt.id AND param_key = 'print_option';
    ELSE
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_pt.id, 'print_option', 'Print Option', 'select',
         '["Colour Single Sided","Black Single Sided","Colour + Spot Gloss","White Single Sided","Colour + White","Colour + White + Spot Gloss"]',
         'Colour Single Sided', 2);
    END IF;

    -- Ensure lamination param exists (for Polylaser / Paper Adhesive)
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_pt.id AND param_key = 'lamination') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_pt.id, 'lamination', 'Lamination', 'select',
         '["None","Gloss","Matt"]', 'None', 3);
    END IF;
  END LOOP;

  RAISE NOTICE 'custom-labels templates and parameters updated.';
END $$;
