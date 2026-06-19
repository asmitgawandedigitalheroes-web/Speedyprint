-- ============================================================
-- Product Images & Site Settings Corrections — April 2026
-- Maps available static images to product_groups.image_url
-- Also corrects site settings contact data.
-- Uses slug-based lookups. Safe to re-run.
-- Images from /public/images/products/ and /public/newimages/
-- ============================================================

-- Fix address in site_settings (overrides any previously manually-set value)
INSERT INTO site_settings (key, value) VALUES
  ('company_address', '13 Langwa Street, Strydompark, Randburg, 2169'),
  ('company_email', 'info@speedyprint.co.za'),
  ('company_phone', '011 027 1811')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- ============================================================
-- Product Images — April 2026
-- Maps available static images to product_groups.image_url
-- Uses slug-based lookups. Safe to re-run.
-- Images from /public/images/products/ and /public/newimages/
-- ============================================================

-- Labels division
UPDATE product_groups SET image_url = '/newimages/Pure Bloom Body Oil label 50mm x 100mm.jpg'
  WHERE slug = 'custom-labels' AND (image_url IS NULL OR image_url = '');

UPDATE product_groups SET image_url = '/images/products/vinyl-stickers.png'
  WHERE slug = 'vinyl-stickers' AND (image_url IS NULL OR image_url = '');

UPDATE product_groups SET image_url = '/newimages/Carmella''s by sir Coffee sleeve.jpg'
  WHERE slug = 'coffee-cup-sleeves' AND (image_url IS NULL OR image_url = '');

UPDATE product_groups SET image_url = '/newimages/Toricda Elegancia business cards.jpg'
  WHERE slug = 'business-cards' AND (image_url IS NULL OR image_url = '');

UPDATE product_groups SET image_url = '/newimages/Joye labels _1 70mm x 120mm.jpg'
  WHERE slug = 'wristbands' AND (image_url IS NULL OR image_url = '');

UPDATE product_groups SET image_url = '/newimages/G''Rilla Labels - day bomb 60mm x 40mm.jpg'
  WHERE slug = 'car-magnets' AND (image_url IS NULL OR image_url = '');

-- Race Numbers division
UPDATE product_groups SET image_url = '/newimages/CBZ Marathon.jpg'
  WHERE slug = 'race-numbers' AND (image_url IS NULL OR image_url = '');

UPDATE product_groups SET image_url = '/images/products/race-bibs.png'
  WHERE slug = 'race-bibs' AND (image_url IS NULL OR image_url = '');

UPDATE product_groups SET image_url = '/images/products/event-tags.png'
  WHERE slug = 'event-tags' AND (image_url IS NULL OR image_url = '');

-- MTB Boards division
UPDATE product_groups SET image_url = '/images/products/mtb-number-boards.png'
  WHERE slug = 'mtb-number-boards' AND (image_url IS NULL OR image_url = '');

-- Stamps (print) division
UPDATE product_groups SET image_url = '/images/products/self-inking-stamps.png'
  WHERE slug = 'self-inking-stamps' AND (image_url IS NULL OR image_url = '');

-- Laser division
UPDATE product_groups SET image_url = '/images/products/acrylic-signs.png'
  WHERE slug = 'acrylic-signs' AND (image_url IS NULL OR image_url = '');

-- Trophies division
UPDATE product_groups SET image_url = '/images/products/award-trophies.png'
  WHERE slug IN ('award-trophies', 'trophies') AND (image_url IS NULL OR image_url = '');

UPDATE product_groups SET image_url = '/images/products/wooden-plaques.png'
  WHERE slug IN ('wooden-plaques', 'engraved-plaques', 'plaques') AND (image_url IS NULL OR image_url = '');
