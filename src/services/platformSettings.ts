import { supabase } from '../lib/supabase'

export async function fetchCommissionPercent(): Promise<number> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('commission_percent')
    .eq('id', 'default')
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return 10
    throw error
  }

  const value = Number(data?.commission_percent ?? 10)
  return Number.isFinite(value) ? value : 10
}

export async function updateCommissionPercent(percent: number) {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error('Commission must be between 0 and 100.')
  }

  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user.id

  const { error } = await supabase
    .from('platform_settings')
    .update({
      commission_percent: percent,
      updated_at: new Date().toISOString(),
      updated_by: userId ?? null,
    })
    .eq('id', 'default')

  if (error) throw error
}
