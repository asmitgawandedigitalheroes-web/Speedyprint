-- Allow guest orders (no account required)
DO $$
BEGIN
  -- Make user_id nullable so guests can place orders without an account
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'user_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
  END IF;

  -- Store guest contact email when user_id is null
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'guest_email'
  ) THEN
    ALTER TABLE orders ADD COLUMN guest_email TEXT;
  END IF;
END $$;
