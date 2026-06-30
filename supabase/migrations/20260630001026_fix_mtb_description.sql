-- Fix MTB number boards description: remove timing chip mention, clean up material text.
UPDATE product_groups
SET description = 'Mountain bike number boards in three standard sizes or custom on request. Available in Ecoflex board or 0.9mm ABS. Direct print or vinyl decal options available.'
WHERE slug = 'mtb-number-boards';
