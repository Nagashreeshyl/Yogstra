import type { Academy, AcademySettings, Batch } from '../domain/academy/models'
import { fetchAcademyById } from './academyService'
import { fetchAcademyMembers, fetchAcademyTeachers } from './academyMemberService'
import { fetchAcademyBatches } from './batchService'
import { academyRepository } from '../repositories/academyRepository'
import { batchRepository } from '../repositories/batchRepository'

export type AcademyDashboardData = {
  academy: Academy
  memberCount: number
  teacherCount: number
  studentCount: number
  batchCount: number
  recentBatches: Batch[]
  settings: AcademySettings | null
}

export async function fetchAcademyDashboard(academyId: string): Promise<AcademyDashboardData> {
  const [academy, members, teachers, batches, settings, studentCount] = await Promise.all([
    fetchAcademyById(academyId),
    fetchAcademyMembers(academyId),
    fetchAcademyTeachers(academyId),
    fetchAcademyBatches(academyId),
    academyRepository.getSettings(academyId),
    batchRepository.countActiveStudentsByAcademy(academyId),
  ])

  if (!academy) {
    throw new Error('Academy not found')
  }

  const activeMembers = members.filter((m) => m.status === 'active')
  const activeTeachers = teachers.filter((t) => t.status === 'active')
  const recentBatches = [...batches]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  return {
    academy,
    memberCount: activeMembers.length,
    teacherCount: activeTeachers.length,
    studentCount,
    batchCount: batches.length,
    recentBatches,
    settings,
  }
}
