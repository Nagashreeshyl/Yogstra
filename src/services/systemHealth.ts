import { supabase } from '../lib/supabase'

export type HealthCheck = {
  name: string
  status: 'ok' | 'degraded' | 'error' | 'unknown'
  latencyMs?: number
  message?: string
}

export type SystemHealth = {
  checks: HealthCheck[]
  serverTime: string
  version: string
  pendingNotifications: number
  recentErrorCount: number
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const checks: HealthCheck[] = []
  const serverTime = new Date().toISOString()
  const version =
    (import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA as string | undefined)?.slice(0, 7) ??
    import.meta.env.MODE ??
    'dev'

  // Database
  const dbStart = performance.now()
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    checks.push({
      name: 'Database',
      status: error ? 'error' : 'ok',
      latencyMs: Math.round(performance.now() - dbStart),
      message: error?.message,
    })
  } catch (err) {
    checks.push({
      name: 'Database',
      status: 'error',
      latencyMs: Math.round(performance.now() - dbStart),
      message: err instanceof Error ? err.message : 'Connection failed',
    })
  }

  // Auth
  const authStart = performance.now()
  try {
    const { error } = await supabase.auth.getSession()
    checks.push({
      name: 'Authentication',
      status: error ? 'degraded' : 'ok',
      latencyMs: Math.round(performance.now() - authStart),
      message: error?.message,
    })
  } catch {
    checks.push({ name: 'Authentication', status: 'error', latencyMs: Math.round(performance.now() - authStart) })
  }

  // Realtime
  checks.push({
    name: 'Realtime',
    status: supabase.realtime.isConnected() ? 'ok' : 'degraded',
    message: supabase.realtime.isConnected() ? 'Connected' : 'Not connected (may connect on subscribe)',
  })

  // Storage
  const storageStart = performance.now()
  try {
    const { error } = await supabase.storage.from('avatars').list('', { limit: 1 })
    checks.push({
      name: 'Storage',
      status: error && !error.message.includes('not found') ? 'degraded' : 'ok',
      latencyMs: Math.round(performance.now() - storageStart),
      message: error?.message,
    })
  } catch {
    checks.push({ name: 'Storage', status: 'unknown', latencyMs: Math.round(performance.now() - storageStart) })
  }

  // Payments (env configured)
  const razorpayConfigured = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID)
  checks.push({
    name: 'Payments (Razorpay)',
    status: razorpayConfigured ? 'ok' : 'error',
    message: razorpayConfigured ? 'Client key configured' : 'VITE_RAZORPAY_KEY_ID missing',
  })

  let pendingNotifications = 0
  let recentErrorCount = 0

  try {
    const { count: notifCount } = await supabase
      .from('enrollment_notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)
    pendingNotifications = notifCount ?? 0
  } catch {
    // table may not exist yet
  }

  try {
    const { count: errCount } = await supabase
      .from('platform_activity_log')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'error')
      .gte('created_at', new Date(Date.now() - 86400000).toISOString())
    recentErrorCount = errCount ?? 0
  } catch {
    // migration pending
  }

  return { checks, serverTime, version, pendingNotifications, recentErrorCount }
}
