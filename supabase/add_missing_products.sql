-- SpeedyPrint — Missing Products Migration
-- Run this in the Supabase SQL Editor to expand thin divisions
-- Covers: Trophies (+4), Race Numbers (+3), Laser (+3)

-- ============================================================
-- Product Groups
-- ============================================================

INSERT INTO product_groups (id, name, slug, division, description, image_url, is_active, display_order)
VALUES
  -- Trophies (+4)
  ('11111111-1111-1111-1111-111111111111', 'Engraved Plaques', 'engraved-plaques', 'trophies',
   'Precision laser-engraved plaques in acrylic, aluminium, and wood. Ideal for awards, recognition, and memorials.', '/images/products/engraved-plaques.png', true, 11),
  ('11111111-1111-1111-1111-111111111112', 'Medallions', 'medallions', 'trophies',
   'Custom printed and engraved medallions for sporting events, schools, and corporate recognition programmes.', '/images/products/medallions.png', true, 12),
  ('11111111-1111-1111-1111-111111111113', 'Corporate Awards', 'corporate-awards', 'trophies',
   'Premium corporate awards in crystal, acrylic, and metal. Fully branded with your logo and recipient name.', '/images/products/corporate-awards.png', true, 13),
  ('11111111-1111-1111-1111-111111111114', 'Certificate Frames', 'certificate-frames', 'trophies',
   'Branded certificate frames and presentation folders. A4 and A5 sizes, available in black, silver, and gold.', '/images/products/certificate-frames.png', true, 14),

  -- Race Numbers (+3)
  ('11111111-1111-1111-1111-111111111115', 'Triathlon Numbers', 'triathlon-numbers', 'race-numbers',
   'Multi-discipline triathlon race numbers designed for swim-to-run transitions. Waterproof Tyvek with chip timing strip.', '/images/products/triathlon-numbers.png', true, 15),
  ('11111111-1111-1111-1111-111111111116', 'Cycling Race Plates', 'cycling-race-plates', 'race-numbers',
   'Rigid Corflute cycling number plates for road and MTB events. Front and rear sets with elastic loops included.', '/images/products/cycling-race-plates.png', true, 16),
  ('11111111-1111-1111-1111-111111111117', 'Event Lanyards', 'event-lanyards', 'race-numbers',
   'Custom printed polyester lanyards with clip or hook fittings. Perfect for events, conferences, and access control.', '/images/products/event-lanyards.png', true, 17),

  -- Laser (+3)
  ('11111111-1111-1111-1111-111111111118', 'Engraved Keyrings', 'engraved-keyrings', 'laser',
   'Personalised laser-engraved keyrings in acrylic, metal, and wood. Popular for corporate gifts, events, and retail.', '/images/products/engraved-keyrings.png', true, 18),
  ('11111111-1111-1111-1111-111111111119', 'Laser-cut Perspex Signage', 'laser-cut-perspex-signage', 'laser',
   'Custom laser-cut and edge-lit Perspex signs for retail, hospitality, and office environments.', '/images/products/laser-cut-perspex.png', true, 19),
  ('11111111-1111-1111-1111-111111111120', 'Personalised Gifts', 'personalised-gifts', 'laser',
   'Laser-engraved personalised gifts — wine boxes, wooden chopping boards, photo frames, and more.', '/images/products/personalised-gifts.png', true, 20)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Product Templates
-- ============================================================

INSERT INTO product_templates (id, product_group_id, name, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, is_active)
VALUES
  -- Engraved Plaques
  ('22222222-2222-2222-2222-222222222220', '11111111-1111-1111-1111-111111111111', 'Plaque A5 148x210mm', 148, 210, 0, 5, 300, true),
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Plaque A4 210x297mm', 210, 297, 0, 5, 300, true),
  -- Medallions
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111112', 'Medallion 70mm Round', 70, 70, 0, 3, 300, true),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111112', 'Medallion 50mm Round', 50, 50, 0, 3, 300, true),
  -- Corporate Awards
  ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111113', 'Award 200x150mm', 200, 150, 0, 5, 300, true),
  -- Certificate Frames
  ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111114', 'Certificate Frame A4', 210, 297, 0, 5, 300, true),
  -- Triathlon Numbers
  ('22222222-2222-2222-2222-222222222226', '11111111-1111-1111-1111-111111111115', 'Triathlon Bib 200x170mm', 200, 170, 3, 5, 300, true),
  -- Cycling Race Plates
  ('22222222-2222-2222-2222-222222222227', '11111111-1111-1111-1111-111111111116', 'Cycling Plate 190x130mm', 190, 130, 0, 5, 300, true),
  -- Event Lanyards
  ('22222222-2222-2222-2222-222222222228', '11111111-1111-1111-1111-111111111117', 'Lanyard 20mm x 900mm', 20, 900, 0, 3, 300, true),
  -- Engraved Keyrings
  ('22222222-2222-2222-2222-222222222229', '11111111-1111-1111-1111-111111111118', 'Keyring 60x30mm Rectangle', 60, 30, 0, 3, 300, true),
  ('22222222-2222-2222-2222-222222222230', '11111111-1111-1111-1111-111111111118', 'Keyring 50mm Round', 50, 50, 0, 3, 300, true),
  -- Laser-cut Perspex Signage
  ('22222222-2222-2222-2222-222222222231', '11111111-1111-1111-1111-111111111119', 'Perspex Sign A3', 297, 420, 0, 5, 300, true),
  ('22222222-2222-2222-2222-222222222232', '11111111-1111-1111-1111-111111111119', 'Perspex Sign A2', 420, 594, 0, 5, 300, true),
  -- Personalised Gifts
  ('22222222-2222-2222-2222-222222222233', '11111111-1111-1111-1111-111111111120', 'Wine Box 350x120x90mm', 350, 120, 0, 5, 300, true)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Pricing Rules (indicative — client to confirm final prices)
