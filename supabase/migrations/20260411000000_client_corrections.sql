-- ============================================================
-- Client Corrections — April 2026
-- Uses slug/name lookups instead of hardcoded UUIDs so the
-- migration works regardless of how IDs were generated.
-- ============================================================

-- ============================================================
-- 1. SITE SETTINGS — contact details
-- ============================================================
INSERT INTO site_settings (key, value) VALUES
  ('company_phone', '011 027 1811'),
  ('company_address', '13 Langwa Street, Strydompark, Randburg')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- ============================================================
-- 2. LABELS (slug: custom-labels)
-- ============================================================

UPDATE product_groups
SET description = 'High-quality custom labels printed on premium materials. Available in white vinyl, paper adhesive, grey-back vinyl, and clear vinyl with matte or spot-gloss finishes.'
WHERE slug = 'custom-labels';

-- Enable custom size UI on all label templates
UPDATE product_templates
SET template_json = '{"min_width_mm": 20, "max_width_mm": 300, "width_step_mm": 1, "min_height_mm": 10, "max_height_mm": 300, "height_step_mm": 1}'
WHERE product_group_id = (SELECT id FROM product_groups WHERE slug = 'custom-labels');

-- Update material options on all label templates
UPDATE template_parameters
SET options = '["1-Year White Vinyl", "Paper Adhesive", "3-Year Gray Back Vinyl", "1-Year Clear Vinyl"]',
    default_value = '1-Year White Vinyl'
WHERE param_key = 'material'
  AND product_template_id IN (
    SELECT pt.id FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.slug = 'custom-labels'
  );

-- Update finish options on all label templates
UPDATE template_parameters
SET options = '["None", "Matte", "Spot-Gloss"]',
    param_label = 'Print Finish',
    default_value = 'Matte'
WHERE param_key = 'finish'
  AND product_template_id IN (
    SELECT pt.id FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.slug = 'custom-labels'
  );

-- Add material + finish params to any label template that doesn't have them yet
DO $$
DECLARE
  v_tmpl RECORD;
BEGIN
  FOR v_tmpl IN
    SELECT pt.id
    FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.slug = 'custom-labels'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'material') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'material', 'Material', 'select',
              '["1-Year White Vinyl", "Paper Adhesive", "3-Year Gray Back Vinyl", "1-Year Clear Vinyl"]',
              '1-Year White Vinyl', 1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'finish') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'finish', 'Print Finish', 'select',
              '["None", "Matte", "Spot-Gloss"]', 'Matte', 2);
    END IF;
  END LOOP;
END $$;

-- Add/update pricing for new material variants
DO $$
DECLARE v_grp_id UUID;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'custom-labels';
  IF v_grp_id IS NULL THEN RETURN; END IF;

  -- Clear vinyl add-on
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp_id AND rule_type = 'material_addon' AND conditions->>'material' = '1-Year Clear Vinyl') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES (v_grp_id, 'material_addon', '{"material": "1-Year Clear Vinyl"}', 0.50, 'ZAR', true, 6);
  END IF;
  -- 3-Year Gray Back Vinyl add-on
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp_id AND rule_type = 'material_addon' AND conditions->>'material' = '3-Year Gray Back Vinyl') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES (v_grp_id, 'material_addon', '{"material": "3-Year Gray Back Vinyl"}', 0.75, 'ZAR', true, 7);
  END IF;
  -- Spot-Gloss finish add-on
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp_id AND rule_type = 'finish_addon' AND conditions->>'finish' = 'Spot-Gloss') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES (v_grp_id, 'finish_addon', '{"finish": "Spot-Gloss"}', 0.40, 'ZAR', true, 8);
  END IF;
END $$;

-- ============================================================
-- 3. RACE BIBS / RACE NUMBERS (slug: race-bibs)
-- ============================================================

UPDATE product_groups
SET name = 'Race Numbers',
    slug = 'race-numbers',
    description = 'Professional race numbers for road races, marathons, triathlons, and cycling events. Durable TEX21 or Ecoflex materials with full-colour or black printing.'
