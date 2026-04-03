-- Migration: align division_type enum and product_groups.division values
-- Old enum: labels, laser, events, stamps, sleeves
-- New enum: labels, laser, race-numbers, mtb-boards, print, trophies

-- Step 1: Add new enum values
ALTER TYPE division_type ADD VALUE IF NOT EXISTS 'race-numbers';
ALTER TYPE division_type ADD VALUE IF NOT EXISTS 'mtb-boards';
ALTER TYPE division_type ADD VALUE IF NOT EXISTS 'print';
ALTER TYPE division_type ADD VALUE IF NOT EXISTS 'trophies';

-- Step 2: Migrate existing rows to new values
UPDATE product_groups SET division = 'race-numbers'
WHERE slug IN ('race-bibs', 'event-tags') AND division = 'events';

UPDATE product_groups SET division = 'mtb-boards'
WHERE slug = 'mtb-number-boards' AND division = 'events';

UPDATE product_groups SET division = 'print'
WHERE slug IN ('self-inking-stamps', 'coffee-cup-sleeves') AND division IN ('stamps', 'sleeves');

UPDATE product_groups SET division = 'trophies'
WHERE slug = 'award-trophies' AND division = 'sleeves';

-- Note: old enum values (events, stamps, sleeves) are left in place as Postgres
-- does not support removing enum values without recreating the type.
-- They are unused after this migration.
