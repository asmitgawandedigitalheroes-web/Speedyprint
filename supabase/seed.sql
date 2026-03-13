-- SpeedyPrint Seed Data
-- Run this in the Supabase SQL Editor after the migration

-- ============================================================
-- Product Groups (one per division, plus some extras)
-- ============================================================

INSERT INTO product_groups (id, name, slug, division, description, image_url, is_active, display_order)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Custom Labels', 'custom-labels', 'labels',
   'High-quality custom labels and stickers for any application. Available in various materials and finishes.', '/images/products/custom-labels.png', true, 1),
  ('11111111-1111-1111-1111-111111111102', 'Vinyl Stickers', 'vinyl-stickers', 'labels',
   'Durable vinyl stickers for indoor and outdoor use. Waterproof and UV-resistant.', '/images/products/vinyl-stickers.png', true, 2),
  ('11111111-1111-1111-1111-111111111103', 'Acrylic Signs', 'acrylic-signs', 'laser',
   'Precision laser-cut acrylic signs. Perfect for businesses, offices, and events.', '/images/products/acrylic-signs.png', true, 3),
  ('11111111-1111-1111-1111-111111111104', 'Wooden Plaques', 'wooden-plaques', 'laser',
   'Laser-engraved wooden plaques for awards, gifts, and decor.', '/images/products/wooden-plaques.png', true, 4),
  ('11111111-1111-1111-1111-111111111105', 'Race Bibs', 'race-bibs', 'events',
   'Professional race bibs with custom numbering. Tyvek material, waterproof, with tear-off tabs.', '/images/products/race-bibs.png', true, 5),
  ('11111111-1111-1111-1111-111111111106', 'Event Tags', 'event-tags', 'events',
   'Custom event identification tags, lanyards, and badges.', '/images/products/event-tags.png', true, 6),
  ('11111111-1111-1111-1111-111111111107', 'MTB Number Boards', 'mtb-number-boards', 'events',
   'Mountain bike number boards. Durable, lightweight, and UV resistant.', '/images/products/mtb-number-boards.png', true, 7),
  ('11111111-1111-1111-1111-111111111108', 'Self-Inking Stamps', 'self-inking-stamps', 'stamps',
   'Professional self-inking rubber stamps for businesses. Multiple sizes available.', '/images/products/self-inking-stamps.png', true, 8),
  ('11111111-1111-1111-1111-111111111109', 'Coffee Cup Sleeves', 'coffee-cup-sleeves', 'sleeves',
   'Branded coffee cup sleeves for cafes and events. Full-color printing on recycled cardboard.', '/images/products/coffee-cup-sleeves.png', true, 9),
  ('11111111-1111-1111-1111-111111111110', 'Award Trophies', 'award-trophies', 'sleeves',
   'Custom laser-cut acrylic trophies and awards for corporate events.', '/images/products/award-trophies.png', true, 10)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Product Templates
-- ============================================================