WHERE slug = 'race-bibs';

-- Update existing templates to correct sizes
UPDATE product_templates
SET name        = 'Standard — 148mm × 210mm',
    description = 'Standard race number: 148mm × 210mm',
    print_width_mm  = 148,
    print_height_mm = 210
WHERE product_group_id = (SELECT id FROM product_groups WHERE slug = 'race-numbers')
  AND print_width_mm = 240 AND print_height_mm = 160;   -- was 'Standard Race Bib'

UPDATE product_templates
SET name        = 'Large — 210mm × 200mm',
    description = 'Large race number: 210mm × 200mm',
    print_width_mm  = 210,
    print_height_mm = 200
WHERE product_group_id = (SELECT id FROM product_groups WHERE slug = 'race-numbers')
  AND print_width_mm = 280 AND print_height_mm = 200;   -- was 'Large Race Bib'

-- Add Small template if it doesn't exist
DO $$
DECLARE v_grp_id UUID;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'race-numbers';
  IF v_grp_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND print_width_mm = 105 AND print_height_mm = 148) THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp_id, 'Small — 105mm × 148mm', 'Small race number: 105mm × 148mm', 105, 148, 3, 5, 300, true);
  END IF;
END $$;

-- Update material options on all race number templates
UPDATE template_parameters
SET options = '["TEX21", "Ecoflex"]',
    default_value = 'TEX21'
WHERE param_key = 'material'
  AND product_template_id IN (
    SELECT pt.id FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.slug = 'race-numbers'
  );

-- Remove old safety_pins Yes/No param (replaced below)
DELETE FROM template_parameters
WHERE param_key = 'safety_pins'
  AND options::text LIKE '%"Yes"%'
  AND product_template_id IN (
    SELECT pt.id FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.slug = 'race-numbers'
  );

-- Add new parameters to all race number templates (skip if already present)
DO $$
DECLARE
  v_tmpl RECORD;
BEGIN
  FOR v_tmpl IN
    SELECT pt.id
    FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.slug = 'race-numbers'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'material') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'material', 'Material', 'select', '["TEX21", "Ecoflex"]', 'TEX21', 1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'print_option') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'print_option', 'Print Option', 'select',
              '["Full Colour Single Sided", "Black Single Sided", "Full Colour Front / Black Back"]',
              'Full Colour Single Sided', 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'holes') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'holes', 'Holes', 'select', '["None", "2 Holes", "4 Holes"]', 'None', 3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'safety_pins') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'safety_pins', 'Safety Pins', 'select', '["None", "1 Box (864 pins)"]', 'None', 4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'tear_off_strips') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'tear_off_strips', 'Tear-Off Strips', 'select',
              '["None", "Single Strip", "Double Strip", "Triple Strip"]', 'None', 5);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 4. EVENT TAGS (slug: event-tags)
-- ============================================================

UPDATE product_groups
SET description = 'Custom event identification tags in a range of sizes and materials. Lanyards and badges are outsourced — contact us for a quote.'
WHERE slug = 'event-tags';

-- Rename the existing 86x54 badge template to 85x120
UPDATE product_templates
SET name = '85mm × 120mm', description = 'Event tag: 85mm × 120mm',
    print_width_mm = 85, print_height_mm = 120
WHERE product_group_id = (SELECT id FROM product_groups WHERE slug = 'event-tags')
  AND print_width_mm = 86 AND print_height_mm = 54;

-- Add 150x150 and 148x105 templates
DO $$
DECLARE v_grp_id UUID;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'event-tags';
  IF v_grp_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND print_width_mm = 150 AND print_height_mm = 150) THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp_id, '150mm × 150mm', 'Event tag: 150mm × 150mm', 150, 150, 2, 3, 300, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND print_width_mm = 148 AND print_height_mm = 105) THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp_id, '148mm × 105mm', 'Event tag: 148mm × 105mm', 148, 105, 2, 3, 300, true);
  END IF;
END $$;

-- Add parameters to all event tag templates
DO $$
DECLARE
  v_tmpl RECORD;
