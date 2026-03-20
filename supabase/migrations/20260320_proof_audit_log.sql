-- ─────────────────────────────────────────────────────────────────────────────
-- proof_audit_log: full lifecycle audit trail for every proof action
--
-- Actions logged:
--   proof_created        – admin/production_staff creates a new proof version
--   proof_approved       – customer approves a proof
--   revision_requested   – customer requests changes (with notes)
--   production_generated – admin/production_staff generates the production PDF
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proof_audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_id      uuid NOT NULL REFERENCES proofs(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  action        text NOT NULL
                  CHECK (action IN (
                    'proof_created',
                    'proof_approved',
                    'revision_requested',
                    'production_generated'
                  )),
  actor_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role    text CHECK (actor_role IN ('customer', 'admin', 'production_staff', 'system')),
  notes         text,
  client_ip     text,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Primary lookup: all audit events for a proof
CREATE INDEX IF NOT EXISTS proof_audit_log_proof_id_idx
  ON proof_audit_log (proof_id, created_at DESC);

-- Look up all events for an order item
CREATE INDEX IF NOT EXISTS proof_audit_log_order_item_idx
  ON proof_audit_log (order_item_id, created_at DESC);

-- Look up all actions performed by a specific user
CREATE INDEX IF NOT EXISTS proof_audit_log_actor_idx
  ON proof_audit_log (actor_id, created_at DESC);

-- Filter by action type (e.g. all approvals)
CREATE INDEX IF NOT EXISTS proof_audit_log_action_idx
  ON proof_audit_log (action, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE proof_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins and production staff can read all audit logs
DROP POLICY IF EXISTS "staff_read_audit_log" ON proof_audit_log;
CREATE POLICY "staff_read_audit_log" ON proof_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'production_staff')
    )
  );

-- Customers can read audit logs for their own order items only
DROP POLICY IF EXISTS "customers_read_own_audit_log" ON proof_audit_log;
CREATE POLICY "customers_read_own_audit_log" ON proof_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.id = proof_audit_log.order_item_id
        AND o.user_id = auth.uid()
    )
  );

-- No direct inserts from the client — all writes go through the service role
-- (logProofAudit helper uses createAdminClient which bypasses RLS)
