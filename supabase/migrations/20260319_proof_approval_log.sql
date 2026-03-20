-- Add approval log columns to proofs table
ALTER TABLE proofs
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_ip text;

-- Index for looking up proofs by approver
CREATE INDEX IF NOT EXISTS proofs_approved_by_idx ON proofs(approved_by);
CREATE INDEX IF NOT EXISTS proofs_order_item_id_idx ON proofs(order_item_id);
CREATE INDEX IF NOT EXISTS proofs_status_idx ON proofs(status);

-- Ensure proofs table has all needed columns (idempotent)
ALTER TABLE proofs
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;

-- RLS: customers can only see their own proofs (via order ownership)
-- (Assuming RLS is already enabled on the proofs table)
-- If not:
-- ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;

-- Allow customers to read proofs for their own order items
DROP POLICY IF EXISTS "customers_read_own_proofs" ON proofs;
CREATE POLICY "customers_read_own_proofs" ON proofs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.id = proofs.order_item_id
      AND o.user_id = auth.uid()
    )
  );

-- Allow customers to update status/notes on pending proofs they own
DROP POLICY IF EXISTS "customers_update_own_proofs" ON proofs;
CREATE POLICY "customers_update_own_proofs" ON proofs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.id = proofs.order_item_id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (status IN ('approved', 'revision_requested'));

-- Service role has full access (for admin operations)
