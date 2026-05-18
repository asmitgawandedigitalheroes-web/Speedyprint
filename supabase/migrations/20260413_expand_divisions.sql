-- ============================================================
-- Expand Thin Divisions — April 2026
-- Adds missing products for Trophies, Race Numbers, Laser.
-- Safe to re-run: all inserts guarded by NOT EXISTS.
-- ============================================================

-- ============================================================
-- TROPHIES — Add: Engraved Plaques, Medallions, Corporate
--            Awards, Certificate Frames
-- ============================================================

-- 1. Engraved Plaques
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug = 'engraved-plaques') THEN
    INSERT INTO product_groups (name, slug, division, description, is_active, display_order, image_url)
    VALUES ('Engraved Plaques', 'engraved-plaques', 'trophies',
            'Timber, glass, and metal plaques with custom laser engraving. Ideal for recognition awards, achievement boards, and memorial signage.',
            true, 20, '/images/products/wooden-plaques.png');
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'engraved-plaques';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'A5 Timber Plaque') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'A5 Timber Plaque', '210mm × 148mm timber plaque', 210, 148, 0, 5, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'A4 Timber Plaque') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'A4 Timber Plaque', '297mm × 210mm timber plaque', 297, 210, 0, 5, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'A5 Glass Plaque') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'A5 Glass Plaque', '210mm × 148mm glass plaque with standoffs', 210, 148, 0, 5, 300, true); END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'material', 'Material', 'select', '["Timber", "Glass", "Metal", "Acrylic"]', 'Timber', 1
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'material');

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'engraving_lines', 'Engraving Lines', 'select', '["1 line", "2 lines", "3 lines", "4 lines", "Logo + text"]', '2 lines', 2
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'engraving_lines');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
      (v_grp, 'base_price', '{"description":"Base price per plaque (A5 Timber)"}', 320.00, 'ZAR', true, 1),
      (v_grp, 'size_tier', '{"size":"A4"}', 450.00, 'ZAR', true, 2),
      (v_grp, 'material_addon', '{"material":"Glass"}', 180.00, 'ZAR', true, 3),
      (v_grp, 'material_addon', '{"material":"Metal"}', 220.00, 'ZAR', true, 4),
      (v_grp, 'quantity_break', '{"min_qty":5,"max_qty":19}', 280.00, 'ZAR', true, 5),
      (v_grp, 'quantity_break', '{"min_qty":20,"max_qty":9999}', 240.00, 'ZAR', true, 6);
  END IF;
END $$;

-- 2. Medallions
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug = 'medallions') THEN
    INSERT INTO product_groups (name, slug, division, description, is_active, display_order, image_url)
    VALUES ('Medallions', 'medallions', 'trophies',
            'Custom full-colour medallions with ribbon. Suitable for sports events, school awards, and corporate recognition. Diameter from 50mm to 70mm.',
            true, 21, '/images/products/award-trophies.png');
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'medallions';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = '50mm Medallion') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, '50mm Medallion', '50mm diameter medal with ribbon', 50, 50, 1, 3, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = '60mm Medallion') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, '60mm Medallion', '60mm diameter medal with ribbon', 60, 60, 1, 3, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = '70mm Medallion') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, '70mm Medallion', '70mm diameter medal with ribbon', 70, 70, 1, 3, 300, true); END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'finish', 'Finish', 'select', '["Gold", "Silver", "Bronze", "Full Colour"]', 'Gold', 1
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'finish');

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'ribbon_colour', 'Ribbon Colour', 'select', '["Red/Gold", "Blue/Silver", "Green/Gold", "Black/Gold", "Custom"]', 'Red/Gold', 2
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'ribbon_colour');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
      (v_grp, 'base_price', '{"description":"Base price per medallion (50mm)"}', 85.00, 'ZAR', true, 1),
      (v_grp, 'size_tier', '{"size":"60mm"}', 105.00, 'ZAR', true, 2),
      (v_grp, 'size_tier', '{"size":"70mm"}', 130.00, 'ZAR', true, 3),
      (v_grp, 'quantity_break', '{"min_qty":25,"max_qty":99}', 70.00, 'ZAR', true, 4),
      (v_grp, 'quantity_break', '{"min_qty":100,"max_qty":9999}', 55.00, 'ZAR', true, 5);
  END IF;
END $$;