BEGIN
  FOR v_tmpl IN
    SELECT pt.id
    FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.slug = 'event-tags'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'material') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'material', 'Material', 'select', '["300gsm", "Ecoflex Board", "0.9mm ABS"]', '300gsm', 1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'print_option') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'print_option', 'Print Option', 'select',
              '["Full Colour Single Sided", "Black Single Sided", "Full Colour Double Sided", "Black Double Sided", "Full Colour Front / Black Back"]',
              'Full Colour Single Sided', 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'finishing') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'finishing', 'Finishing', 'select', '["None", "Gloss Lamination", "Matt Lamination"]', 'None', 3);
    END IF;
  END LOOP;
END $$;

-- Pricing for event tags
DO $$
DECLARE v_grp_id UUID;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'event-tags';
  IF v_grp_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp_id AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES (v_grp_id, 'base_price', '{"description": "Base price per event tag"}', 2.50, 'ZAR', true, 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp_id AND rule_type = 'quantity_break' AND (conditions->>'min_qty')::int = 100) THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES (v_grp_id, 'quantity_break', '{"min_qty": 100, "max_qty": 499}', 2.00, 'ZAR', true, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp_id AND rule_type = 'quantity_break' AND (conditions->>'min_qty')::int = 500) THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES (v_grp_id, 'quantity_break', '{"min_qty": 500, "max_qty": 9999}', 1.50, 'ZAR', true, 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp_id AND rule_type = 'finish_addon' AND conditions->>'finishing' = 'Gloss Lamination') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES (v_grp_id, 'finish_addon', '{"finishing": "Gloss Lamination"}', 0.50, 'ZAR', true, 4);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp_id AND rule_type = 'finish_addon' AND conditions->>'finishing' = 'Matt Lamination') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES (v_grp_id, 'finish_addon', '{"finishing": "Matt Lamination"}', 0.50, 'ZAR', true, 5);
  END IF;
END $$;

-- ============================================================
-- 5. MTB BOARDS (slug: mtb-number-boards)
-- ============================================================

UPDATE product_groups
SET description = 'Mountain bike number boards in three standard sizes or custom on request. Available in Ecoflex board or 0.9mm ABS with direct print or vinyl decal. Supports timing chip add-ons.'
WHERE slug = 'mtb-number-boards';

-- Update existing template to Large
UPDATE product_templates
SET name = 'Large — 210mm × 200mm', description = 'Large MTB board: 210mm × 200mm',
    print_width_mm = 210, print_height_mm = 200
WHERE product_group_id = (SELECT id FROM product_groups WHERE slug = 'mtb-number-boards')
  AND print_width_mm = 250 AND print_height_mm = 200;

-- Add Small, Standard, Custom templates
DO $$
DECLARE v_grp_id UUID;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'mtb-number-boards';
  IF v_grp_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND print_width_mm = 105 AND print_height_mm = 148) THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp_id, 'Small — 105mm × 148mm', 'Small MTB board: 105mm × 148mm', 105, 148, 3, 5, 300, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND print_width_mm = 148 AND print_height_mm = 210) THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp_id, 'Standard — 148mm × 210mm', 'Standard MTB board: 148mm × 210mm', 148, 210, 3, 5, 300, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND name = 'Custom Size') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active, template_json)
    VALUES (v_grp_id, 'Custom Size', 'Custom size MTB board — contact us for quote', 200, 200, 3, 5, 300, true,
            '{"min_width_mm": 80, "max_width_mm": 400, "width_step_mm": 1, "min_height_mm": 80, "max_height_mm": 400, "height_step_mm": 1}');
  END IF;
END $$;

-- Add parameters to all MTB templates
DO $$
DECLARE
  v_tmpl RECORD;
BEGIN
  FOR v_tmpl IN
    SELECT pt.id
    FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.slug = 'mtb-number-boards'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'material') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'material', 'Material', 'select', '["Ecoflex Board", "0.9mm ABS"]', 'Ecoflex Board', 1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'print_option') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'print_option', 'Print Option', 'select', '["Direct Print", "Vinyl Decal Applied"]', 'Direct Print', 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'timing_chip') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'timing_chip', 'Timing Chip', 'select', '["None", "Squiggle", "G-Inlay", "Dogbone"]', 'None', 3);
    END IF;
  END LOOP;
