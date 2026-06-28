import { createClient } from '@supabase/supabase-js'

function trimEnv(value: string | undefined) {
  return value?.trim() ?? ''
}

export function getSupabaseAdmin() {
  const url = trimEnv(process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL)
  const key = trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!url || !key) {
    throw new Error(
      'Supabase service role is not configured. Add SUPABASE_SERVICE_ROLE_KEY to Vercel env vars.',
    )
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function getSupabaseAnon() {
  const url = trimEnv(process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL)
  const key = trimEnv(process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

  if (!url || !key) {
    throw new Error('Supabase anon key is not configured.')
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Supabase client scoped to the signed-in user (RLS applies). */
export function getSupabaseUserClient(accessToken: string) {
  const url = trimEnv(process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL)
  const key = trimEnv(process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

  if (!url || !key) {
    throw new Error('Supabase anon key is not configured.')
  }

  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function assertAdminAccessToken(accessToken: string | undefined) {
  if (!accessToken) {
    throw new Error('Authentication required.')
  }

  const supabase = getSupabaseAnon()
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) {
    throw new Error('Invalid session.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError || profile?.role !== 'admin') {
    throw new Error('Admin access required.')
  }

  return data.user.id
}

export async function assertAuthenticatedUser(accessToken: string | undefined) {
  if (!accessToken) {
    throw new Error('Authentication required.')
  }

  const supabase = getSupabaseAnon()
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) {
    throw new Error('Invalid session.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError || !profile?.role) {
    throw new Error('Profile not found.')
  }

  return {
    userId: data.user.id,
    role: profile.role as 'student' | 'teacher' | 'admin',
  }
}

export async function assertStudentAccessToken(accessToken: string | undefined) {
  const user = await assertAuthenticatedUser(accessToken)
  if (user.role !== 'student') {
    throw new Error('Student access required.')
  }
  return user.userId
}

export async function assertTeacherAccessToken(accessToken: string | undefined) {
  const user = await assertAuthenticatedUser(accessToken)
  if (user.role !== 'teacher' && user.role !== 'admin') {
    throw new Error('Teacher access required.')
  }
  return user.userId
}
