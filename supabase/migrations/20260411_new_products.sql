-- ============================================================
-- New Products — April 2026
-- Uses slug-based lookups — no hardcoded UUIDs.
-- Safe to re-run: all inserts are guarded by NOT EXISTS checks.
-- ============================================================

-- ============================================================
-- HELPER: create product group + templates + parameters + pricing
-- Each section is a self-contained DO $$ block.
-- ============================================================

-- ============================================================
-- 1. WRISTBANDS (division: labels)
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug = 'wristbands') THEN
    INSERT INTO product_groups (name, slug, division, description, is_active, display_order)
    VALUES ('Wristbands', 'wristbands', 'labels',
            'Custom printed wristbands for events, festivals, and hospitality. Available in Tyvek, silicone, and fabric materials.',
            true, 12);
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug = 'wristbands';
  IF v_grp IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Wristband S') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'Wristband S','Small wristband',180,25,2,2,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Wristband M') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'Wristband M','Medium wristband',210,25,2,2,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Wristband L') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'Wristband L','Large wristband',240,25,2,2,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Wristband XL') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'Wristband XL','XL wristband',270,25,2,2,300,true); END IF;

  -- Parameters for all templates
  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'material','Material','select','["Tyvek", "Silicone", "Fabric"]','Tyvek',1
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='material');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'print_option','Print Option','select','["Full Colour", "Black"]','Full Colour',2
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='print_option');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'colour','Band Colour','select','["White", "Red", "Blue", "Green", "Yellow", "Black", "Custom"]','White',3
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='colour');

  -- Pricing
  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id=v_grp AND rule_type='base_price') THEN
    INSERT INTO pricing_rules (product_group_id,rule_type,conditions,price_value,currency,is_active,display_order) VALUES
      (v_grp,'base_price','{"description":"Base price per wristband"}',3.50,'ZAR',true,1),
      (v_grp,'quantity_break','{"min_qty":100,"max_qty":499}',2.80,'ZAR',true,2),
      (v_grp,'quantity_break','{"min_qty":500,"max_qty":9999}',2.20,'ZAR',true,3),
      (v_grp,'material_addon','{"material":"Silicone"}',2.00,'ZAR',true,4),
      (v_grp,'material_addon','{"material":"Fabric"}',3.00,'ZAR',true,5);
  END IF;
END $$;

-- ============================================================
-- 2. CAR MAGNETS (division: labels)
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug='car-magnets') THEN
    INSERT INTO product_groups (name,slug,division,description,is_active,display_order)
    VALUES ('Car Magnets','car-magnets','labels',
            'Full-colour car magnets on premium magnetic vinyl. Available in A4, A3, and custom sizes.',true,13);
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug='car-magnets';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='A4 Car Magnet') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'A4 Car Magnet','A4: 210mm × 297mm',210,297,3,5,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='A3 Car Magnet') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'A3 Car Magnet','A3: 297mm × 420mm',297,420,3,5,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Custom Size Car Magnet') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active,template_json)
    VALUES (v_grp,'Custom Size Car Magnet','Custom size — on request',300,300,3,5,300,true,
            '{"min_width_mm":80,"max_width_mm":500,"width_step_mm":1,"min_height_mm":80,"max_height_mm":500,"height_step_mm":1}'); END IF;

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'print_option','Print Option','select','["Full Colour Single Sided","Full Colour Double Sided"]','Full Colour Single Sided',1
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='print_option');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id=v_grp AND rule_type='base_price') THEN
    INSERT INTO pricing_rules (product_group_id,rule_type,conditions,price_value,currency,is_active,display_order) VALUES
      (v_grp,'base_price','{"description":"Base price per car magnet (A4)"}',85.00,'ZAR',true,1),
      (v_grp,'size_tier','{"size":"A3"}',120.00,'ZAR',true,2),
      (v_grp,'quantity_break','{"min_qty":10,"max_qty":49}',70.00,'ZAR',true,3),
      (v_grp,'quantity_break','{"min_qty":50,"max_qty":9999}',55.00,'ZAR',true,4);
  END IF;
END $$;

