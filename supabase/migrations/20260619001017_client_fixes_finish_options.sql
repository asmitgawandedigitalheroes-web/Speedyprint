-- Remove 'Satin' from finish options across all vinyl/sticker templates.
-- Client request (Berdine Redders / Gavin, 18 Jun 2026): finish should be Gloss and Matte only.
UPDATE template_parameters
SET options = '["Gloss", "Matte"]'::jsonb
WHERE param_key = 'finish'
  AND options @> '["Satin"]'::jsonb;
