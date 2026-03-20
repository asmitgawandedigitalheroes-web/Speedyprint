/**
 * Proof audit logging helper.
 *
 * Writes a row to `proof_audit_log` for every significant action in the
 * proof lifecycle.  All writes use the admin client so they succeed
 * regardless of the calling user's RLS permissions.
 *
 * Table DDL (see migration file):
 *   proof_audit_log(id, proof_id, order_item_id, action, actor_id,
 *                   actor_role, notes, client_ip, metadata, created_at)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { ProofAuditAction, UserRole } from '@/types'

export interface LogProofAuditParams {
  proof_id: string
  order_item_id: string
  action: ProofAuditAction
  actor_id?: string | null
  actor_role?: UserRole | 'system' | null
  notes?: string | null
  client_ip?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Insert a proof_audit_log row.
 * Never throws — logs the error and continues so audit failures
 * never break the main request flow.
 */
export async function logProofAudit(params: LogProofAuditParams): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('proof_audit_log').insert({
      proof_id:      params.proof_id,
      order_item_id: params.order_item_id,
      action:        params.action,
      actor_id:      params.actor_id   ?? null,
      actor_role:    params.actor_role ?? null,
      notes:         params.notes      ?? null,
      client_ip:     params.client_ip  ?? null,
      metadata:      params.metadata   ?? {},
    })

    if (error) {
      console.error('[ProofAudit] Insert failed:', error.message)
    }
  } catch (err) {
    console.error('[ProofAudit] Unexpected error:', err)
  }
}

/**
 * Extract client IP from a Next.js request's headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  )
}
