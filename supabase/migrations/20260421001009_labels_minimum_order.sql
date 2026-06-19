-- ============================================================
-- Custom Labels — Minimum order value R195
-- Date: 21 April 2026
--
-- IMPORTANT: Run this file in TWO separate steps in the
-- Supabase SQL editor (paste each block and hit Run separately).
-- PostgreSQL requires the enum value to be committed before it
-- can be used in the same session.
-- ============================================================


-- ── STEP 1: Run this block first, then click Run ─────────────

ALTER TYPE pricing_rule_type ADD VALUE IF NOT EXISTS 'minimum_order';


-- ── STEP 2: Run this block separately after Step 1 ───────────

DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'custom-labels';
  IF v_grp IS NULL THEN RAISE NOTICE 'custom-labels not found, skipping.'; RETURN; END IF;

  DELETE FROM pricing_rules
  WHERE product_group_id = v_grp
    AND rule_type = 'minimum_order';

  INSERT INTO pricing_rules
    (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
  VALUES
    (v_grp, 'minimum_order',
     '{"description":"Minimum order value for custom labels"}',
     195.00, 'ZAR', true, 99);

  RAISE NOTICE 'custom-labels minimum order R195 added.';
END $$;
