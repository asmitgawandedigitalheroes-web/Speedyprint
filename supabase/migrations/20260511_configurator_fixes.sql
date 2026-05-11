-- ============================================================
-- Configurator Fixes — 11 May 2026
-- Covers bugs #12–16:
--   #12  Flyers — add Paper Weight dropdown
--   #13  Certificates — add Paper Weight dropdown
--   #14  Poster Calendars — add Size, Paper Weight, Lamination
--   #15  Cycling Race Plates — add Material and Print Option
--   #16  Acrylic Signs — fix Standoffs field (add options)
--
-- Safe to re-run: all inserts guarded by NOT EXISTS checks.
-- ============================================================


-- ============================================================
-- #12  FLYERS — Paper Weight
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'flyers';
  IF v_grp IS NULL THEN RAISE NOTICE 'flyers not found'; RETURN; END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'paper_weight', 'Paper Weight', 'select',
         '["130gsm Gloss","170gsm Gloss","170gsm Matte","250gsm Gloss"]'::jsonb,
         '130gsm Gloss', 10
  FROM product_templates pt
  WHERE pt.product_group_id = v_grp
    AND NOT EXISTS (
      SELECT 1 FROM template_parameters
      WHERE product_template_id = pt.id AND param_key = 'paper_weight'
    );
END $$;


-- ============================================================
-- #13  CERTIFICATES — Paper Weight
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'certificates';
  IF v_grp IS NULL THEN RAISE NOTICE 'certificates not found'; RETURN; END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'paper_weight', 'Paper Weight', 'select',
         '["170gsm Satin","250gsm Satin","300gsm Satin"]'::jsonb,
         '250gsm Satin', 10
  FROM product_templates pt
  WHERE pt.product_group_id = v_grp
    AND NOT EXISTS (
      SELECT 1 FROM template_parameters
      WHERE product_template_id = pt.id AND param_key = 'paper_weight'
    );
END $$;


-- ============================================================
-- #14  POSTER CALENDARS — Size, Paper Weight, Lamination
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'poster-calendars';
  IF v_grp IS NULL THEN RAISE NOTICE 'poster-calendars not found'; RETURN; END IF;

  -- Size
  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'size', 'Size', 'select',
         '["A4 (210×297mm)","A3 (297×420mm)","A2 (420×594mm)","A1 (594×841mm)"]'::jsonb,
         'A3 (297×420mm)', 1
  FROM product_templates pt
  WHERE pt.product_group_id = v_grp
    AND NOT EXISTS (
      SELECT 1 FROM template_parameters
      WHERE product_template_id = pt.id AND param_key = 'size'
    );

  -- Paper Weight
  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'paper_weight', 'Paper Weight', 'select',
         '["170gsm Gloss","250gsm Matt","300gsm Satin"]'::jsonb,
         '170gsm Gloss', 2
  FROM product_templates pt
  WHERE pt.product_group_id = v_grp
    AND NOT EXISTS (
      SELECT 1 FROM template_parameters
      WHERE product_template_id = pt.id AND param_key = 'paper_weight'
    );

  -- Print Option
  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'print_option', 'Print Option', 'select',
         '["Full Colour","Black & White"]'::jsonb,
         'Full Colour', 3
  FROM product_templates pt
  WHERE pt.product_group_id = v_grp
    AND NOT EXISTS (
      SELECT 1 FROM template_parameters
      WHERE product_template_id = pt.id AND param_key = 'print_option'
    );

  -- Lamination
  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'lamination', 'Lamination', 'select',
         '["None","Gloss Laminate","Matte Laminate"]'::jsonb,
         'None', 4
  FROM product_templates pt
  WHERE pt.product_group_id = v_grp
    AND NOT EXISTS (
      SELECT 1 FROM template_parameters
      WHERE product_template_id = pt.id AND param_key = 'lamination'
    );
END $$;


-- ============================================================
-- #15  CYCLING RACE PLATES — Material and Print Option
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'cycling-race-plates';
  IF v_grp IS NULL THEN
    -- Try alternate slug
    SELECT id INTO v_grp FROM product_groups WHERE slug ILIKE '%race-plate%' OR slug ILIKE '%cycling-plate%' LIMIT 1;
  END IF;
  IF v_grp IS NULL THEN RAISE NOTICE 'cycling-race-plates not found — skipping'; RETURN; END IF;

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'material', 'Material', 'select',
         '["4mm Correx","3mm Aluminium Composite","1mm Aluminium"]'::jsonb,
         '4mm Correx', 1
  FROM product_templates pt
  WHERE pt.product_group_id = v_grp
    AND NOT EXISTS (
      SELECT 1 FROM template_parameters
      WHERE product_template_id = pt.id AND param_key = 'material'
    );

  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'print_option', 'Print Option', 'select',
         '["Full Colour","Single Colour","Black Only"]'::jsonb,
         'Full Colour', 2
  FROM product_templates pt
  WHERE pt.product_group_id = v_grp
    AND NOT EXISTS (
      SELECT 1 FROM template_parameters
      WHERE product_template_id = pt.id AND param_key = 'print_option'
    );
END $$;


-- ============================================================
-- #16  ACRYLIC SIGNS — Fix Standoffs (replace or add options)
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'acrylic-signs';
  IF v_grp IS NULL THEN RAISE NOTICE 'acrylic-signs not found'; RETURN; END IF;

  -- Update existing standoffs param if options are empty/null
  UPDATE template_parameters tp
  SET options = '["None","Four 12mm Standoffs","Four 19mm Standoffs","Four 25mm Standoffs"]'::jsonb,
      default_value = 'None'
  FROM product_templates pt
  WHERE tp.product_template_id = pt.id
    AND pt.product_group_id = v_grp
    AND tp.param_key = 'standoffs'
    AND (tp.options IS NULL OR tp.options::text IN ('null','[]','""'));

  -- Insert if the param doesn't exist at all on any template for this product
  INSERT INTO template_parameters (product_template_id, param_key, param_label, param_type, options, default_value, display_order)
  SELECT pt.id, 'standoffs', 'Standoffs', 'select',
         '["None","Four 12mm Standoffs","Four 19mm Standoffs","Four 25mm Standoffs"]'::jsonb,
         'None', 10
  FROM product_templates pt
  WHERE pt.product_group_id = v_grp
    AND NOT EXISTS (
      SELECT 1 FROM template_parameters
      WHERE product_template_id = pt.id AND param_key = 'standoffs'
    );
END $$;
