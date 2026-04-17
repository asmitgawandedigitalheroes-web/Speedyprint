-- ============================================================
-- Excel Catalogue Sync — 17 April 2026
-- Source: "Extended product list .xlsx" (46 client examples)
-- Scope: adds missing templates & parameter options derived
--        from the real jobs in the catalogue spreadsheet.
--        All blocks are idempotent — safe to re-run.
-- ============================================================

-- ============================================================
-- 1. LABELS  (slug: custom-labels)
-- ============================================================
-- Excel row 11: "All Health Yourself Label 80×35mm Polylaser Gloss"
-- reveals a 5th material type missing from the existing options.
-- ============================================================
DO $$
DECLARE
  v_grp_id UUID;
  v_tmpl   RECORD;
  v_opts   JSONB;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'custom-labels';
  IF v_grp_id IS NULL THEN RETURN; END IF;

  -- Append 'Polylaser Gloss' to every label template that doesn't have it
  FOR v_tmpl IN
    SELECT tp.id, tp.options
    FROM template_parameters tp
    JOIN product_templates pt ON pt.id = tp.product_template_id
    WHERE pt.product_group_id = v_grp_id
      AND tp.param_key = 'material'
  LOOP
    IF NOT (v_tmpl.options::text LIKE '%Polylaser Gloss%') THEN
      v_opts := v_tmpl.options || '["Polylaser Gloss"]'::jsonb;
      UPDATE template_parameters SET options = v_opts WHERE id = v_tmpl.id;
    END IF;
  END LOOP;

  -- Polylaser Gloss pricing add-on
  IF NOT EXISTS (
    SELECT 1 FROM pricing_rules
    WHERE  product_group_id = v_grp_id
      AND  rule_type = 'material_addon'
      AND  conditions->>'material' = 'Polylaser Gloss'
  ) THEN
    INSERT INTO pricing_rules
      (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp_id, 'material_addon', '{"material":"Polylaser Gloss"}', 0.30, 'ZAR', true, 9);
  END IF;
END $$;

-- ============================================================
-- 2. COFFEE CUP SLEEVES  (slug: coffee-cup-sleeves)
-- ============================================================
-- Excel: Circle K + FG La Pasta jobs are 70mm × 270mm.
-- Image filenames confirm 70×270mm as the real client size.
-- Previous migration corrected to 67×250mm — both are valid;
-- add the 70×270 as a second template.
-- Excel Lamination column (Gloss | Matt) → add param to all.
-- ============================================================
DO $$
DECLARE
  v_grp_id UUID;
  v_tmpl   RECORD;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'coffee-cup-sleeves';
  IF v_grp_id IS NULL THEN RETURN; END IF;

  -- Add 70 × 270 mm template
  IF NOT EXISTS (
    SELECT 1 FROM product_templates
    WHERE  product_group_id = v_grp_id
      AND  print_width_mm = 70 AND print_height_mm = 270
  ) THEN
    INSERT INTO product_templates
      (product_group_id, name, description,
       print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES
      (v_grp_id,
       'Standard Sleeve — 70mm × 270mm',
       'Coffee cup sleeve: 70mm × 270mm (Circle K, FG La Pasta format)',
       70, 270, 3, 5, 300, true);
  END IF;

  -- Add material + print_option + lamination to all sleeve templates
  FOR v_tmpl IN
    SELECT pt.id
    FROM product_templates pt
    WHERE pt.product_group_id = v_grp_id
  LOOP
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'material') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_tmpl.id, 'material', 'Material', 'select',
         '["250gsm White","Kraft Paper (Brown)"]', '250gsm White', 1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'print_option') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_tmpl.id, 'print_option', 'Print Option', 'select',
         '["Full Colour Single Sided","Black Single Sided","Full Colour Double Sided","Black Double Sided","Full Colour Front / Black Back"]',
         'Full Colour Single Sided', 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'lamination') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_tmpl.id, 'lamination', 'Lamination', 'select',
         '["None","Gloss","Matt"]', 'None', 3);
    END IF;
  END LOOP;

  -- Lamination pricing
  IF NOT EXISTS (
    SELECT 1 FROM pricing_rules
    WHERE  product_group_id = v_grp_id
      AND  rule_type = 'finish_addon'
      AND  conditions->>'lamination' = 'Gloss'
  ) THEN
    INSERT INTO pricing_rules
      (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp_id, 'finish_addon', '{"lamination":"Gloss"}', 0.40, 'ZAR', true, 5),
      (v_grp_id, 'finish_addon', '{"lamination":"Matt"}',  0.40, 'ZAR', true, 6);
  END IF;
END $$;