-- 3. Corporate Awards
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug = 'corporate-awards') THEN
    INSERT INTO product_groups (name, slug, division, description, is_active, display_order, image_url)
    VALUES ('Corporate Awards', 'corporate-awards', 'trophies',
            'Premium crystal, glass, and acrylic corporate awards with custom engraving. Perfect for employee recognition, annual gala events, and partner gifting programmes.',
            true, 22, '/images/products/award-trophies.png');
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'corporate-awards';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Prestige Crystal Award') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Prestige Crystal Award', 'Bevelled crystal block award — 100mm × 80mm × 25mm', 100, 80, 0, 5, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Acrylic Award Block') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Acrylic Award Block', 'Full-colour printed acrylic award — 150mm × 100mm', 150, 100, 0, 5, 300, true); END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'material', 'Material', 'select', '["Crystal", "Glass", "Acrylic", "Metal base"]', 'Crystal', 1
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'material');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
      (v_grp, 'base_price', '{"description":"Base price per corporate award"}', 580.00, 'ZAR', true, 1),
      (v_grp, 'material_addon', '{"material":"Crystal"}', 250.00, 'ZAR', true, 2),
      (v_grp, 'quantity_break', '{"min_qty":5,"max_qty":19}', 520.00, 'ZAR', true, 3),
      (v_grp, 'quantity_break', '{"min_qty":20,"max_qty":9999}', 460.00, 'ZAR', true, 4);
  END IF;
END $$;

-- 4. Certificate Frames
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug = 'certificate-frames') THEN
    INSERT INTO product_groups (name, slug, division, description, is_active, display_order, image_url)
    VALUES ('Certificate Frames', 'certificate-frames', 'trophies',
            'A4 and A3 certificate frames in timber and metal finishes. Branded with organisation name or logo engraved on frame. Supplied with glass front.',
            true, 23, '/images/products/wooden-plaques.png');
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'certificate-frames';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'A4 Timber Frame') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'A4 Timber Frame', 'A4 certificate frame in natural timber', 297, 210, 0, 8, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'A3 Timber Frame') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'A3 Timber Frame', 'A3 certificate frame in natural timber', 420, 297, 0, 8, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'A4 Metal Frame') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'A4 Metal Frame', 'A4 certificate frame in brushed metal', 297, 210, 0, 8, 300, true); END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'material', 'Frame Material', 'select', '["Natural Timber", "Dark Timber", "Brushed Metal", "Black Metal"]', 'Natural Timber', 1
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'material');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
      (v_grp, 'base_price', '{"description":"Base price per A4 frame"}', 195.00, 'ZAR', true, 1),
      (v_grp, 'size_tier', '{"size":"A3"}', 265.00, 'ZAR', true, 2),
      (v_grp, 'material_addon', '{"material":"Brushed Metal"}', 80.00, 'ZAR', true, 3),
      (v_grp, 'quantity_break', '{"min_qty":10,"max_qty":49}', 165.00, 'ZAR', true, 4),
      (v_grp, 'quantity_break', '{"min_qty":50,"max_qty":9999}', 140.00, 'ZAR', true, 5);
  END IF;
END $$;


-- ============================================================
-- RACE NUMBERS — Add: Triathlon Numbers, Running Bibs,
--               Cycling Race Plates, Event Lanyards
-- ============================================================

-- 5. Triathlon Numbers
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug = 'triathlon-numbers') THEN
    INSERT INTO product_groups (name, slug, division, description, is_active, display_order, image_url)
    VALUES ('Triathlon Numbers', 'triathlon-numbers', 'race-numbers',
            'Durable race numbers for triathlons — includes helmet stickers, body numbers, and bike plate in a single pack. Waterproof and tear-resistant.',
            true, 30, '/newimages/CBZ Marathon.jpg');
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'triathlon-numbers';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Triathlon Pack') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Triathlon Pack', '1× bib (200×200mm) + 2× helmet stickers (80×50mm) + 1× bike plate (200×120mm)', 200, 200, 2, 3, 300, true); END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'material', 'Material', 'select', '["TEX21", "Ecoflex"]', 'TEX21', 1
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'material');

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'print_option', 'Print Option', 'select', '["Full Colour", "Black"]', 'Full Colour', 2
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'print_option');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
      (v_grp, 'base_price', '{"description":"Base price per triathlon pack"}', 28.00, 'ZAR', true, 1),
      (v_grp, 'quantity_break', '{"min_qty":100,"max_qty":299}', 22.00, 'ZAR', true, 2),
      (v_grp, 'quantity_break', '{"min_qty":300,"max_qty":9999}', 17.00, 'ZAR', true, 3);
  END IF;
END $$;

