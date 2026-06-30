-- Remove placeholder image from Event Printing — correct image not yet available.
UPDATE product_groups SET image_url = NULL WHERE slug = 'event-printing';
