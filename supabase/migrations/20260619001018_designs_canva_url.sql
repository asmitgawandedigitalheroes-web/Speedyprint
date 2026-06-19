-- Add canva_url column to designs table so a linked Canva design can be
-- stored alongside the Speedyprint canvas JSON.
ALTER TABLE designs
  ADD COLUMN IF NOT EXISTS canva_url TEXT;
