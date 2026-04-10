-- GoBob courier integration
-- Adds courier tracking fields to orders table

ALTER TABLE orders ADD COLUMN IF NOT EXISTS gobob_shipment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gobob_tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gobob_waybill_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gobob_quoted_rate NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gobob_service_type TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_gobob_shipment
  ON orders(gobob_shipment_id)
  WHERE gobob_shipment_id IS NOT NULL;