-- ============================================================
-- 3. BUSINESS CARDS  (slug: business-cards)
-- ============================================================
-- Excel shows all 6 real client jobs at 50mm × 90mm (portrait
-- mini-card) on 300gsm. Existing template is 85×55mm landscape.
-- Adds: 50×90mm template, 300gsm material, Corners param,
-- and Lamination param.
-- ============================================================
DO $$
DECLARE
  v_grp_id UUID;
  v_tmpl   RECORD;
  v_opts   JSONB;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'business-cards';
  IF v_grp_id IS NULL THEN RETURN; END IF;

  -- Add 50 × 90 mm portrait template
  IF NOT EXISTS (
    SELECT 1 FROM product_templates
    WHERE  product_group_id = v_grp_id
      AND  print_width_mm = 50 AND print_height_mm = 90
  ) THEN
    INSERT INTO product_templates
      (product_group_id, name, description,
       print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES
      (v_grp_id,
       'Portrait Business Card — 50mm × 90mm',
       'Portrait format business card: 50mm × 90mm',
       50, 90, 2, 3, 300, true);
  END IF;

  -- Prepend 300gsm to material options on every BC template
  FOR v_tmpl IN
    SELECT tp.id, tp.options
    FROM template_parameters tp
    JOIN product_templates pt ON pt.id = tp.product_template_id
    WHERE pt.product_group_id = v_grp_id
      AND tp.param_key = 'material'
  LOOP
    IF NOT (v_tmpl.options::text LIKE '%300gsm%') THEN
      v_opts := '["300gsm"]'::jsonb || v_tmpl.options;
      UPDATE template_parameters SET options = v_opts WHERE id = v_tmpl.id;
    END IF;
  END LOOP;

  -- Add material + print_option + finishing + corners + lamination
  -- to all BC templates (new portrait one included)
  FOR v_tmpl IN
    SELECT pt.id
    FROM product_templates pt
    WHERE pt.product_group_id = v_grp_id
  LOOP
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'material') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_tmpl.id, 'material', 'Material', 'select',
         '["300gsm","350gsm","400gsm"]', '300gsm', 1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'print_option') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_tmpl.id, 'print_option', 'Print Option', 'select',
         '["Full Colour Single Sided","Full Colour Double Sided"]', 'Full Colour Double Sided', 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'finishing') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_tmpl.id, 'finishing', 'Finishing', 'select',
         '["None","Gloss Lamination","Matt Lamination","Spot UV"]', 'None', 3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'corners') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_tmpl.id, 'corners', 'Corners', 'select',
         '["Straight","Rounded"]', 'Straight', 4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'lamination') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_tmpl.id, 'lamination', 'Lamination', 'select',
         '["None","Gloss","Matt"]', 'None', 5);
    END IF;
  END LOOP;

  -- Pricing
  IF NOT EXISTS (
    SELECT 1 FROM pricing_rules
    WHERE  product_group_id = v_grp_id
      AND  rule_type = 'material_addon'
      AND  conditions->>'material' = '300gsm'
  ) THEN
    INSERT INTO pricing_rules
      (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp_id, 'material_addon', '{"material":"300gsm"}', 0.00, 'ZAR', true, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pricing_rules
    WHERE  product_group_id = v_grp_id
      AND  rule_type = 'option_addon'
      AND  conditions->>'corners' = 'Rounded'
  ) THEN
    INSERT INTO pricing_rules
      (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp_id, 'option_addon', '{"corners":"Rounded"}', 0.30, 'ZAR', true, 9);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pricing_rules
    WHERE  product_group_id = v_grp_id
      AND  rule_type = 'finish_addon'
      AND  conditions->>'lamination' = 'Gloss'
  ) THEN
    INSERT INTO pricing_rules
      (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp_id, 'finish_addon', '{"lamination":"Gloss"}', 0.50, 'ZAR', true, 10),
      (v_grp_id, 'finish_addon', '{"lamination":"Matt"}',  0.50, 'ZAR', true, 11);
  END IF;
END $$;

