/**
 * Academy domain models — Yogstra V2 core entity layer.
 * Maps to tables introduced in supabase/academy-foundation.sql
 */

export type AcademyStatus = 'active' | 'inactive' | 'archived'

export type AcademyMemberRole =
  | 'owner'
  | 'manager'
  | 'teacher'
  | 'assistant_teacher'
  | 'receptionist'
  | 'finance_manager'

export type AcademyMemberStatus = 'active' | 'invited' | 'suspended' | 'removed'

export type TeacherEmploymentType = 'employed' | 'affiliated' | 'visiting'

export type TeacherAcademyStatus = 'active' | 'invited' | 'suspended' | 'removed'

export type BatchStatus = 'draft' | 'active' | 'archived'

export type BatchDifficulty = 'beginner' | 'intermediate' | 'advanced'

export type BatchStudentStatus = 'active' | 'transferred' | 'graduated' | 'removed'

export type BatchEnrollmentType = 'academy' | 'independent'

export interface Academy {
  id: string
  parentAcademyId: string | null
  slug: string
  name: string
  description: string | null
  logoUrl: string | null
  city: string | null
  state: string | null
  status: AcademyStatus
  createdBy: string | null
  createdAt: string
  updatedAt: string
  isBranch: boolean
}

export interface AcademySettings {
  academyId: string
  timezone: string
  currency: string
  settings: Record<string, unknown>
  updatedAt: string
}

export interface AcademyMember {
  id: string
  academyId: string
  userId: string
  role: AcademyMemberRole
  status: AcademyMemberStatus
  invitedBy: string | null
  joinedAt: string | null
  createdAt: string
  updatedAt: string
  userName?: string
  userAvatar?: string | null
}

export interface TeacherAcademy {
  id: string
  academyId: string
  teacherId: string
  employmentType: TeacherEmploymentType
  isPrimary: boolean
  status: TeacherAcademyStatus
  startedAt: string | null
  createdAt: string
  updatedAt: string
  teacherName?: string
  teacherAvatar?: string | null
}

export interface Batch {
  id: string
  academyId: string
  branchId: string | null
  teacherId: string | null
  name: string
  description: string | null
  capacity: number | null
  difficulty: BatchDifficulty | null
  ageGroup: string | null
  language: string
  status: BatchStatus
  createdAt: string
  updatedAt: string
  studentCount?: number
  teacherName?: string | null
}

export interface BatchStudent {
  id: string
  batchId: string
  studentId: string
  enrollmentType: BatchEnrollmentType
  status: BatchStudentStatus
  enrolledAt: string
  createdAt: string
  updatedAt: string
  studentName?: string
  studentAvatar?: string | null
}

export interface CreateAcademyInput {
  name: string
  slug?: string
  description?: string
  city?: string
  state?: string
  parentAcademyId?: string | null
  logoUrl?: string
}

export interface CreateBatchInput {
  academyId: string
  name: string
  teacherId?: string | null
  branchId?: string | null
  description?: string
  capacity?: number
  difficulty?: BatchDifficulty
  ageGroup?: string
  language?: string
  status?: BatchStatus
}

export interface AddAcademyMemberInput {
  academyId: string
  userId: string
  role: AcademyMemberRole
  invitedBy?: string
}

export interface EnrollBatchStudentInput {
  batchId: string
  studentId: string
  enrollmentType?: BatchEnrollmentType
}

/** How a student is associated with the platform today. */
export type StudentAssociation =
  | { type: 'academy_batch'; academyId: string; batchId: string }
  | { type: 'independent_teacher'; teacherId: string }
  | { type: 'unassigned' }
