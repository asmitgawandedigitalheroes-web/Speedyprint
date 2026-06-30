-- Move wristbands product group from 'labels' division to 'race-numbers'
-- Reason: wristbands are event/race products, not label products.
UPDATE product_groups
SET division = 'race-numbers'
WHERE slug = 'wristbands';
