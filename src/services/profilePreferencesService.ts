import { supabase } from '../lib/supabase'
import type { DashboardView } from '../utils/dashboardRoutes'

export type ProfilePreferences = {
  userId: string
  preferredWorkspace: DashboardView | null
  preferredAcademyId: string | null
  updatedAt: string
}

export async function fetchProfilePreferences(userId: string): Promise<ProfilePreferences | null> {
  const { data, error } = await supabase
    .from('profile_preferences')
    .select('user_id, preferred_workspace, preferred_academy_id, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (error.code === '42P01') return null
    throw error
  }
  if (!data) return null

  return {
    userId: data.user_id as string,
    preferredWorkspace: (data.preferred_workspace as DashboardView | null) ?? null,
    preferredAcademyId: (data.preferred_academy_id as string | null) ?? null,
    updatedAt: data.updated_at as string,
  }
}

export async function saveProfilePreferences(
  userId: string,
  partial: {
    preferredWorkspace?: DashboardView | null
    preferredAcademyId?: string | null
  },
): Promise<void> {
  const payload: Record<string, unknown> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  }
  if (partial.preferredWorkspace !== undefined) {
    payload.preferred_workspace = partial.preferredWorkspace
  }
  if (partial.preferredAcademyId !== undefined) {
    payload.preferred_academy_id = partial.preferredAcademyId
  }

  const { error } = await supabase.from('profile_preferences').upsert(payload, {
    onConflict: 'user_id',
  })

  if (error) {
    if (error.code === '42P01') return
    throw error
  }
}
