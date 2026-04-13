-- Migration: restore stamps as a first-class division
-- self-inking-stamps was folded into 'print' by 20260402_update_division_keys.sql
-- This migration re-adds 'stamps' to the enum and reassigns the product.

ALTER TYPE division_type ADD VALUE IF NOT EXISTS 'stamps';

-- Reassign stamp product(s) from print → stamps
UPDATE product_groups
SET division = 'stamps'
WHERE slug = 'self-inking-stamps';
