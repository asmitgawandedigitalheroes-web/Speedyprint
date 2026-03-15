-- Migration 003: Admin Enhancements
-- Adds: template images, order tracking, site settings, order status history

-- 1. Per-template images
ALTER TABLE product_templates ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Order tracking fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

-- 3. Site settings (key-value store)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO site_settings (key, value) VALUES
  ('whatsapp_number', '27123456789'),
  ('company_email', 'info@speedyprint.co.za'),
  ('company_phone', '+27 12 345 6789'),
  ('company_address', 'Cape Town, South Africa'),
  ('vat_rate', '0.15'),
  ('free_delivery_threshold', '500'),
  ('flat_shipping_rate', '85'),
  ('site_name', 'SpeedyPrint'),
  ('site_tagline', 'Custom Stickers & Labels'),
  ('social_facebook', ''),
  ('social_instagram', ''),
  ('social_twitter', ''),
  ('logo_url', '/images/logo.png')
ON CONFLICT (key) DO NOTHING;

-- RLS for site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 4. Order status history / audit trail
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order
  ON order_status_history(order_id);

-- RLS for order_status_history
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order status history"
  ON order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage order status history"
  ON order_status_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'production_staff')
    )
  );