-- 6. Running Bibs
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug = 'running-bibs') THEN
    INSERT INTO product_groups (name, slug, division, description, is_active, display_order, image_url)
    VALUES ('Running Bibs', 'running-bibs', 'race-numbers',
            'Lightweight running race bibs in Ecoflex or TEX21. Full-colour sponsor branding, unique race numbers, and name personalisation available.',
            true, 31, '/images/products/race-bibs.png');
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'running-bibs';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Standard Running Bib') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Standard Running Bib', '200mm × 175mm — standard road race bib', 200, 175, 2, 3, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Large Running Bib') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Large Running Bib', '230mm × 200mm — marathon/ultra bib', 230, 200, 2, 3, 300, true); END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'material', 'Material', 'select', '["Ecoflex", "TEX21"]', 'Ecoflex', 1
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'material');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
      (v_grp, 'base_price', '{"description":"Base price per running bib"}', 12.00, 'ZAR', true, 1),
      (v_grp, 'quantity_break', '{"min_qty":100,"max_qty":499}', 9.50, 'ZAR', true, 2),
      (v_grp, 'quantity_break', '{"min_qty":500,"max_qty":9999}', 7.50, 'ZAR', true, 3);
  END IF;
END $$;

-- 7. Cycling Race Plates
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug = 'cycling-race-plates') THEN
    INSERT INTO product_groups (name, slug, division, description, is_active, display_order, image_url)
    VALUES ('Cycling Race Plates', 'cycling-race-plates', 'race-numbers',
            'Rigid correx cycling race plates for road and mountain bike events. Full-colour print, cable-tie holes, weatherproof. CSV number upload supported.',
            true, 32, '/images/products/mtb-number-boards.png');
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'cycling-race-plates';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Standard Cycling Plate') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Standard Cycling Plate', '200mm × 140mm — front plate', 200, 140, 2, 4, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Large Cycling Plate') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Large Cycling Plate', '250mm × 180mm — front/rear plate', 250, 180, 2, 4, 300, true); END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'sides', 'Print Sides', 'select', '["Single Sided", "Double Sided"]', 'Single Sided', 1
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'sides');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
      (v_grp, 'base_price', '{"description":"Base price per cycling plate"}', 18.00, 'ZAR', true, 1),
      (v_grp, 'quantity_break', '{"min_qty":100,"max_qty":499}', 14.00, 'ZAR', true, 2),
      (v_grp, 'quantity_break', '{"min_qty":500,"max_qty":9999}', 11.00, 'ZAR', true, 3),
      (v_grp, 'option_addon', '{"option":"Double Sided"}', 5.00, 'ZAR', true, 4);
  END IF;
END $$;

-- 8. Event Lanyards
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug = 'event-lanyards') THEN
    INSERT INTO product_groups (name, slug, division, description, is_active, display_order, image_url)
    VALUES ('Event Lanyards', 'event-lanyards', 'race-numbers',
            'Custom printed lanyards for events, schools, and corporate access control. Full-colour sublimation print. ID card holders and clip options available.',
            true, 33, '/images/products/event-tags.png');
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'event-lanyards';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Standard Lanyard') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Standard Lanyard', '20mm wide sublimation lanyard', 20, 900, 1, 2, 300, true); END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'width', 'Width', 'select', '["15mm", "20mm", "25mm"]', '20mm', 1
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'width');

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'clip', 'Clip Type', 'select', '["Metal J-hook", "Safety breakaway", "Lobster claw"]', 'Metal J-hook', 2
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'clip');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
      (v_grp, 'base_price', '{"description":"Base price per lanyard"}', 32.00, 'ZAR', true, 1),
      (v_grp, 'quantity_break', '{"min_qty":50,"max_qty":199}', 26.00, 'ZAR', true, 2),
      (v_grp, 'quantity_break', '{"min_qty":200,"max_qty":9999}', 20.00, 'ZAR', true, 3);
  END IF;
END $$;


-- ============================================================
-- LASER — Add: Engraved Keyrings, Laser-cut Perspex Signage,
--         Personalised Gifts
-- ============================================================

-- 9. Engraved Keyrings
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug = 'engraved-keyrings') THEN
    INSERT INTO product_groups (name, slug, division, description, is_active, display_order, image_url)
    VALUES ('Engraved Keyrings', 'engraved-keyrings', 'laser',
            'Custom laser-engraved keyrings in timber, acrylic, and metal. Corporate gifting, event favours, and personalised keepsakes. Minimum order 1.',
            true, 40, '/images/products/acrylic-signs.png');
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'engraved-keyrings';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Round Timber Keyring') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Round Timber Keyring', '50mm diameter timber disc with split ring', 50, 50, 0, 3, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Rectangle Acrylic Keyring') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Rectangle Acrylic Keyring', '70mm × 40mm acrylic with split ring', 70, 40, 0, 3, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Dog Tag Metal Keyring') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Dog Tag Metal Keyring', '50mm × 25mm brushed steel dog tag', 50, 25, 0, 2, 300, true); END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'material', 'Material', 'select', '["Timber", "Acrylic", "Brushed Metal"]', 'Timber', 1
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'material');

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'engraving', 'Engraving Content', 'select', '["Text only", "Logo only", "Logo + text"]', 'Text only', 2
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'engraving');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
      (v_grp, 'base_price', '{"description":"Base price per keyring"}', 45.00, 'ZAR', true, 1),
      (v_grp, 'material_addon', '{"material":"Brushed Metal"}', 30.00, 'ZAR', true, 2),
      (v_grp, 'quantity_break', '{"min_qty":25,"max_qty":99}', 38.00, 'ZAR', true, 3),
      (v_grp, 'quantity_break', '{"min_qty":100,"max_qty":9999}', 28.00, 'ZAR', true, 4);
  END IF;
