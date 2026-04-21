-- ============================================================
-- Race Numbers — Fix print-option pricing per quantity tier
-- Date: 21 April 2026
-- Issue: Black Single Sided and Full Colour Front / Black Back
--        were modelled as flat option_addons (-R1.74 / +R1.24),
--        but the actual price difference vs Colour Single Sided
--        varies at each quantity tier. This caused wrong prices
--        for all qty tiers above 50.
--
-- Fix: Remove the flat option_addon rules and replace them with
--      print_option-specific quantity_break rules encoding the
--      correct per-tier price directly from the Excel spreadsheet.
--      The calculator already prefers more-specific qty breaks
--      (those with extra condition keys like print_option) over
--      the generic Colour ones — no code changes required.
--
-- Holes (+R0.15 / +R0.30) remain as flat option_addons: they
-- are constant across all quantity tiers and are unaffected.
-- ============================================================

DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'race-numbers';
  IF v_grp IS NULL THEN RAISE NOTICE 'race-numbers not found, skipping.'; RETURN; END IF;

  -- ── Remove the old flat print_option addons ─────────────────
  DELETE FROM pricing_rules
  WHERE product_group_id = v_grp
    AND rule_type = 'option_addon'
    AND (
      conditions->>'print_option' = 'Black Single Sided'
      OR conditions->>'print_option' = 'Full Colour Front / Black Back'
    );

  -- ── Black Single Sided — exact prices from Excel ─────────────
  -- Excel: 50=R4.57, 600=R4.33, 1000=R4.06, 5000=R3.64, 10000=R3.51
  -- The 1-599 tier uses a qty_break (min_qty=1) so the calculator
  -- prefers it over the generic base_price when print_option=Black.
  INSERT INTO pricing_rules
    (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
  VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","print_option":"Black Single Sided","description":"Black Single Sided 1-599"}',
     4.57, 'ZAR', true, 21),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","print_option":"Black Single Sided","description":"Black Single Sided 600-999"}',
     4.33, 'ZAR', true, 22),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","print_option":"Black Single Sided","description":"Black Single Sided 1000-4999"}',
     4.06, 'ZAR', true, 23),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","print_option":"Black Single Sided","description":"Black Single Sided 5000-9999"}',
     3.64, 'ZAR', true, 24),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","print_option":"Black Single Sided","description":"Black Single Sided 10000+"}',
     3.51, 'ZAR', true, 25);

  -- ── Full Colour Front / Black Back — exact prices from Excel ──
  -- Excel: 50=R7.57, 600=R6.79, 1000=R5.36, 5000=R5.14, 10000=R4.96
  INSERT INTO pricing_rules
    (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
  VALUES
    (v_grp, 'quantity_break',
     '{"min_qty":1,"max_qty":599,"discount_type":"fixed_price","print_option":"Full Colour Front / Black Back","description":"Full Colour Front / Black Back 1-599"}',
     7.57, 'ZAR', true, 26),
    (v_grp, 'quantity_break',
     '{"min_qty":600,"max_qty":999,"discount_type":"fixed_price","print_option":"Full Colour Front / Black Back","description":"Full Colour Front / Black Back 600-999"}',
     6.79, 'ZAR', true, 27),
    (v_grp, 'quantity_break',
     '{"min_qty":1000,"max_qty":4999,"discount_type":"fixed_price","print_option":"Full Colour Front / Black Back","description":"Full Colour Front / Black Back 1000-4999"}',
     5.36, 'ZAR', true, 28),
    (v_grp, 'quantity_break',
     '{"min_qty":5000,"max_qty":9999,"discount_type":"fixed_price","print_option":"Full Colour Front / Black Back","description":"Full Colour Front / Black Back 5000-9999"}',
     5.14, 'ZAR', true, 29),
    (v_grp, 'quantity_break',
     '{"min_qty":10000,"max_qty":999999,"discount_type":"fixed_price","print_option":"Full Colour Front / Black Back","description":"Full Colour Front / Black Back 10000+"}',
     4.96, 'ZAR', true, 30);

  RAISE NOTICE 'race-numbers print_option pricing fixed (% rows inserted).', 10;
END $$;
