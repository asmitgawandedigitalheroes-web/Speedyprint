-- Webhook Idempotency Table
-- Records Stripe event IDs to prevent duplicate processing of the same event.

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id TEXT PRIMARY KEY, -- Stripe Event ID (e.g. evt_...)
    type TEXT NOT NULL,  -- Event type (e.g. checkout.session.completed)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS (though this is for admin-only use via service-role clients)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Deny all public access
DROP POLICY IF EXISTS "No public access to webhook events" ON public.webhook_events;
CREATE POLICY "No public access to webhook events" ON public.webhook_events
    FOR ALL USING (false);

COMMENT ON TABLE public.webhook_events IS 'Stores Stripe event IDs to ensure idempotent webhook processing.';
