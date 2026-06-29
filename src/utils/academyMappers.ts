import type {
  Academy,
  AcademyMember,
  AcademySettings,
  Batch,
  BatchStudent,
  TeacherAcademy,
} from '../domain/academy/models'

type Row = Record<string, unknown>

export function mapAcademy(row: Row): Academy {
  return {
    id: row.id as string,
    parentAcademyId: (row.parent_academy_id as string | null) ?? null,
    slug: row.slug as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    logoUrl: (row.logo_url as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    status: row.status as Academy['status'],
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    isBranch: Boolean(row.parent_academy_id),
  }
}

export function mapAcademySettings(row: Row): AcademySettings {
  return {
    academyId: row.academy_id as string,
    timezone: row.timezone as string,
    currency: row.currency as string,
    settings: (row.settings as Record<string, unknown>) ?? {},
    updatedAt: row.updated_at as string,
  }
}

export function mapAcademyMember(row: Row): AcademyMember {
  const profile = row.profile as { full_name?: string; avatar_url?: string | null } | null
  const user = Array.isArray(row.user) ? row.user[0] : row.user
  const profileFromJoin = user as { full_name?: string; avatar_url?: string | null } | undefined

  return {
    id: row.id as string,
    academyId: row.academy_id as string,
    userId: row.user_id as string,
    role: row.role as AcademyMember['role'],
    status: row.status as AcademyMember['status'],
    invitedBy: (row.invited_by as string | null) ?? null,
    joinedAt: (row.joined_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userName: profileFromJoin?.full_name ?? profile?.full_name,
    userAvatar: profileFromJoin?.avatar_url ?? profile?.avatar_url ?? null,
  }
}

export function mapTeacherAcademy(row: Row): TeacherAcademy {
  const teacher = Array.isArray(row.teacher) ? row.teacher[0] : row.teacher

  return {
    id: row.id as string,
    academyId: row.academy_id as string,
    teacherId: row.teacher_id as string,
    employmentType: row.employment_type as TeacherAcademy['employmentType'],
    isPrimary: Boolean(row.is_primary),
    status: row.status as TeacherAcademy['status'],
    startedAt: (row.started_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    teacherName: (teacher as { full_name?: string } | null)?.full_name,
    teacherAvatar: (teacher as { avatar_url?: string | null } | null)?.avatar_url ?? null,
  }
}

export function mapBatch(row: Row): Batch {
  const teacher = Array.isArray(row.teacher) ? row.teacher[0] : row.teacher

  return {
    id: row.id as string,
    academyId: row.academy_id as string,
    branchId: (row.branch_id as string | null) ?? null,
    teacherId: (row.teacher_id as string | null) ?? null,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    capacity: row.capacity === null || row.capacity === undefined ? null : Number(row.capacity),
    difficulty: (row.difficulty as Batch['difficulty']) ?? null,
    ageGroup: (row.age_group as string | null) ?? null,
    language: (row.language as string) ?? 'en',
    status: row.status as Batch['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    studentCount: row.student_count === undefined ? undefined : Number(row.student_count),
    teacherName: (teacher as { full_name?: string } | null)?.full_name ?? null,
  }
}

export function mapBatchStudent(row: Row): BatchStudent {
  const student = Array.isArray(row.student) ? row.student[0] : row.student

  return {
    id: row.id as string,
    batchId: row.batch_id as string,
    studentId: row.student_id as string,
    enrollmentType: row.enrollment_type as BatchStudent['enrollmentType'],
    status: row.status as BatchStudent['status'],
    enrolledAt: row.enrolled_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    studentName: (student as { full_name?: string } | null)?.full_name,
    studentAvatar: (student as { avatar_url?: string | null } | null)?.avatar_url ?? null,
  }
}

export function slugifyAcademyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
