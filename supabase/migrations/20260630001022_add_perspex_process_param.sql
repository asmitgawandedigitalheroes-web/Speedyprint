-- ============================================================
-- Add 'process' parameter to the perspex-signage product template
-- 30 Jun 2026
--
-- WHY:
--   85 new pricing rules for perspex-signage use { process, size, colour, thickness }
--   conditions. Without a 'process' template_parameter, the product configurator
--   never passes process= in params, so the calculator cannot match any rule.
--
-- PROCESSES (maps directly to seed-pricing-from-excel.mjs LASER_RULES):
--   "Cut out only"                     → fixed price per size × material
--   "Cut out + Direct Print"           → fixed price per size × material
--   "Cut out + Bending + Glue"         → per-m² rate only (custom sizes)
--   "Cut out + Bending + Glue + Print" → per-m² rate only (custom sizes)
--
-- display_order = 1 so process appears first in the configurator UI.
-- ============================================================

DO $$
DECLARE
  v_template_id UUID;
BEGIN

  SELECT pt.id INTO v_template_id
  FROM product_templates pt
  JOIN product_groups pg ON pt.product_group_id = pg.id
  WHERE pg.slug = 'perspex-signage'
    AND pt.is_active = true
  ORDER BY pt.created_at
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'perspex-signage: active template not found — skipped.';
    RETURN;
  END IF;

  -- Idempotent: remove any existing process param first
  DELETE FROM template_parameters
    WHERE product_template_id = v_template_id AND param_key = 'process';

  INSERT INTO template_parameters
    (product_template_id, param_key, param_label, param_type, options, default_value, display_order, is_required)
  VALUES
    (v_template_id,
     'process',
     'Process',
     'select',
     '["Cut out only", "Cut out + Direct Print", "Cut out + Bending + Glue", "Cut out + Bending + Glue + Print"]',
     'Cut out only',
     1,
     true);

  RAISE NOTICE 'perspex-signage: process parameter added (display_order=1, default=''Cut out only'').';

END $$;