INSERT INTO product_templates (id, product_group_id, name, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
VALUES
  -- Labels
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Label 50x30mm', 50, 30, 2, 3, 300, true),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Label 100x50mm', 100, 50, 2, 3, 300, true),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'Label 80x80mm Circle', 80, 80, 2, 3, 300, true),
  -- Vinyl Stickers
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111102', 'Vinyl Sticker A6', 105, 148, 3, 5, 300, true),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111102', 'Vinyl Sticker A5', 148, 210, 3, 5, 300, true),
  -- Acrylic Signs
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111103', 'A4 Acrylic Sign', 210, 297, 0, 5, 300, true),
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111103', 'A3 Acrylic Sign', 297, 420, 0, 5, 300, true),
  -- Wooden Plaques
  ('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111104', 'Wooden Plaque 200x150mm', 200, 150, 0, 5, 300, true),
  -- Race Bibs
  ('22222222-2222-2222-2222-222222222209', '11111111-1111-1111-1111-111111111105', 'Standard Race Bib', 240, 160, 3, 5, 300, true),
  ('22222222-2222-2222-2222-222222222210', '11111111-1111-1111-1111-111111111105', 'Large Race Bib', 280, 200, 3, 5, 300, true),
  -- Event Tags
  ('22222222-2222-2222-2222-222222222211', '11111111-1111-1111-1111-111111111106', 'Badge 86x54mm', 86, 54, 2, 3, 300, true),
  -- MTB Boards
  ('22222222-2222-2222-2222-222222222212', '11111111-1111-1111-1111-111111111107', 'MTB Board 250x200mm', 250, 200, 3, 5, 300, true),
  -- Stamps
  ('22222222-2222-2222-2222-222222222213', '11111111-1111-1111-1111-111111111108', 'Stamp 38x14mm', 38, 14, 0, 1, 300, true),
  ('22222222-2222-2222-2222-222222222214', '11111111-1111-1111-1111-111111111108', 'Stamp 58x22mm', 58, 22, 0, 1, 300, true),
  -- Coffee Sleeves
  ('22222222-2222-2222-2222-222222222215', '11111111-1111-1111-1111-111111111109', 'Standard Coffee Sleeve', 280, 100, 3, 5, 300, true),
  -- Trophies
  ('22222222-2222-2222-2222-222222222216', '11111111-1111-1111-1111-111111111110', 'Trophy A5 Acrylic', 148, 210, 0, 5, 300, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Template Parameters (e.g., material, finish options)
-- ============================================================

INSERT INTO template_parameters (id, product_template_id, param_key, param_label, param_type, options, default_value, display_order)
VALUES
  -- Label 50x30mm
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 'material', 'Material', 'select',
   '["Gloss Paper", "Matte Paper", "Vinyl", "Clear Vinyl"]', 'Gloss Paper', 1),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', 'finish', 'Finish', 'select',
   '["None", "Gloss Laminate", "Matte Laminate"]', 'None', 2),
  -- Label 100x50mm
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222202', 'material', 'Material', 'select',
   '["Gloss Paper", "Matte Paper", "Vinyl", "Clear Vinyl"]', 'Gloss Paper', 1),
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222202', 'finish', 'Finish', 'select',
   '["None", "Gloss Laminate", "Matte Laminate"]', 'None', 2),
  -- Race Bib
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222209', 'material', 'Material', 'select',
   '["Tyvek", "Waterproof Synthetic"]', 'Tyvek', 1),
  ('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222209', 'safety_pins', 'Include Safety Pins', 'select',
   '["Yes", "No"]', 'Yes', 2),
  -- Coffee Sleeve
  ('33333333-3333-3333-3333-333333333307', '22222222-2222-2222-2222-222222222215', 'material', 'Material', 'select',
   '["Recycled Cardboard", "Premium Kraft"]', 'Recycled Cardboard', 1),
  -- Stamps
  ('33333333-3333-3333-3333-333333333308', '22222222-2222-2222-2222-222222222213', 'ink_color', 'Ink Color', 'select',
   '["Black", "Blue", "Red", "Green"]', 'Black', 1),
  ('33333333-3333-3333-3333-333333333309', '22222222-2222-2222-2222-222222222214', 'ink_color', 'Ink Color', 'select',
   '["Black", "Blue", "Red", "Green"]', 'Black', 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Pricing Rules (using product_group_id, rule_type, conditions, price_value)
-- ============================================================

INSERT INTO pricing_rules (id, product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
VALUES
  -- Labels
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', 'base_price', '{"description": "Base price per label"}', 1.50, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111101', 'quantity_break', '{"min_qty": 500, "max_qty": 999, "description": "500-999 units"}', 1.00, 'ZAR', true, 2),
  ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111101', 'quantity_break', '{"min_qty": 1000, "max_qty": 9999, "description": "1000+ units"}', 0.65, 'ZAR', true, 3),
  ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111101', 'material_addon', '{"material": "Vinyl", "description": "Vinyl material add-on"}', 0.50, 'ZAR', true, 4),
  ('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111101', 'finish_addon', '{"finish": "Gloss Laminate", "description": "Gloss laminate finish"}', 0.30, 'ZAR', true, 5),
  -- Vinyl Stickers
  ('44444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111102', 'base_price', '{"description": "Base price per sticker"}', 3.50, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444407', '11111111-1111-1111-1111-111111111102', 'quantity_break', '{"min_qty": 100, "max_qty": 499, "description": "100-499 units"}', 2.80, 'ZAR', true, 2),
  -- Acrylic Signs
  ('44444444-4444-4444-4444-444444444408', '11111111-1111-1111-1111-111111111103', 'base_price', '{"description": "Base price per sign"}', 250.00, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444409', '11111111-1111-1111-1111-111111111103', 'quantity_break', '{"min_qty": 10, "max_qty": 49, "description": "10-49 signs"}', 200.00, 'ZAR', true, 2),
  -- Race Bibs
  ('44444444-4444-4444-4444-444444444410', '11111111-1111-1111-1111-111111111105', 'base_price', '{"description": "Base price per bib"}', 8.00, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444411', '11111111-1111-1111-1111-111111111105', 'quantity_break', '{"min_qty": 200, "max_qty": 499, "description": "200-499 bibs"}', 6.50, 'ZAR', true, 2),
  ('44444444-4444-4444-4444-444444444412', '11111111-1111-1111-1111-111111111105', 'quantity_break', '{"min_qty": 500, "max_qty": 9999, "description": "500+ bibs"}', 4.50, 'ZAR', true, 3),
  -- Stamps
  ('44444444-4444-4444-4444-444444444413', '11111111-1111-1111-1111-111111111108', 'base_price', '{"description": "Base price per stamp"}', 180.00, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444414', '11111111-1111-1111-1111-111111111108', 'quantity_break', '{"min_qty": 5, "max_qty": 19, "description": "5-19 stamps"}', 150.00, 'ZAR', true, 2),
  -- Coffee Sleeves
  ('44444444-4444-4444-4444-444444444415', '11111111-1111-1111-1111-111111111109', 'base_price', '{"description": "Base price per sleeve"}', 2.20, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444416', '11111111-1111-1111-1111-111111111109', 'quantity_break', '{"min_qty": 1000, "max_qty": 4999, "description": "1000-4999 sleeves"}', 1.50, 'ZAR', true, 2),
  ('44444444-4444-4444-4444-444444444417', '11111111-1111-1111-1111-111111111109', 'quantity_break', '{"min_qty": 5000, "max_qty": 99999, "description": "5000+ sleeves"}', 0.95, 'ZAR', true, 3),
  -- Trophies
  ('44444444-4444-4444-4444-444444444418', '11111111-1111-1111-1111-111111111110', 'base_price', '{"description": "Base price per trophy"}', 350.00, 'ZAR', true, 1)
ON CONFLICT (id) DO NOTHING;
