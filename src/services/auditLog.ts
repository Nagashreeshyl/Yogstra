import { supabase } from '../lib/supabase'

export type AuditLogEntry = {
  id: string
  actorEmail: string | null
  action: string
  entityType: string
  entityId: string | null
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  createdAt: string
}

export async function recordAuditLog(params: {
  action: string
  entityType: string
  entityId?: string
  oldValue?: Record<string, unknown> | null
  newValue?: Record<string, unknown> | null
}) {
  const { data: session } = await supabase.auth.getSession()
  const user = session.session?.user
  if (!user) return

  const { error } = await supabase.from('admin_audit_log').insert({
    actor_id: user.id,
    actor_email: user.email ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
  })

  if (error?.code === 'PGRST205' || error?.code === '42P01') return
  if (error) throw error
}

export async function fetchAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, actor_email, action, entity_type, entity_id, old_value, new_value, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    actorEmail: (row.actor_email as string | null) ?? null,
    action: row.action as string,
    entityType: row.entity_type as string,
    entityId: (row.entity_id as string | null) ?? null,
    oldValue: (row.old_value as Record<string, unknown> | null) ?? null,
    newValue: (row.new_value as Record<string, unknown> | null) ?? null,
    createdAt: row.created_at as string,
  }))
}