END $$;

-- Pricing for MTB boards
DO $$
DECLARE v_grp_id UUID;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'mtb-number-boards';
  IF v_grp_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp_id AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES (v_grp_id, 'base_price', '{"description": "Base price per MTB board"}', 35.00, 'ZAR', true, 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp_id AND rule_type = 'option_addon' AND conditions->>'timing_chip' = 'Squiggle') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp_id, 'option_addon', '{"timing_chip": "Squiggle"}', 8.00, 'ZAR', true, 4),
      (v_grp_id, 'option_addon', '{"timing_chip": "G-Inlay"}', 8.00, 'ZAR', true, 5),
      (v_grp_id, 'option_addon', '{"timing_chip": "Dogbone"}', 8.00, 'ZAR', true, 6);
  END IF;
END $$;

-- ============================================================
-- 6. ACRYLIC SIGNS (slug: acrylic-signs)
-- ============================================================

UPDATE product_groups
SET description = 'Precision laser-cut acrylic signs in 3mm or 5mm thickness. Available in clear, white, black or custom colours. Direct print or vinyl decal branding with optional standoff wall mounts.'
WHERE slug = 'acrylic-signs';

-- Rename existing templates to include thickness
UPDATE product_templates
SET name = 'A4 — 210mm × 297mm (3mm)', description = 'A4 acrylic sign, 3mm thickness'
WHERE product_group_id = (SELECT id FROM product_groups WHERE slug = 'acrylic-signs')
  AND print_width_mm = 210 AND print_height_mm = 297;

UPDATE product_templates
SET name = 'A3 — 297mm × 420mm (3mm)', description = 'A3 acrylic sign, 3mm thickness'
WHERE product_group_id = (SELECT id FROM product_groups WHERE slug = 'acrylic-signs')
  AND print_width_mm = 297 AND print_height_mm = 420;

-- Add 5mm and custom templates
DO $$
DECLARE v_grp_id UUID;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'acrylic-signs';
  IF v_grp_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND name LIKE '%5mm%' AND print_width_mm = 210) THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp_id, 'A4 — 210mm × 297mm (5mm)', 'A4 acrylic sign, 5mm thickness', 210, 297, 0, 5, 300, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND name LIKE '%5mm%' AND print_width_mm = 297) THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp_id, 'A3 — 297mm × 420mm (5mm)', 'A3 acrylic sign, 5mm thickness', 297, 420, 0, 5, 300, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND name = 'Custom Size') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active, template_json)
    VALUES (v_grp_id, 'Custom Size', 'Custom size acrylic sign', 300, 400, 0, 5, 300, true,
            '{"min_width_mm": 50, "max_width_mm": 1200, "width_step_mm": 1, "min_height_mm": 50, "max_height_mm": 1200, "height_step_mm": 1}');
  END IF;
END $$;

-- Add parameters to all acrylic sign templates
DO $$
DECLARE
  v_tmpl RECORD;
BEGIN
  FOR v_tmpl IN
    SELECT pt.id
    FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.slug = 'acrylic-signs'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'colour') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'colour', 'Acrylic Colour', 'select', '["Clear", "White", "Black", "Custom (on request)"]', 'Clear', 1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'branding') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'branding', 'Branding Method', 'select', '["Direct Print", "Vinyl Decal"]', 'Direct Print', 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'wall_mount') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'wall_mount', 'Wall Mount (Standoffs)', 'select', '["None", "25mm × 40mm", "30mm × 50mm", "20mm × 105mm"]', 'None', 3);
    END IF;
  END LOOP;
END $$;

