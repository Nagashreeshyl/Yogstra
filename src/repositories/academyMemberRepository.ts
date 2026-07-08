import { supabase } from '../lib/supabase'
import type { AddAcademyMemberInput, AcademyMemberRole, AcademyMemberStatus } from '../domain/academy/models'
import { mapAcademyMember, mapTeacherAcademy } from '../utils/academyMappers'

const memberSelect = `
  id,
  academy_id,
  user_id,
  role,
  status,
  invited_by,
  joined_at,
  created_at,
  updated_at,
  user:profiles!user_id(full_name, avatar_url)
`

export const academyMemberRepository = {
  async listByAcademy(academyId: string) {
    const { data, error } = await supabase
      .from('academy_members')
      .select(memberSelect)
      .eq('academy_id', academyId)
      .neq('status', 'removed')
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapAcademyMember)
  },

  async findMembership(academyId: string, userId: string) {
    const { data, error } = await supabase
      .from('academy_members')
      .select(memberSelect)
      .eq('academy_id', academyId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data ? mapAcademyMember(data) : null
  },

  async addMember(input: AddAcademyMemberInput) {
    const { data, error } = await supabase
      .from('academy_members')
      .insert({
        academy_id: input.academyId,
        user_id: input.userId,
        role: input.role,
        invited_by: input.invitedBy ?? null,
        joined_at: input.role === 'owner' ? new Date().toISOString() : null,
        status: 'active',
      })
      .select(memberSelect)
      .single()

    if (error) throw error
    return mapAcademyMember(data)
  },

  async listTeachersByAcademy(academyId: string) {
    const { data, error } = await supabase
      .from('teacher_academies')
      .select(`
        id,
        academy_id,
        teacher_id,
        employment_type,
        is_primary,
        status,
        started_at,
        created_at,
        updated_at,
        teacher:profiles!teacher_id(full_name, avatar_url)
      `)
      .eq('academy_id', academyId)
      .neq('status', 'removed')
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapTeacherAcademy)
  },

  async linkTeacher(input: {
    academyId: string
    teacherId: string
    employmentType?: 'employed' | 'affiliated' | 'visiting'
    isPrimary?: boolean
  }) {
    const teacherSelect = `
      id,
      academy_id,
      teacher_id,
      employment_type,
      is_primary,
      status,
      started_at,
      created_at,
      updated_at,
      teacher:profiles!teacher_id(full_name, avatar_url)
    `

    const { data: existing, error: findError } = await supabase
      .from('teacher_academies')
      .select(teacherSelect)
      .eq('academy_id', input.academyId)
      .eq('teacher_id', input.teacherId)
      .maybeSingle()

    if (findError) throw findError

    if (existing) {
      if (existing.status === 'removed') {
        const { data, error } = await supabase
          .from('teacher_academies')
          .update({
            status: 'active',
            employment_type: input.employmentType ?? existing.employment_type,
            is_primary: input.isPrimary ?? existing.is_primary,
            started_at: existing.started_at ?? new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select(teacherSelect)
          .single()

        if (error) throw error
        return mapTeacherAcademy(data)
      }

      return mapTeacherAcademy(existing)
    }

    const { data, error } = await supabase
      .from('teacher_academies')
      .insert({
        academy_id: input.academyId,
        teacher_id: input.teacherId,
        employment_type: input.employmentType ?? 'affiliated',
        is_primary: input.isPrimary ?? false,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select(teacherSelect)
      .single()

    if (error) throw error
    return mapTeacherAcademy(data)
  },

  async getUserAcademyRoles(userId: string, academyId: string): Promise<AcademyMemberRole | null> {
    const membership = await this.findMembership(academyId, userId)
    if (membership?.status === 'active') return membership.role
    return null
  },

  async inviteMember(input: AddAcademyMemberInput & { invitedBy: string }) {
    const { data, error } = await supabase
      .from('academy_members')
      .insert({
        academy_id: input.academyId,
        user_id: input.userId,
        role: input.role,
        invited_by: input.invitedBy,
        status: 'invited',
        joined_at: null,
      })
      .select(memberSelect)
      .single()

    if (error) throw error
    return mapAcademyMember(data)
  },

  async updateMemberRole(memberId: string, role: AcademyMemberRole) {
    const { data, error } = await supabase
      .from('academy_members')
      .update({ role })
      .eq('id', memberId)
      .select(memberSelect)
      .single()

    if (error) throw error
    return mapAcademyMember(data)
  },

  async updateMemberStatus(memberId: string, status: AcademyMemberStatus) {
    const updates: Record<string, unknown> = { status }
    if (status === 'active') {
      updates.joined_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('academy_members')
      .update(updates)
      .eq('id', memberId)
      .select(memberSelect)
      .single()

    if (error) throw error
    return mapAcademyMember(data)
  },
}
