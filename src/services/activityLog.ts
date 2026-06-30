import { supabase } from '../lib/supabase'

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'enrollment'
  | 'payment'
  | 'payment_failed'
  | 'academy_create'
  | 'competition_create'
  | 'competition_publish'
  | 'judge_score'
  | 'certificate_generate'
  | 'admin_action'
  | 'upload'
  | 'realtime_disconnect'
  | 'error'

export type LogActivityInput = {
  action: ActivityAction
  entityType?: string
  entityId?: string
  status?: 'success' | 'error' | 'info'
  errorMessage?: string
  metadata?: Record<string, unknown>
  userId?: string | null
  role?: string | null
}

/** Best-effort client activity logging — never throws to callers. */
export async function logActivity(input: LogActivityInput) {
  try {
    const { data: session } = await supabase.auth.getSession()
    const userId = input.userId ?? session.session?.user.id ?? null

    let role = input.role ?? null
    if (!role && userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      role = (profile?.role as string | undefined) ?? null
    }

    const { error } = await supabase.from('platform_activity_log').insert({
      user_id: userId,
      role,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      status: input.status ?? 'success',
      error_message: input.errorMessage?.slice(0, 500) ?? null,
      metadata: input.metadata ?? {},
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
    })

    if (error?.code === 'PGRST205' || error?.code === '42P01') return
  } catch {
    // Silent — logging must not break user flows
  }
}

export type ActivityLogRow = {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  status: string
  errorMessage: string | null
  role: string | null
  createdAt: string
}

export async function fetchRecentActivityLogs(limit = 50): Promise<ActivityLogRow[]> {
  const { data, error } = await supabase
    .from('platform_activity_log')
    .select('id, action, entity_type, entity_id, status, error_message, role, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    action: row.action as string,
    entityType: (row.entity_type as string | null) ?? null,
    entityId: (row.entity_id as string | null) ?? null,
    status: row.status as string,
    errorMessage: (row.error_message as string | null) ?? null,
    role: (row.role as string | null) ?? null,
    createdAt: row.created_at as string,
  }))
}

export async function fetchRecentErrors(limit = 20): Promise<ActivityLogRow[]> {
  const { data, error } = await supabase
    .from('platform_activity_log')
    .select('id, action, entity_type, entity_id, status, error_message, role, created_at')
    .eq('status', 'error')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    action: row.action as string,
    entityType: (row.entity_type as string | null) ?? null,
    entityId: (row.entity_id as string | null) ?? null,
    status: row.status as string,
    errorMessage: (row.error_message as string | null) ?? null,
    role: (row.role as string | null) ?? null,
    createdAt: row.created_at as string,
  }))
}
