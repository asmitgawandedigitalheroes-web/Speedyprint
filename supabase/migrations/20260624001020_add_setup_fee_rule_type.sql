-- Add setup_fee to the pricing_rule_type enum
ALTER TYPE pricing_rule_type ADD VALUE IF NOT EXISTS 'setup_fee';
