import type { AcademyMemberRole, AcademySettings, AcademyStatus } from '../domain/academy/models'
import { supabase } from '../lib/supabase'
import { academyRepository } from '../repositories/academyRepository'
import { academyMemberRepository } from '../repositories/academyMemberRepository'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim())
}

async function findProfileByEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  const { data, error } = await supabase.rpc('find_profile_id_by_email', {
    lookup_email: normalized,
  })

  if (error) throw error
  if (!data) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', data as string)
    .maybeSingle()

  if (profileError) throw profileError
  return profile as { id: string; full_name: string | null; role: string | null } | null
}

async function resolveUserId(identifier: string): Promise<string> {
  const trimmed = identifier.trim()
  if (!trimmed) {
    throw new Error('Enter a user ID or email address.')
  }

  if (isUuid(trimmed)) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', trimmed)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('No user found with that ID.')
    return data.id as string
  }

  const profile = await findProfileByEmail(trimmed)
  if (!profile) {
    throw new Error('No user found with that email address.')
  }
  return profile.id
}

export async function updateAcademySettings(
  academyId: string,
  partial: Partial<Pick<AcademySettings, 'timezone' | 'currency' | 'settings'>>,
) {
  return academyRepository.updateSettings(academyId, partial)
}

export async function updateAcademyDetails(
  academyId: string,
  partial: Partial<{
    name: string
    description: string | null
    city: string | null
    state: string | null
  }>,
) {
  return academyRepository.update(academyId, partial)
}

export async function archiveAcademy(academyId: string) {
  return academyRepository.updateStatus(academyId, 'archived')
}

export async function suspendAcademy(academyId: string) {
  return academyRepository.updateStatus(academyId, 'inactive')
}

export async function restoreAcademy(academyId: string) {
  return academyRepository.updateStatus(academyId, 'active')
}

/** Soft delete — archives academy data; members retain read-only history. */
export async function deleteAcademy(academyId: string) {
  return archiveAcademy(academyId)
}

export async function inviteMemberByEmail(input: {
  academyId: string
  emailOrUserId: string
  role: AcademyMemberRole
  invitedBy: string
}) {
  const userId = await resolveUserId(input.emailOrUserId)
  const existing = await academyMemberRepository.findMembership(input.academyId, userId)

  if (existing && existing.status !== 'removed') {
    throw new Error('This user is already a member or has a pending invitation.')
  }

  return academyMemberRepository.inviteMember({
    academyId: input.academyId,
    userId,
    role: input.role,
    invitedBy: input.invitedBy,
  })
}

export async function updateMemberRole(memberId: string, role: AcademyMemberRole) {
  return academyMemberRepository.updateMemberRole(memberId, role)
}

export async function updateMemberStatus(
  memberId: string,
  status: import('../domain/academy/models').AcademyMemberStatus,
) {
  return academyMemberRepository.updateMemberStatus(memberId, status)
}

export async function fetchPendingAcademyInvites(userId: string) {
  const { data, error } = await supabase
    .from('academy_members')
    .select(
      `
      id,
      academy_id,
      role,
      status,
      created_at,
      academy:academies!academy_id(name, city, state)
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'invited')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => {
    const academy = Array.isArray(row.academy) ? row.academy[0] : row.academy
    return {
      memberId: row.id as string,
      academyId: row.academy_id as string,
      academyName: (academy as { name?: string })?.name ?? 'Academy',
      role: row.role as AcademyMemberRole,
      createdAt: row.created_at as string,
    }
  })
}

export async function acceptAcademyInvite(memberId: string, userId: string) {
  const { data: member, error: findError } = await supabase
    .from('academy_members')
    .select('id, user_id, academy_id, role')
    .eq('id', memberId)
    .eq('user_id', userId)
    .eq('status', 'invited')
    .maybeSingle()

  if (findError) throw findError
  if (!member) throw new Error('Invitation not found.')

  await academyMemberRepository.updateMemberStatus(memberId, 'active')

  if (member.role === 'teacher' || member.role === 'assistant_teacher') {
    await academyMemberRepository.linkTeacher({
      academyId: member.academy_id as string,
      teacherId: userId,
    })
  }
}

export async function adminUpdateAcademyStatus(academyId: string, status: AcademyStatus) {
  return academyRepository.updateStatus(academyId, status)
}