END $$;

-- 10. Laser-cut Perspex Signage
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug = 'perspex-signage') THEN
    INSERT INTO product_groups (name, slug, division, description, is_active, display_order, image_url)
    VALUES ('Perspex Signage', 'perspex-signage', 'laser',
            'Laser-cut and engraved acrylic (perspex) signs for offices, retail, and events. Available in clear, white, and coloured acrylic with standoff fixings.',
            true, 41, '/images/products/acrylic-signs.png');
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'perspex-signage';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'A4 Perspex Sign') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'A4 Perspex Sign', 'A4: 297mm × 210mm acrylic sign', 297, 210, 0, 5, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'A3 Perspex Sign') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'A3 Perspex Sign', 'A3: 420mm × 297mm acrylic sign', 420, 297, 0, 5, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Custom Perspex Sign') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active, template_json)
    VALUES (v_grp, 'Custom Perspex Sign', 'Custom cut to size — up to 600mm × 600mm', 300, 300, 0, 5, 300, true,
            '{"min_width_mm":100,"max_width_mm":600,"width_step_mm":1,"min_height_mm":100,"max_height_mm":600,"height_step_mm":1}'); END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'colour', 'Acrylic Colour', 'select', '["Clear", "White", "Black", "Frosted", "Coloured (specify)"]', 'Clear', 1
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'colour');

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'thickness', 'Thickness', 'select', '["3mm", "5mm", "8mm"]', '3mm', 2
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'thickness');

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'fixings', 'Fixings', 'select', '["None", "Standoffs (×4)", "Double-sided tape", "Screw holes"]', 'Standoffs (×4)', 3
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'fixings');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
      (v_grp, 'base_price', '{"description":"Base price per A4 perspex sign (3mm)"}', 220.00, 'ZAR', true, 1),
      (v_grp, 'size_tier', '{"size":"A3"}', 320.00, 'ZAR', true, 2),
      (v_grp, 'material_addon', '{"thickness":"5mm"}', 60.00, 'ZAR', true, 3),
      (v_grp, 'material_addon', '{"thickness":"8mm"}', 120.00, 'ZAR', true, 4),
      (v_grp, 'quantity_break', '{"min_qty":5,"max_qty":19}', 185.00, 'ZAR', true, 5),
      (v_grp, 'quantity_break', '{"min_qty":20,"max_qty":9999}', 150.00, 'ZAR', true, 6);
  END IF;
END $$;

-- 11. Personalised Gifts
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug = 'personalised-gifts') THEN
    INSERT INTO product_groups (name, slug, division, description, is_active, display_order, image_url)
    VALUES ('Personalised Gifts', 'personalised-gifts', 'laser',
            'Laser-engraved personalised gifts — coasters, photo frames, phone stands, and wooden plaques. Perfect for corporate gifting, weddings, and special occasions.',
            true, 42, '/images/products/wooden-plaques.png');
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'personalised-gifts';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Timber Coaster Set (×4)') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Timber Coaster Set (×4)', 'Set of 4 round 90mm timber coasters', 90, 90, 0, 5, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Engraved Photo Frame') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Engraved Photo Frame', '4R photo frame (152mm × 102mm) in natural timber', 200, 160, 0, 5, 300, true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Wooden Phone Stand') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Wooden Phone Stand', 'Laser-cut timber phone/tablet stand with custom engraving', 120, 80, 0, 5, 300, true); END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'engraving', 'Engraving', 'select', '["Name only", "Name + date", "Logo", "Custom message"]', 'Name only', 1
  FROM product_templates pt WHERE pt.product_group_id = v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id = pt.id AND param_key = 'engraving');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id = v_grp AND rule_type = 'base_price') THEN
    INSERT INTO pricing_rules (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order) VALUES
      (v_grp, 'base_price', '{"description":"Base price (coaster set)"}', 180.00, 'ZAR', true, 1),
      (v_grp, 'quantity_break', '{"min_qty":10,"max_qty":49}', 155.00, 'ZAR', true, 2),
      (v_grp, 'quantity_break', '{"min_qty":50,"max_qty":9999}', 120.00, 'ZAR', true, 3);
  END IF;
END $$;
