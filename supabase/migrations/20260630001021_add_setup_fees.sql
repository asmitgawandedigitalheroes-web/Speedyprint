-- ============================================================
-- Add setup_fee rules to all products — 30 Jun 2026
-- Source: pricing-rules.md (corrected client pricing)
--
-- WHAT THIS DOES:
--   Removes any stale minimum_order rules (those were price-floor
--   approximations; pricing-rules.md specifies setup_charge as an
--   ALWAYS-ADDED per-order fee, not a minimum).
--   Inserts a setup_fee rule for each product group.
--
-- ⚠️  BEHAVIOUR CHANGE:
--   minimum_order was a FLOOR (total = max(subtotal, R195)).
--   setup_fee is ADDITIVE (total = subtotal + R195).
--   Small orders will be MORE expensive than before.
--   Example: 50 SS business cards @ R2.50 = R125 subtotal
--     Old: R195 charged (minimum applied)
--     New: R125 + R195 = R320 charged
--   Confirm this is intentional before running in production.
--
-- ⚠️  STAMPS — S120 Mini Dater (CMD12016) has "NA" setup fee per
--   pricing-rules.md, but all stamps share one product group so
--   the R195 setup_fee applies to all stamps. Correct fix requires
--   a separate product group for S120 or conditional setup_fee
--   support in the calculator.
--
-- setup_fee rule type was added to the enum in migration
-- 20260624001020_add_setup_fee_rule_type.sql.
-- ============================================================

DO $$
DECLARE v_grp UUID;
BEGIN

  -- ── 1. Business Cards (R195 setup charge) ──────────────────
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'business-cards';
  IF v_grp IS NOT NULL THEN
    DELETE FROM pricing_rules
      WHERE product_group_id = v_grp AND rule_type IN ('minimum_order', 'setup_fee');
    INSERT INTO pricing_rules
      (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp, 'setup_fee',
       '{"description":"Set-up charge (once per order, excl. VAT)"}',
       195.00, 'ZAR', true, 1000);
    RAISE NOTICE 'business-cards: setup_fee R195 added (minimum_order removed).';
  ELSE
    RAISE NOTICE 'business-cards: product group not found, skipped.';
  END IF;

  -- ── 2. Coffee Cup Sleeves (R195 setup charge) ───────────────
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'coffee-cup-sleeves';
  IF v_grp IS NOT NULL THEN
    DELETE FROM pricing_rules
      WHERE product_group_id = v_grp AND rule_type IN ('minimum_order', 'setup_fee');
    INSERT INTO pricing_rules
      (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp, 'setup_fee',
       '{"description":"Set-up charge (once per order, excl. VAT)"}',
       195.00, 'ZAR', true, 1000);
    RAISE NOTICE 'coffee-cup-sleeves: setup_fee R195 added (minimum_order removed).';
  ELSE
    RAISE NOTICE 'coffee-cup-sleeves: product group not found, skipped.';
  END IF;

  -- ── 3. Large Format UV Labels (R195 setup charge) ───────────
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'large-format-uv-labels';
  IF v_grp IS NOT NULL THEN
    DELETE FROM pricing_rules
      WHERE product_group_id = v_grp AND rule_type IN ('minimum_order', 'setup_fee');
    INSERT INTO pricing_rules
      (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp, 'setup_fee',
       '{"description":"Set-up charge (once per order, excl. VAT)"}',
       195.00, 'ZAR', true, 1000);
    RAISE NOTICE 'large-format-uv-labels: setup_fee R195 added (minimum_order removed).';
  ELSE
    RAISE NOTICE 'large-format-uv-labels: product group not found, skipped.';
  END IF;

  -- ── 4. Race Numbers (R495 setup charge) ─────────────────────
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'race-numbers';
  IF v_grp IS NOT NULL THEN
    DELETE FROM pricing_rules
      WHERE product_group_id = v_grp AND rule_type IN ('minimum_order', 'setup_fee');
    INSERT INTO pricing_rules
      (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp, 'setup_fee',
       '{"description":"Set-up charge (once per order, excl. VAT)"}',
       495.00, 'ZAR', true, 1000);
    RAISE NOTICE 'race-numbers: setup_fee R495 added (minimum_order removed).';
  ELSE
    RAISE NOTICE 'race-numbers: product group not found, skipped.';
  END IF;

  -- ── 5. Self-Inking Stamps (R195 setup charge) ───────────────
  -- ⚠️  S120 Mini Dater (CMD12016) has no setup fee per pricing-rules.md.
  --   All stamps share this group. See migration header comment.
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'self-inking-stamps';
  IF v_grp IS NOT NULL THEN
    DELETE FROM pricing_rules
      WHERE product_group_id = v_grp AND rule_type IN ('minimum_order', 'setup_fee');
    INSERT INTO pricing_rules
      (product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
    VALUES
      (v_grp, 'setup_fee',
       '{"description":"Set-up charge (once per order, excl. VAT) — NOTE: S120 Mini Dater has no setup fee; move to own product group to fix"}',
       195.00, 'ZAR', true, 1000);
    RAISE NOTICE 'self-inking-stamps: setup_fee R195 added (minimum_order removed, S120 exception noted).';
  ELSE
    RAISE NOTICE 'self-inking-stamps: product group not found, skipped.';
  END IF;

END $$;
