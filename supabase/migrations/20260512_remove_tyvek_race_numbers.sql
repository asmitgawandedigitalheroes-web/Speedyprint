-- Remove Tyvek from race-numbers material options — Speedy Print does not stock Tyvek for race bibs.
-- Replace with Ecoflex / TEX21 which are the actual materials stocked.

UPDATE template_parameters
SET
  options = REPLACE(options::text, '"Tyvek", ', '')::jsonb,
  default_value = CASE WHEN default_value = 'Tyvek' THEN 'Ecoflex' ELSE default_value END
WHERE param_key = 'material'
  AND options::text ILIKE '%Tyvek%'
  AND product_template_id IN (
    SELECT pt.id
    FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.division = 'race-numbers'
  );

-- Handle the case where Tyvek appears without a trailing comma (end of array)
UPDATE template_parameters
SET
  options = REPLACE(options::text, ', "Tyvek"', '')::jsonb,
  default_value = CASE WHEN default_value = 'Tyvek' THEN 'Ecoflex' ELSE default_value END
WHERE param_key = 'material'
  AND options::text ILIKE '%Tyvek%'
  AND product_template_id IN (
    SELECT pt.id
    FROM product_templates pt
    JOIN product_groups pg ON pg.id = pt.product_group_id
    WHERE pg.division = 'race-numbers'
  );