-- ============================================================

INSERT INTO pricing_rules (id, product_group_id, rule_type, conditions, price_value, currency, is_active, display_order)
VALUES
  -- Engraved Plaques
  ('44444444-4444-4444-4444-444444444420', '11111111-1111-1111-1111-111111111111', 'base_price', '{"description": "Base price per plaque"}', 280.00, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444421', '11111111-1111-1111-1111-111111111111', 'quantity_break', '{"min_qty": 5, "max_qty": 19, "description": "5-19 plaques"}', 240.00, 'ZAR', true, 2),
  ('44444444-4444-4444-4444-444444444422', '11111111-1111-1111-1111-111111111111', 'quantity_break', '{"min_qty": 20, "max_qty": 9999, "description": "20+ plaques"}', 200.00, 'ZAR', true, 3),
  -- Medallions
  ('44444444-4444-4444-4444-444444444423', '11111111-1111-1111-1111-111111111112', 'base_price', '{"description": "Base price per medallion"}', 45.00, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444424', '11111111-1111-1111-1111-111111111112', 'quantity_break', '{"min_qty": 50, "max_qty": 199, "description": "50-199 medallions"}', 35.00, 'ZAR', true, 2),
  ('44444444-4444-4444-4444-444444444425', '11111111-1111-1111-1111-111111111112', 'quantity_break', '{"min_qty": 200, "max_qty": 9999, "description": "200+ medallions"}', 28.00, 'ZAR', true, 3),
  -- Corporate Awards
  ('44444444-4444-4444-4444-444444444426', '11111111-1111-1111-1111-111111111113', 'base_price', '{"description": "Base price per award"}', 650.00, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444427', '11111111-1111-1111-1111-111111111113', 'quantity_break', '{"min_qty": 10, "max_qty": 9999, "description": "10+ awards"}', 520.00, 'ZAR', true, 2),
  -- Certificate Frames
  ('44444444-4444-4444-4444-444444444428', '11111111-1111-1111-1111-111111111114', 'base_price', '{"description": "Base price per frame"}', 120.00, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444429', '11111111-1111-1111-1111-111111111114', 'quantity_break', '{"min_qty": 10, "max_qty": 9999, "description": "10+ frames"}', 95.00, 'ZAR', true, 2),
  -- Triathlon Numbers
  ('44444444-4444-4444-4444-444444444430', '11111111-1111-1111-1111-111111111115', 'base_price', '{"description": "Base price per triathlon number set"}', 18.00, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444431', '11111111-1111-1111-1111-111111111115', 'quantity_break', '{"min_qty": 100, "max_qty": 499, "description": "100-499 sets"}', 14.00, 'ZAR', true, 2),
  ('44444444-4444-4444-4444-444444444432', '11111111-1111-1111-1111-111111111115', 'quantity_break', '{"min_qty": 500, "max_qty": 9999, "description": "500+ sets"}', 11.00, 'ZAR', true, 3),
  -- Cycling Race Plates
  ('44444444-4444-4444-4444-444444444433', '11111111-1111-1111-1111-111111111116', 'base_price', '{"description": "Base price per plate set (front + rear)"}', 35.00, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444434', '11111111-1111-1111-1111-111111111116', 'quantity_break', '{"min_qty": 100, "max_qty": 499, "description": "100-499 sets"}', 28.00, 'ZAR', true, 2),
  ('44444444-4444-4444-4444-444444444435', '11111111-1111-1111-1111-111111111116', 'quantity_break', '{"min_qty": 500, "max_qty": 9999, "description": "500+ sets"}', 22.00, 'ZAR', true, 3),
  -- Event Lanyards
  ('44444444-4444-4444-4444-444444444436', '11111111-1111-1111-1111-111111111117', 'base_price', '{"description": "Base price per lanyard"}', 22.00, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444437', '11111111-1111-1111-1111-111111111117', 'quantity_break', '{"min_qty": 100, "max_qty": 499, "description": "100-499 lanyards"}', 16.00, 'ZAR', true, 2),
  ('44444444-4444-4444-4444-444444444438', '11111111-1111-1111-1111-111111111117', 'quantity_break', '{"min_qty": 500, "max_qty": 9999, "description": "500+ lanyards"}', 12.00, 'ZAR', true, 3),
  -- Engraved Keyrings
  ('44444444-4444-4444-4444-444444444439', '11111111-1111-1111-1111-111111111118', 'base_price', '{"description": "Base price per keyring"}', 55.00, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444440', '11111111-1111-1111-1111-111111111118', 'quantity_break', '{"min_qty": 20, "max_qty": 99, "description": "20-99 keyrings"}', 42.00, 'ZAR', true, 2),
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111118', 'quantity_break', '{"min_qty": 100, "max_qty": 9999, "description": "100+ keyrings"}', 32.00, 'ZAR', true, 3),
  -- Laser-cut Perspex Signage
  ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111119', 'base_price', '{"description": "Base price per sign"}', 320.00, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111119', 'quantity_break', '{"min_qty": 5, "max_qty": 9999, "description": "5+ signs"}', 270.00, 'ZAR', true, 2),
  -- Personalised Gifts
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111120', 'base_price', '{"description": "Base price per personalised gift"}', 180.00, 'ZAR', true, 1),
  ('44444444-4444-4444-4444-444444444445', '11111111-1111-1111-1111-111111111120', 'quantity_break', '{"min_qty": 10, "max_qty": 9999, "description": "10+ gifts"}', 145.00, 'ZAR', true, 2)

ON CONFLICT (id) DO NOTHING;
