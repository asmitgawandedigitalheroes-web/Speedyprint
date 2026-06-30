-- Add flat_order_addon rule type + expand safety_pins options to support multiple boxes.
-- flat_order_addon: like option_addon but charged ONCE per order (not × quantity).
-- Used for: safety pins boxes, tare-off strips — any flat per-order conditional add-on.

ALTER TYPE pricing_rule_type ADD VALUE IF NOT EXISTS 'flat_order_addon';

-- Update safety_pins template parameter on all race-number templates to offer 1–5 boxes.
UPDATE template_parameters
SET options = '["None", "1 Box (864 pins)", "2 Boxes", "3 Boxes", "4 Boxes", "5 Boxes"]'
WHERE param_key = 'safety_pins'
  AND product_template_id IN (
    SELECT tp.id FROM product_templates tp
    JOIN product_groups pg ON tp.product_group_id = pg.id
    WHERE pg.division = 'race-numbers'
  );
