import { createAdminClient } from '@/lib/supabase/admin'

export interface LogActivityParams {
  user_id: string | null
  action: string
  entity_type: string
  entity_id?: string | null
  metadata?: Record<string, any>
  is_admin_action?: boolean
}

/**
 * Logs a system-wide activity to the audit_logs table.
 * Uses the admin client to ensure logs are written regardless of RLS.
 */
export async function logActivity(params: LogActivityParams) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('audit_logs').insert({
      user_id: params.user_id,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id ?? null,
      metadata: params.metadata ?? {},
      is_admin_action: params.is_admin_action ?? false,
    })

    if (error) {
      console.error('[AuditLog] Failed to log activity:', error.message)
    }
  } catch (err) {
    console.error('[AuditLog] Unexpected error during logging:', err)
  }
}
