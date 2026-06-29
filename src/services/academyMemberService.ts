import type { AddAcademyMemberInput } from '../domain/academy/models'
import { academyMemberRepository } from '../repositories/academyMemberRepository'

export async function fetchAcademyMembers(academyId: string) {
  return academyMemberRepository.listByAcademy(academyId)
}

export async function fetchAcademyTeachers(academyId: string) {
  return academyMemberRepository.listTeachersByAcademy(academyId)
}

export async function fetchAcademyMembership(academyId: string, userId: string) {
  return academyMemberRepository.findMembership(academyId, userId)
}

export async function addAcademyMember(input: AddAcademyMemberInput) {
  return academyMemberRepository.addMember(input)
}

export async function linkTeacherToAcademy(input: {
  academyId: string
  teacherId: string
  employmentType?: 'employed' | 'affiliated' | 'visiting'
  isPrimary?: boolean
}) {
  const membership = await academyMemberRepository.findMembership(input.academyId, input.teacherId)

  if (!membership) {
    await academyMemberRepository.addMember({
      academyId: input.academyId,
      userId: input.teacherId,
      role: 'teacher',
      invitedBy: input.teacherId,
    })
  }

  return academyMemberRepository.linkTeacher(input)
}

export async function getUserAcademyRole(academyId: string, userId: string) {
  return academyMemberRepository.getUserAcademyRoles(userId, academyId)
}

export async function isUserAcademyTeacher(academyId: string, userId: string) {
  const teachers = await academyMemberRepository.listTeachersByAcademy(academyId)
  return teachers.some((row) => row.teacherId === userId && row.status === 'active')
}
