-- Switch Payment Gateway integration
-- Adds switch_payment_id to orders and generalises webhook_events table

ALTER TABLE orders ADD COLUMN IF NOT EXISTS switch_payment_id TEXT;

-- Extend webhook_events to support multiple payment providers
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'stripe';
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source);
