import type { AcademyMemberRole, AcademySettings } from '../domain/academy/models'
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
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, email')
    .eq('email', normalized)
    .maybeSingle()

  if (error) throw error
  return data as { id: string; full_name: string | null; role: string | null; email?: string } | null
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
