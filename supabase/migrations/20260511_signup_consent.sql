-- Add marketing opt-in and terms acceptance tracking to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'marketing_opt_in'
  ) THEN
    ALTER TABLE profiles ADD COLUMN marketing_opt_in BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'terms_accepted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN terms_accepted_at TIMESTAMPTZ;
  END IF;
END $$;