-- ============================================================
-- 3. ENVELOPES (division: print)
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug='envelopes') THEN
    INSERT INTO product_groups (name,slug,division,description,is_active,display_order)
    VALUES ('Envelopes','envelopes','print',
            'Custom printed envelopes for corporate and personal use. DL, C5, and C4 sizes on 80gsm or 120gsm stock.',true,14);
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug='envelopes';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='DL Envelope') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'DL Envelope','DL: 110mm × 220mm',110,220,2,3,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='C5 Envelope') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'C5 Envelope','C5: 162mm × 229mm',162,229,2,3,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='C4 Envelope') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'C4 Envelope','C4: 229mm × 324mm',229,324,2,3,300,true); END IF;

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'material','Material','select','["80gsm","120gsm"]','80gsm',1
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='material');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'print_option','Print Option','select',
    '["Full Colour Single Sided","Black Single Sided","Full Colour Double Sided","Black Double Sided"]','Full Colour Single Sided',2
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='print_option');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id=v_grp AND rule_type='base_price') THEN
    INSERT INTO pricing_rules (product_group_id,rule_type,conditions,price_value,currency,is_active,display_order) VALUES
      (v_grp,'base_price','{"description":"Base price per envelope"}',1.80,'ZAR',true,1),
      (v_grp,'quantity_break','{"min_qty":500,"max_qty":999}',1.30,'ZAR',true,2),
      (v_grp,'quantity_break','{"min_qty":1000,"max_qty":9999}',0.90,'ZAR',true,3),
      (v_grp,'material_addon','{"material":"120gsm"}',0.40,'ZAR',true,4);
  END IF;
END $$;

-- ============================================================
-- 4. CERTIFICATES (division: print)
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug='certificates') THEN
    INSERT INTO product_groups (name,slug,division,description,is_active,display_order)
    VALUES ('Certificates','certificates','print',
            'Premium printed certificates for awards, achievements, and recognition. A4 and A5 with gloss or matt lamination.',true,15);
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug='certificates';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='A4 Certificate') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'A4 Certificate','A4: 210mm × 297mm',210,297,3,5,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='A5 Certificate') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'A5 Certificate','A5: 148mm × 210mm',148,210,3,5,300,true); END IF;

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'material','Material','select','["120gsm","170gsm Gloss"]','120gsm',1
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='material');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'print_option','Print Option','select','["Full Colour Single Sided","Full Colour Double Sided"]','Full Colour Single Sided',2
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='print_option');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'finishing','Finishing','select','["None","Gloss Lamination","Matt Lamination"]','None',3
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='finishing');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id=v_grp AND rule_type='base_price') THEN
    INSERT INTO pricing_rules (product_group_id,rule_type,conditions,price_value,currency,is_active,display_order) VALUES
      (v_grp,'base_price','{"description":"Base price per certificate"}',8.00,'ZAR',true,1),
      (v_grp,'quantity_break','{"min_qty":100,"max_qty":499}',6.00,'ZAR',true,2),
      (v_grp,'material_addon','{"material":"170gsm Gloss"}',2.00,'ZAR',true,3),
      (v_grp,'finish_addon','{"finishing":"Gloss Lamination"}',1.50,'ZAR',true,4),
      (v_grp,'finish_addon','{"finishing":"Matt Lamination"}',1.50,'ZAR',true,5);
  END IF;
END $$;

-- ============================================================
-- 5. BUSINESS CARDS (division: print)
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug='business-cards') THEN
    INSERT INTO product_groups (name,slug,division,description,is_active,display_order)
    VALUES ('Business Cards','business-cards','print',
            'High-quality business cards on 350gsm or 400gsm stock. Standard 85×55mm or custom size with gloss, matt, or spot UV finishes.',true,16);
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug='business-cards';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Standard Business Card — 85mm × 55mm') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'Standard Business Card — 85mm × 55mm','Standard size',85,55,2,3,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Custom Size Business Card') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active,template_json)
    VALUES (v_grp,'Custom Size Business Card','Custom size — on request',90,60,2,3,300,true,
            '{"min_width_mm":60,"max_width_mm":100,"width_step_mm":1,"min_height_mm":40,"max_height_mm":70,"height_step_mm":1}'); END IF;

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'material','Material','select','["350gsm","400gsm"]','350gsm',1
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='material');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'print_option','Print Option','select','["Full Colour Single Sided","Full Colour Double Sided"]','Full Colour Double Sided',2
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='print_option');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'finishing','Finishing','select','["None","Gloss Lamination","Matt Lamination","Spot UV"]','None',3
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='finishing');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id=v_grp AND rule_type='base_price') THEN
    INSERT INTO pricing_rules (product_group_id,rule_type,conditions,price_value,currency,is_active,display_order) VALUES
      (v_grp,'base_price','{"description":"Base price per business card"}',2.50,'ZAR',true,1),
      (v_grp,'quantity_break','{"min_qty":250,"max_qty":499}',1.80,'ZAR',true,2),
      (v_grp,'quantity_break','{"min_qty":500,"max_qty":9999}',1.20,'ZAR',true,3),
      (v_grp,'material_addon','{"material":"400gsm"}',0.50,'ZAR',true,4),
      (v_grp,'finish_addon','{"finishing":"Gloss Lamination"}',0.60,'ZAR',true,5),
      (v_grp,'finish_addon','{"finishing":"Matt Lamination"}',0.60,'ZAR',true,6),
      (v_grp,'finish_addon','{"finishing":"Spot UV"}',1.00,'ZAR',true,7);
  END IF;