-- Standoff pricing add-ons
DO $$
DECLARE v_grp_id UUID;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'acrylic-signs';
  IF v_grp_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp_id AND rule_type = 'option_addon' AND conditions->>'wall_mount' = '25mm × 40mm') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp_id, 'option_addon', '{"wall_mount": "25mm × 40mm"}', 45.00, 'ZAR', true, 4),
      (v_grp_id, 'option_addon', '{"wall_mount": "30mm × 50mm"}', 55.00, 'ZAR', true, 5),
      (v_grp_id, 'option_addon', '{"wall_mount": "20mm × 105mm"}', 65.00, 'ZAR', true, 6);
  END IF;
END $$;

-- ============================================================
-- 7. FLYERS (new product — division: print)
-- ============================================================
DO $$
DECLARE v_grp_id UUID;
BEGIN
  -- Create product group if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug = 'flyers') THEN
    INSERT INTO product_groups (name, slug, division, description, is_active, display_order)
    VALUES ('Flyers', 'flyers', 'print',
            'Full-colour or black flyers in A4, A5, A6, and custom sizes. Available on 80gsm Bond or 130gsm Gloss stock.',
            true, 11);
  END IF;

  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'flyers';

  -- Templates
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND print_width_mm = 210 AND print_height_mm = 297) THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp_id, 'A4 Flyer', 'A4 Flyer: 210mm × 297mm', 210, 297, 3, 5, 300, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND print_width_mm = 148 AND print_height_mm = 210) THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp_id, 'A5 Flyer', 'A5 Flyer: 148mm × 210mm', 148, 210, 3, 5, 300, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND print_width_mm = 105 AND print_height_mm = 148) THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp_id, 'A6 Flyer', 'A6 Flyer: 105mm × 148mm', 105, 148, 3, 5, 300, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND name = 'Custom Size Flyer') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active, template_json)
    VALUES (v_grp_id, 'Custom Size Flyer', 'Custom size flyer — on request', 200, 200, 3, 5, 300, true,
            '{"min_width_mm": 70, "max_width_mm": 420, "width_step_mm": 1, "min_height_mm": 70, "max_height_mm": 420, "height_step_mm": 1}');
  END IF;

  -- Pricing
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp_id AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp_id, 'base_price',      '{"description": "Base price per flyer"}',          1.20, 'ZAR', true, 1),
      (v_grp_id, 'quantity_break',  '{"min_qty": 500,  "max_qty": 999}',                0.80, 'ZAR', true, 2),
      (v_grp_id, 'quantity_break',  '{"min_qty": 1000, "max_qty": 9999}',               0.55, 'ZAR', true, 3),
      (v_grp_id, 'material_addon',  '{"material": "130gsm Gloss"}',                     0.25, 'ZAR', true, 4);
  END IF;
END $$;

-- Add parameters to all flyer templates
DO $$
DECLARE
  v_tmpl RECORD;
BEGIN
  FOR v_tmpl IN
    SELECT pt.id
    FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.slug = 'flyers'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'material') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'material', 'Material', 'select', '["80gsm Bond", "130gsm Gloss"]', '80gsm Bond', 1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'print_option') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'print_option', 'Print Option', 'select',
              '["Full Colour Single Sided", "Black Single Sided", "Full Colour Double Sided", "Black Double Sided", "Full Colour Front / Black Back"]',
              'Full Colour Single Sided', 2);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 8. SELF-INKING STAMPS (slug: self-inking-stamps)
-- ============================================================

UPDATE product_groups
SET description = 'Professional self-inking stamps for businesses. Multiple sizes available — contact us for the full size list. Standard ink colour is black; additional colours available as an add-on.'
WHERE slug = 'self-inking-stamps';

-- Update ink colour parameter label and options
UPDATE template_parameters
SET param_label  = 'Ink Colour',
    options      = '["Black (standard)", "Blue (add-on)", "Red (add-on)", "Green (add-on)"]',
    default_value = 'Black (standard)'
WHERE param_key = 'ink_color'
  AND product_template_id IN (
    SELECT pt.id FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.slug = 'self-inking-stamps'
  );

