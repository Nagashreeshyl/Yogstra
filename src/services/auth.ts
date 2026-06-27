import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { TeacherRegistrationData } from '../types'
import { parseIndianNumber } from '../utils/format'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'student' | 'teacher' | 'admin'
  avatar?: string
  teacherStatus?: 'pending' | 'verified' | 'rejected' | 'removed' | null
}

export type SignUpResult =
  | { status: 'authenticated'; profile: AuthUser }
  | { status: 'email_confirmation_required' }

const PENDING_TEACHER_KEY = 'yogstra_pending_teacher'

function metaString(user: User, key: string): string {
  const value = user.user_metadata?.[key]
  return typeof value === 'string' ? value : ''
}

function metaNumber(user: User, key: string): number {
  const value = user.user_metadata?.[key]
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseIndianNumber(value)
  return 0
}

function metaStringArray(user: User, key: string): string[] {
  const value = user.user_metadata?.[key]
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

function loadPendingTeacher(email: string): TeacherRegistrationData | null {
  try {
    const raw = localStorage.getItem(`${PENDING_TEACHER_KEY}:${email.toLowerCase()}`)
    return raw ? (JSON.parse(raw) as TeacherRegistrationData) : null
  } catch {
    return null
  }
}

function savePendingTeacher(form: TeacherRegistrationData) {
  localStorage.setItem(
    `${PENDING_TEACHER_KEY}:${form.email.toLowerCase()}`,
    JSON.stringify(form),
  )
}

function clearPendingTeacher(email: string) {
  localStorage.removeItem(`${PENDING_TEACHER_KEY}:${email.toLowerCase()}`)
}

export async function fetchProfile(userId: string, emailFallback = ''): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, teacher_profiles(status)')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null

  const { data: { user } } = await supabase.auth.getUser()
  const tp = data.teacher_profiles
  const teacherProfile = Array.isArray(tp) ? tp[0] : tp
  const role = data.role as AuthUser['role']

  return {
    id: data.id,
    name: data.full_name ?? '',
    email: user?.email ?? emailFallback,
    role,
    avatar: data.avatar_url ?? undefined,
    teacherStatus: role === 'teacher' ? (teacherProfile?.status ?? 'pending') : null,
  }
}

async function insertTeacherProfile(userId: string, data: {
  bio: string
  experienceYears: string
  monthlyFee: number
  certifications: string
  specializations: string[]
}) {
  const { error } = await supabase.from('teacher_profiles').insert({
    id: userId,
    bio: data.bio,
    experience_years: data.experienceYears,
    monthly_fee: data.monthlyFee,
    certifications: data.certifications,
    specializations: data.specializations,
    status: 'pending',
  })
  if (error && error.code !== '23505') throw error
}

/** Create profile rows on first login when email confirmation blocked signup writes */
export async function ensureProfile(user: User): Promise<AuthUser | null> {
  const email = user.email ?? ''
  const existing = await fetchProfile(user.id, email)
  if (existing) return existing

  const role = metaString(user, 'role') || 'student'
  const fullName =
    metaString(user, 'full_name') || email.split('@')[0] || 'Yogstra User'

  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    role,
    full_name: fullName,
    phone: metaString(user, 'phone'),
    city: metaString(user, 'city'),
    state: metaString(user, 'state'),
  })

  if (profileError) {
    if (profileError.code === '23505') {
      return fetchProfile(user.id, email)
    }
    throw profileError
  }

  if (role === 'teacher') {
    const pending = loadPendingTeacher(email)
    await insertTeacherProfile(user.id, {
      bio: pending?.bio ?? metaString(user, 'bio'),
      experienceYears: pending?.experienceYears ?? metaString(user, 'experience_years'),
      monthlyFee: pending
        ? parseIndianNumber(pending.monthlyFee)
        : metaNumber(user, 'monthly_fee'),
      certifications: pending?.certifications ?? metaString(user, 'certifications'),
      specializations: pending?.specializations.length
        ? pending.specializations
        : metaStringArray(user, 'specializations'),
    })
    clearPendingTeacher(email)
  }

  return fetchProfile(user.id, email)
}

async function upsertStudentProfile(userId: string, fullName: string, phone: string) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    role: 'student',
    full_name: fullName,
    phone,
  })
  if (error) throw error
}

async function upsertTeacherProfile(userId: string, form: TeacherRegistrationData) {
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    role: 'teacher',
    full_name: form.fullName,
    phone: form.phone,
    city: form.city,
    state: form.state,
  })
  if (profileError) throw profileError

  const { error: teacherError } = await supabase.from('teacher_profiles').upsert({
    id: userId,
    bio: form.bio,
    experience_years: form.experienceYears,
    monthly_fee: parseIndianNumber(form.monthlyFee),
    certifications: form.certifications,
    specializations: form.specializations,
    status: 'pending',
  })
  if (teacherError) throw teacherError
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.user) throw new Error('Login failed')

  const profile = await ensureProfile(data.user)
  if (!profile) {
    throw new Error('Could not load your profile. Please try again.')
  }

  return profile
}

export async function signUpStudent(params: {
  fullName: string
  email: string
  phone: string
  password: string
}): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName,
        phone: params.phone,
        role: 'student',
      },
    },
  })
  if (error) throw error
  if (!data.user) throw new Error('Sign up failed')

  if (!data.session) {
    return { status: 'email_confirmation_required' }
  }

  await upsertStudentProfile(data.user.id, params.fullName, params.phone)

  const profile = await fetchProfile(data.user.id, params.email)
  if (!profile) throw new Error('Account created but profile setup failed. Try logging in.')

  return { status: 'authenticated', profile }
}

export async function signUpTeacher(form: TeacherRegistrationData): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
    options: {
      data: {
        role: 'teacher',
        full_name: form.fullName,
        phone: form.phone,
        city: form.city,
        state: form.state,
        bio: form.bio,
        experience_years: form.experienceYears,
        monthly_fee: parseIndianNumber(form.monthlyFee),
        certifications: form.certifications,
        specializations: form.specializations,
      },
    },
  })
  if (error) throw error
  if (!data.user) throw new Error('Registration failed')

  if (!data.session) {
    savePendingTeacher(form)
    return { status: 'email_confirmation_required' }
  }

  await upsertTeacherProfile(data.user.id, form)
  clearPendingTeacher(form.email)

  const profile = await fetchProfile(data.user.id, form.email)
  if (!profile) throw new Error('Registration failed to create profile. Try logging in after confirming email.')

  return { status: 'authenticated', profile }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null
  return ensureProfile(session.user)
}
