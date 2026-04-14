-- ── quote_requests ────────────────────────────────────────────────────────────
-- Dedicated table for bulk-quote enquiries submitted via the public quote form.
-- Separate from contact_submissions so quotes can have their own workflow:
--   new → reviewing → quoted → accepted | rejected | expired

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact
  full_name         TEXT        NOT NULL,
  email             TEXT        NOT NULL,
  phone             TEXT,
  company           TEXT,

  -- Project
  event_name        TEXT,
  event_date        DATE,
  delivery_date     DATE,

  -- Product spec
  product_type      TEXT,
  quantity          TEXT,
  dimensions        TEXT,
  material          TEXT,
  finish            TEXT,
  special_instructions TEXT,
  referral          TEXT,
  artwork_url       TEXT,

  -- Quote workflow
  status            TEXT        NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new','reviewing','quoted','accepted','rejected','expired')),
  quoted_price      NUMERIC(10,2),
  quote_valid_days  INTEGER     DEFAULT 14,
  admin_notes       TEXT,
  reply_message     TEXT,
  replied_at        TIMESTAMPTZ,
  replied_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_quote_requests_updated_at ON public.quote_requests;
CREATE TRIGGER trg_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qr_status     ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_qr_created_at ON public.quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_email      ON public.quote_requests(email);

-- RLS — only admin/production_staff can query; inserts are open (public form)
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Public can insert (no auth required for quote form)
CREATE POLICY "Anyone can submit a quote" ON public.quote_requests
  FOR INSERT WITH CHECK (true);

-- Only admin/production_staff can read, update, delete
CREATE POLICY "Admin manages quotes" ON public.quote_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'production_staff')
    )
  );