END $$;

-- ============================================================
-- 6. BROCHURES & CATALOGUES (division: print)
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug='brochures-catalogues') THEN
    INSERT INTO product_groups (name,slug,division,description,is_active,display_order)
    VALUES ('Brochures & Catalogues','brochures-catalogues','print',
            'Professional brochures and catalogues in A4, A5, and DL. Bi-fold or tri-fold on 130gsm or 170gsm gloss stock.',true,17);
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug='brochures-catalogues';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='A4 Brochure') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'A4 Brochure','A4: 210mm × 297mm',210,297,3,5,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='A5 Brochure') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'A5 Brochure','A5: 148mm × 210mm',148,210,3,5,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='DL Brochure') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'DL Brochure','DL: 99mm × 210mm',99,210,3,5,300,true); END IF;

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'material','Material','select','["130gsm Gloss","170gsm Gloss"]','130gsm Gloss',1
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='material');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'folding','Folding','select','["None","Bi-Fold","Tri-Fold"]','Bi-Fold',2
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='folding');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'print_option','Print Option','select','["Full Colour Single Sided","Full Colour Double Sided"]','Full Colour Double Sided',3
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='print_option');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id=v_grp AND rule_type='base_price') THEN
    INSERT INTO pricing_rules (product_group_id,rule_type,conditions,price_value,currency,is_active,display_order) VALUES
      (v_grp,'base_price','{"description":"Base price per brochure"}',4.50,'ZAR',true,1),
      (v_grp,'quantity_break','{"min_qty":500,"max_qty":999}',3.20,'ZAR',true,2),
      (v_grp,'quantity_break','{"min_qty":1000,"max_qty":9999}',2.50,'ZAR',true,3),
      (v_grp,'material_addon','{"material":"170gsm Gloss"}',1.00,'ZAR',true,4);
  END IF;
END $$;

-- ============================================================
-- 7. NOTE PADS (division: print)
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug='note-pads') THEN
    INSERT INTO product_groups (name,slug,division,description,is_active,display_order)
    VALUES ('Note Pads','note-pads','print',
            'Custom branded note pads in A4, A5, and A6. Available in 25, 50, or 100 sheets on 80gsm with glued or stapled binding.',true,18);
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug='note-pads';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='A4 Note Pad') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'A4 Note Pad','A4: 210mm × 297mm',210,297,3,5,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='A5 Note Pad') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'A5 Note Pad','A5: 148mm × 210mm',148,210,3,5,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='A6 Note Pad') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'A6 Note Pad','A6: 105mm × 148mm',105,148,3,5,300,true); END IF;

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'sheets','Sheets per Pad','select','["25 sheets","50 sheets","100 sheets"]','50 sheets',1
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='sheets');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'binding','Binding','select','["Glued","Stapled"]','Glued',2
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='binding');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id=v_grp AND rule_type='base_price') THEN
    INSERT INTO pricing_rules (product_group_id,rule_type,conditions,price_value,currency,is_active,display_order) VALUES
      (v_grp,'base_price','{"description":"Base price per note pad (25 sheets)"}',35.00,'ZAR',true,1),
      (v_grp,'option_addon','{"sheets":"50 sheets"}',20.00,'ZAR',true,2),
      (v_grp,'option_addon','{"sheets":"100 sheets"}',45.00,'ZAR',true,3),
      (v_grp,'quantity_break','{"min_qty":20,"max_qty":49}',30.00,'ZAR',true,4),
      (v_grp,'quantity_break','{"min_qty":50,"max_qty":9999}',25.00,'ZAR',true,5);
  END IF;
