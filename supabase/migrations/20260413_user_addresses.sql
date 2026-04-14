-- User saved addresses for checkout
CREATE TABLE IF NOT EXISTS user_addresses (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label         TEXT        NOT NULL DEFAULT '',
  full_name     TEXT        NOT NULL DEFAULT '',
  line1         TEXT        NOT NULL DEFAULT '',
  line2         TEXT,
  city          TEXT        NOT NULL DEFAULT '',
  province      TEXT        NOT NULL DEFAULT '',
  postal_code   TEXT        NOT NULL DEFAULT '',
  country       TEXT        NOT NULL DEFAULT 'South Africa',
  is_default    BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_addresses_user_id_idx ON user_addresses(user_id);

ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own addresses"
  ON user_addresses
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all addresses (e.g. for order fulfilment lookup)
CREATE POLICY "Admins read all addresses"
  ON user_addresses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
