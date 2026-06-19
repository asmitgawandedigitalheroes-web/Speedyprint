-- Fix audit issues found 2026-06-19:
-- 1. Remove 3 duplicate wristband templates (short-name variants added in error)
-- 2. Add A3 / A2 / A1 templates for Poster Calendars (group had 0 templates)

-- ── 1. Delete duplicate wristband templates ──────────────────────────────────
-- Keep: Wristband Small (S), Wristband Medium (M), Wristband Large (L), Wristband XL
-- Remove: Wristband S, Wristband M, Wristband L  (the short-name duplicates)
DELETE FROM product_templates
WHERE id IN (
  'd0cd0478-ede2-4e97-885c-cb1164440564',  -- Wristband L  (dup of Wristband Large (L))
  '6f1d6aed-826b-45d1-a598-318cc731bda2',  -- Wristband M  (dup of Wristband Medium (M))
  '9a4c7084-f2c2-4671-b2ab-bd640b3c138b'   -- Wristband S  (dup of Wristband Small (S))
);

-- ── 2. Add Poster Calendar templates ─────────────────────────────────────────
-- Product group: poster-calendars  id = 046eb691-e2bf-40ed-82f8-68da67187a1b
-- Using same bleed/safe-zone/dpi as print-division flyers: bleed 3mm, safe 5mm, 600dpi
INSERT INTO product_templates
  (id, product_group_id, name, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
VALUES
  (gen_random_uuid(), '046eb691-e2bf-40ed-82f8-68da67187a1b', 'A3 Poster Calendar', 297, 420, 3, 5, 600, true),
  (gen_random_uuid(), '046eb691-e2bf-40ed-82f8-68da67187a1b', 'A2 Poster Calendar', 420, 594, 3, 5, 600, true),
  (gen_random_uuid(), '046eb691-e2bf-40ed-82f8-68da67187a1b', 'A1 Poster Calendar', 594, 841, 3, 5, 600, true);
