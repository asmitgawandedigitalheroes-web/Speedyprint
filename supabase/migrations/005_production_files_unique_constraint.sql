-- Add unique constraint on production_files (file_name, order_item_id)
-- Prevents duplicate rows when re-running production file generation.
-- Apply AFTER clearing any existing duplicates:
--   DELETE FROM production_files WHERE id NOT IN (
--     SELECT MIN(id) FROM production_files GROUP BY file_name, order_item_id
--   );

ALTER TABLE production_files
  ADD CONSTRAINT uq_production_files_name_item
  UNIQUE (file_name, order_item_id);