END $$;

-- ============================================================
-- 8. EVENT PRINTING (division: print)
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug='event-printing') THEN
    INSERT INTO product_groups (name,slug,division,description,is_active,display_order)
    VALUES ('Event Printing','event-printing','print',
            'Bespoke event print — invites, table numbers, table talkers, menus, and programs. Multiple sizes and finishes available.',true,19);
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug='event-printing';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Invitations') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'Invitations','Custom event invitations',148,105,3,5,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Table Numbers') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'Table Numbers','Custom event table numbers',100,210,2,3,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Table Talkers (A5)') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'Table Talkers (A5)','A5 table talker — folded tent card',148,210,3,5,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Menus (A4)') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'Menus (A4)','A4 menu: 210mm × 297mm',210,297,3,5,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Programs (A5)') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'Programs (A5)','A5 program: 148mm × 210mm',148,210,3,5,300,true); END IF;

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'material','Material','select','["130gsm Gloss","170gsm Gloss","300gsm"]','130gsm Gloss',1
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='material');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'print_option','Print Option','select',
    '["Full Colour Single Sided","Black Single Sided","Full Colour Double Sided","Black Double Sided"]','Full Colour Double Sided',2
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='print_option');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'finishing','Finishing','select','["None","Gloss Lamination","Matt Lamination"]','None',3
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='finishing');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id=v_grp AND rule_type='base_price') THEN
    INSERT INTO pricing_rules (product_group_id,rule_type,conditions,price_value,currency,is_active,display_order) VALUES
      (v_grp,'base_price','{"description":"Base price per item"}',3.50,'ZAR',true,1),
      (v_grp,'quantity_break','{"min_qty":100,"max_qty":499}',2.80,'ZAR',true,2),
      (v_grp,'quantity_break','{"min_qty":500,"max_qty":9999}',2.00,'ZAR',true,3),
      (v_grp,'material_addon','{"material":"300gsm"}',1.50,'ZAR',true,4),
      (v_grp,'finish_addon','{"finishing":"Gloss Lamination"}',0.80,'ZAR',true,5),
      (v_grp,'finish_addon','{"finishing":"Matt Lamination"}',0.80,'ZAR',true,6);
  END IF;
END $$;

-- ============================================================
-- 9. BIKE FLAPS (division: mtb-boards)
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug='bike-flaps') THEN
    INSERT INTO product_groups (name,slug,division,description,is_active,display_order)
    VALUES ('Bike Flaps','bike-flaps','mtb-boards',
            'Custom branded bike flaps in rubber or plastic. Standard or custom sizes with direct print or vinyl decal.',true,20);
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug='bike-flaps';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Standard Bike Flap') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'Standard Bike Flap','Standard: 150mm × 100mm',150,100,2,3,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Custom Size Bike Flap') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active,template_json)
    VALUES (v_grp,'Custom Size Bike Flap','Custom size — on request',150,100,2,3,300,true,
            '{"min_width_mm":80,"max_width_mm":300,"width_step_mm":1,"min_height_mm":60,"max_height_mm":200,"height_step_mm":1}'); END IF;

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'material','Material','select','["Rubber","Plastic"]','Rubber',1
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='material');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'print_option','Print Option','select','["Direct Print","Vinyl Decal Applied"]','Direct Print',2
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='print_option');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id=v_grp AND rule_type='base_price') THEN
    INSERT INTO pricing_rules (product_group_id,rule_type,conditions,price_value,currency,is_active,display_order) VALUES
      (v_grp,'base_price','{"description":"Base price per bike flap"}',45.00,'ZAR',true,1),
      (v_grp,'quantity_break','{"min_qty":20,"max_qty":99}',38.00,'ZAR',true,2),
      (v_grp,'quantity_break','{"min_qty":100,"max_qty":9999}',30.00,'ZAR',true,3);
  END IF;
END $$;