-- ============================================================
-- 4. RACE NUMBERS  (slug: race-numbers)
-- ============================================================
-- Excel has two missing template sizes:
--   • 150 × 150 mm  — 6 jobs (Jump City, ASA, 3 Peaks, Color
--                     Run, Intercare, Mandela Remembrance)
--   • 150 × 210 mm  — 5 jobs (Cradle Ultra, Dodo Trail, Moka
--                     Trail, Pedal Power, Winelands)
-- Existing: 105×148 (Small), 148×210 (Standard), 210×200 (Large)
-- Also updates tear-off strip options to match Excel column
-- and adds Ecoflex + safety pins + tear-off pricing.
-- ============================================================
DO $$
DECLARE
  v_grp_id UUID;
  v_tmpl   RECORD;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'race-numbers';
  IF v_grp_id IS NULL THEN RETURN; END IF;

  -- ── Template: 150 × 150 mm (square) ────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM product_templates
    WHERE  product_group_id = v_grp_id
      AND  print_width_mm = 150 AND print_height_mm = 150
  ) THEN
    INSERT INTO product_templates
      (product_group_id, name, description,
       print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES
      (v_grp_id,
       'Square — 150mm × 150mm',
       'Square race number: 150mm × 150mm (Jump City, ASA, Color Run formats)',
       150, 150, 3, 5, 300, true);
  END IF;

  -- ── Template: 150 × 210 mm (trail/cycling portrait) ────────
  IF NOT EXISTS (
    SELECT 1 FROM product_templates
    WHERE  product_group_id = v_grp_id
      AND  print_width_mm = 150 AND print_height_mm = 210
  ) THEN
    INSERT INTO product_templates
      (product_group_id, name, description,
       print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES
      (v_grp_id,
       'Trail / Cycling — 150mm × 210mm',
       'Portrait race number: 150mm × 210mm (Cradle Ultra, Dodo Trail, Pedal Power formats)',
       150, 210, 3, 5, 300, true);
  END IF;

  -- ── Add 5 parameters to every race number template ─────────
  FOR v_tmpl IN
    SELECT pt.id
    FROM product_templates pt
    WHERE pt.product_group_id = v_grp_id
  LOOP
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'material') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_tmpl.id, 'material', 'Material', 'select', '["TEX21","Ecoflex"]', 'TEX21', 1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'print_option') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_tmpl.id, 'print_option', 'Print Option', 'select',
         '["Full Colour Single Sided","Black Single Sided","Full Colour Front / Black Back"]',
         'Full Colour Single Sided', 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'holes') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_tmpl.id, 'holes', 'Holes', 'select', '["None","2 Holes","4 Holes"]', 'None', 3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'safety_pins') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_tmpl.id, 'safety_pins', 'Safety Pins', 'select',
         '["None","1 Box (864 pins)"]', 'None', 4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'tear_off_strips') THEN
      INSERT INTO template_parameters
        (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES
        (v_tmpl.id, 'tear_off_strips', 'Tear-Off Strips', 'select',
         '["None","Corner Tear-off","Bottom Strip 1","Bottom Strip 1 + Corner","Bottom Strip 1 + 2"]',
         'None', 5);
    END IF;
  END LOOP;

  -- Update existing tear-off options to use the named-position labels
  UPDATE template_parameters
  SET options = '["None","Corner Tear-off","Bottom Strip 1","Bottom Strip 1 + Corner","Bottom Strip 1 + 2"]'
  WHERE param_key = 'tear_off_strips'
    AND options::text NOT LIKE '%Corner Tear-off%'
    AND product_template_id IN (
      SELECT pt.id FROM product_templates pt
      WHERE pt.product_group_id = v_grp_id
    );

  -- ── Pricing ─────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pricing_rules
    WHERE  product_group_id = v_grp_id
      AND  rule_type = 'material_addon'
      AND  conditions->>'material' = 'Ecoflex'
  ) THEN
    INSERT INTO pricing_rules
      (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp_id, 'material_addon', '{"material":"Ecoflex"}', 1.50, 'ZAR', true, 4);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pricing_rules
    WHERE  product_group_id = v_grp_id
      AND  rule_type = 'option_addon'
      AND  conditions->>'safety_pins' = '1 Box (864 pins)'
  ) THEN
    INSERT INTO pricing_rules
      (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp_id, 'option_addon', '{"safety_pins":"1 Box (864 pins)"}', 180.00, 'ZAR', true, 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pricing_rules
    WHERE  product_group_id = v_grp_id
      AND  rule_type = 'option_addon'
      AND  conditions->>'tear_off_strips' = 'Corner Tear-off'
  ) THEN
    INSERT INTO pricing_rules
      (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp_id, 'option_addon', '{"tear_off_strips":"Corner Tear-off"}',        0.80, 'ZAR', true, 6),
      (v_grp_id, 'option_addon', '{"tear_off_strips":"Bottom Strip 1"}',          1.20, 'ZAR', true, 7),
      (v_grp_id, 'option_addon', '{"tear_off_strips":"Bottom Strip 1 + Corner"}', 1.80, 'ZAR', true, 8),
      (v_grp_id, 'option_addon', '{"tear_off_strips":"Bottom Strip 1 + 2"}',      2.20, 'ZAR', true, 9);
  END IF;
END $$;