-- Colour add-on pricing
DO $$
DECLARE v_grp_id UUID;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'self-inking-stamps';
  IF v_grp_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp_id AND rule_type = 'option_addon' AND conditions->>'ink_color' = 'Blue (add-on)') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp_id, 'option_addon', '{"ink_color": "Blue (add-on)"}',  25.00, 'ZAR', true, 3),
      (v_grp_id, 'option_addon', '{"ink_color": "Red (add-on)"}',   25.00, 'ZAR', true, 4),
      (v_grp_id, 'option_addon', '{"ink_color": "Green (add-on)"}', 25.00, 'ZAR', true, 5);
  END IF;
END $$;

-- ============================================================
-- 9. COFFEE CUP SLEEVES (slug: coffee-cup-sleeves)
-- ============================================================

UPDATE product_groups
SET description = 'Branded coffee cup sleeves suitable for S, M, L and XL cups. Available in 250gsm white or kraft paper brown with full-colour or black printing.'
WHERE slug = 'coffee-cup-sleeves';

-- Fix template to correct client size (67mm × 250mm)
UPDATE product_templates
SET name            = 'Standard Sleeve — 67mm × 250mm',
    description     = 'Standard coffee cup sleeve: 67mm × 250mm (suitable for S, M, L & XL cups)',
    print_width_mm  = 67,
    print_height_mm = 250
WHERE product_group_id = (SELECT id FROM product_groups WHERE slug = 'coffee-cup-sleeves')
  AND name LIKE '%Coffee Sleeve%';

-- Update material options
UPDATE template_parameters
SET options       = '["250gsm White", "Kraft Paper (Brown)"]',
    param_label   = 'Material',
    default_value = '250gsm White'
WHERE param_key = 'material'
  AND product_template_id IN (
    SELECT pt.id FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.slug = 'coffee-cup-sleeves'
  );

-- Add print_option to existing sleeve templates
DO $$
DECLARE
  v_tmpl RECORD;
BEGIN
  FOR v_tmpl IN
    SELECT pt.id
    FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.slug = 'coffee-cup-sleeves'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl.id AND param_key = 'print_option') THEN
      INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
      VALUES (v_tmpl.id, 'print_option', 'Print Option', 'select',
              '["Full Colour Single Sided", "Black Single Sided", "Full Colour Double Sided", "Black Double Sided", "Full Colour Front / Black Back"]',
              'Full Colour Single Sided', 2);
    END IF;
  END LOOP;
END $$;

-- Add custom size sleeve template
DO $$
DECLARE v_grp_id UUID;
BEGIN
  SELECT id INTO v_grp_id FROM product_groups WHERE slug = 'coffee-cup-sleeves';
  IF v_grp_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp_id AND name = 'Custom Size Sleeve') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active, template_json)
    VALUES (v_grp_id, 'Custom Size Sleeve', 'Custom size coffee cup sleeve — on request', 67, 250, 3, 5, 300, true,
            '{"min_width_mm": 50, "max_width_mm": 120, "width_step_mm": 1, "min_height_mm": 200, "max_height_mm": 350, "height_step_mm": 1}');
  END IF;
END $$;

-- Add parameters to Custom Size Sleeve
DO $$
DECLARE v_tmpl_id UUID;
BEGIN
  SELECT pt.id INTO v_tmpl_id
  FROM product_templates pt
  JOIN product_groups pg ON pg.id = pt.product_group_id
  WHERE pg.slug = 'coffee-cup-sleeves' AND pt.name = 'Custom Size Sleeve';
  IF v_tmpl_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl_id AND param_key = 'material') THEN
    INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
    VALUES (v_tmpl_id, 'material', 'Material', 'select', '["250gsm White", "Kraft Paper (Brown)"]', '250gsm White', 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = v_tmpl_id AND param_key = 'print_option') THEN
    INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
    VALUES (v_tmpl_id, 'print_option', 'Print Option', 'select',
            '["Full Colour Single Sided", "Black Single Sided", "Full Colour Double Sided", "Black Double Sided", "Full Colour Front / Black Back"]',
            'Full Colour Single Sided', 2);
  END IF;
END $$;