-- ============================================================
-- 10. CORREX BOARDS (division: mtb-boards)
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug='correx-boards') THEN
    INSERT INTO product_groups (name,slug,division,description,is_active,display_order)
    VALUES ('Correx Boards','correx-boards','mtb-boards',
            'Lightweight and durable Correx boards for signage, events, and display. A1, A0, and custom sizes in 3mm or 5mm.',true,21);
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug='correx-boards';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='A1 Correx Board') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'A1 Correx Board','A1: 594mm × 841mm',594,841,3,5,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='A0 Correx Board') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'A0 Correx Board','A0: 841mm × 1189mm',841,1189,3,5,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Custom Size Correx Board') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active,template_json)
    VALUES (v_grp,'Custom Size Correx Board','Custom size — on request',600,900,3,5,300,true,
            '{"min_width_mm":200,"max_width_mm":1200,"width_step_mm":1,"min_height_mm":200,"max_height_mm":1200,"height_step_mm":1}'); END IF;

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'thickness','Thickness','select','["3mm","5mm"]','3mm',1
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='thickness');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'print_option','Print Option','select','["Single Sided","Double Sided"]','Single Sided',2
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='print_option');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id=v_grp AND rule_type='base_price') THEN
    INSERT INTO pricing_rules (product_group_id,rule_type,conditions,price_value,currency,is_active,display_order) VALUES
      (v_grp,'base_price','{"description":"Base price per Correx board (A1)"}',95.00,'ZAR',true,1),
      (v_grp,'size_tier','{"size":"A0"}',150.00,'ZAR',true,2),
      (v_grp,'quantity_break','{"min_qty":10,"max_qty":49}',80.00,'ZAR',true,3),
      (v_grp,'quantity_break','{"min_qty":50,"max_qty":9999}',65.00,'ZAR',true,4),
      (v_grp,'option_addon','{"thickness":"5mm"}',20.00,'ZAR',true,5);
  END IF;
END $$;

-- ============================================================
-- 11. NFC STANDS (division: laser)
-- ============================================================
DO $$
DECLARE v_grp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_groups WHERE slug='nfc-stands') THEN
    INSERT INTO product_groups (name,slug,division,description,is_active,display_order)
    VALUES ('NFC Stands','nfc-stands','laser',
            'Custom NFC stands in acrylic or ABS for contactless menus, reviews, and links. Standard card size or custom.',true,22);
  END IF;
  SELECT id INTO v_grp FROM product_groups WHERE slug='nfc-stands';

  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Standard NFC Stand — 85mm × 55mm') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active)
    VALUES (v_grp,'Standard NFC Stand — 85mm × 55mm','Business card size',85,55,2,3,300,true); END IF;
  IF NOT EXISTS (SELECT 1 FROM product_templates WHERE product_group_id=v_grp AND name='Custom Size NFC Stand') THEN
    INSERT INTO product_templates (product_group_id,name,description,print_width_mm,print_height_mm,bleed_mm,safe_zone_mm,dpi,is_active,template_json)
    VALUES (v_grp,'Custom Size NFC Stand','Custom size — on request',100,80,2,3,300,true,
            '{"min_width_mm":60,"max_width_mm":300,"width_step_mm":1,"min_height_mm":60,"max_height_mm":300,"height_step_mm":1}'); END IF;

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'material','Material','select','["Acrylic","ABS"]','Acrylic',1
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='material');

  INSERT INTO template_parameters (product_template_id,param_key,param_label,param_type,options,default_value,display_order)
  SELECT pt.id,'finish','Finish','select','["Direct Print","Vinyl Decal"]','Direct Print',2
  FROM product_templates pt WHERE pt.product_group_id=v_grp
  AND NOT EXISTS (SELECT 1 FROM template_parameters WHERE product_template_id=pt.id AND param_key='finish');

  IF NOT EXISTS (SELECT 1 FROM pricing_rules WHERE product_group_id=v_grp AND rule_type='base_price') THEN
    INSERT INTO pricing_rules (product_group_id,rule_type,conditions,price_value,currency,is_active,display_order) VALUES
      (v_grp,'base_price','{"description":"Base price per NFC stand"}',120.00,'ZAR',true,1),
      (v_grp,'quantity_break','{"min_qty":10,"max_qty":49}',95.00,'ZAR',true,2),
      (v_grp,'quantity_break','{"min_qty":50,"max_qty":9999}',75.00,'ZAR',true,3);
  END IF;
END $$;
