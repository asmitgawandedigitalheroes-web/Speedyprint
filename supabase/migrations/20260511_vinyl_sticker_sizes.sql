-- ============================================================
-- Vinyl Sticker Sizes — 11 May 2026
-- Adds three small-square size templates and a Custom Size
-- template (with adjustable dimension constraints) to the
-- vinyl-stickers product group.
--
-- Safe to re-run: all inserts are guarded by NOT EXISTS checks.
-- Verify new sizes are producible on current equipment before
-- deploying to production.
-- ============================================================

DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'vinyl-stickers';
  IF v_grp IS NULL THEN
    RAISE NOTICE 'Product group vinyl-stickers not found — skipping.';
    RETURN;
  END IF;

  -- 50 × 50 mm Small Square
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Small Square 50×50mm') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Small Square 50×50mm', 'Small square sticker — ideal for product labels and packaging seals', 50, 50, 3, 3, 300, true);
  END IF;

  -- 80 × 80 mm Medium Square
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Medium Square 80×80mm') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Medium Square 80×80mm', 'Medium square sticker — popular for branding, boxes and gifts', 80, 80, 3, 3, 300, true);
  END IF;

  -- 100 × 100 mm Large Square
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Large Square 100×100mm') THEN
    INSERT INTO product_templates (product_group_id, name, description, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
    VALUES (v_grp, 'Large Square 100×100mm', 'Large square sticker — great for wall art, outdoor use and larger packaging', 100, 100, 3, 3, 300, true);
  END IF;

  -- Custom Size (adjustable dimensions via template_json constraints)
  -- Matches the dimension range used on Custom Labels:
  --   width  10–700 mm, height 10–300 mm
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id = v_grp AND name = 'Custom Size') THEN
    INSERT INTO product_templates (
      product_group_id, name, description,
      print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi,
      template_json, is_active
    )
    VALUES (
      v_grp,
      'Custom Size',
      'Enter your own width and height. Minimum 10 mm, maximum 700 × 300 mm.',
      100, 100, 3, 3, 300,
      '{"min_width_mm": 10, "max_width_mm": 700, "width_step_mm": 1, "min_height_mm": 10, "max_height_mm": 300, "height_step_mm": 1}'::jsonb,
      true
    );
  END IF;

  -- Add material + finish parameters to the new templates
  -- (mirrors the parameters already on the A5/A6 templates)
  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'material', 'Material', 'select',
         '["White Vinyl", "Clear Vinyl", "Chrome/Metallic", "Reflective"]'::jsonb,
         'White Vinyl', 1
  FROM product_templates pt
  WHERE pt.product_group_id = v_grp
    AND pt.name IN ('Small Square 50×50mm', 'Medium Square 80×80mm', 'Large Square 100×100mm', 'Custom Size')
    AND NOT EXISTS (
      SELECT 1 FROM template_parameters
      WHERE product_template_id = pt.id AND param_key = 'material'
    );

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'finish', 'Finish', 'select',
         '["Gloss", "Matte", "Satin"]'::jsonb,
         'Gloss', 2
  FROM product_templates pt
  WHERE pt.product_group_id = v_grp
    AND pt.name IN ('Small Square 50×50mm', 'Medium Square 80×80mm', 'Large Square 100×100mm', 'Custom Size')
    AND NOT EXISTS (
      SELECT 1 FROM template_parameters
      WHERE product_template_id = pt.id AND param_key = 'finish'
    );

END $$;
