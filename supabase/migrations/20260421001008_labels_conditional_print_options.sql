-- ============================================================
-- Custom Labels — Conditional print_option per material
-- Date: 21 April 2026
-- Issue: All print options were shown regardless of material,
--        allowing invalid combinations (e.g. Polylaser + White)
--        that have no pricing rule and return R0.
-- Fix:   Use _depends_on to filter print_option choices based
--        on the selected material. Valid combinations match
--        exactly the per_area_m2 rules in the pricing table.
--
-- Material → valid print options:
--   Polylaser Adhesive  → Colour Single Sided, Black Single Sided
--                         (Spot Gloss handled via Lamination dropdown)
--   Paper Adhesive      → Colour Single Sided, Black Single Sided
--                         (Spot Gloss handled via Lamination dropdown)
--   White Vinyl         → Colour Single Sided, Colour + Spot Gloss
--   Grey Back Vinyl     → Colour Single Sided, Colour + Spot Gloss
--   Clear Vinyl         → Colour Single Sided, White Single Sided,
--                         Colour + White, Colour + White + Spot Gloss
-- ============================================================

DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'custom-labels';
  IF v_grp IS NULL THEN RAISE NOTICE 'custom-labels not found, skipping.'; RETURN; END IF;

  UPDATE template_parameters
  SET
    options = '{
      "_depends_on": "material",
      "Polylaser Adhesive":  ["Colour Single Sided", "Black Single Sided"],
      "Paper Adhesive":      ["Colour Single Sided", "Black Single Sided"],
      "White Vinyl":         ["Colour Single Sided", "Colour + Spot Gloss"],
      "Grey Back Vinyl":     ["Colour Single Sided", "Colour + Spot Gloss"],
      "Clear Vinyl":         ["Colour Single Sided", "White Single Sided", "Colour + White", "Colour + White + Spot Gloss"],
      "_default":            ["Colour Single Sided"]
    }'::jsonb,
    default_value = 'Colour Single Sided'
  WHERE param_key = 'print_option'
    AND product_template_id IN (
      SELECT id FROM product_templates WHERE product_group_id = v_grp
    );

  RAISE NOTICE 'custom-labels print_option conditional options updated (% rows).', found;
END $$;
