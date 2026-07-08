import { supabase } from '../lib/supabase'

export interface StudentCoachAcademy {
  academyId: string
  academyName: string
  academyCity: string | null
  academyState: string | null
  coachId: string
  coachName: string
  isEnrolled: boolean
}

export interface JoinableAcademyBatch {
  id: string
  name: string
  difficulty: string | null
  capacity: number | null
}

export async function fetchStudentCoachAcademies(): Promise<StudentCoachAcademy[]> {
  const { data, error } = await supabase.rpc('list_student_coach_academies')
  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => ({
    academyId: row.academy_id as string,
    academyName: row.academy_name as string,
    academyCity: (row.academy_city as string | null) ?? null,
    academyState: (row.academy_state as string | null) ?? null,
    coachId: row.coach_id as string,
    coachName: (row.coach_name as string | null) ?? 'Coach',
    isEnrolled: Boolean(row.is_enrolled),
  }))
}

export async function fetchJoinableAcademyBatches(
  academyId: string,
): Promise<JoinableAcademyBatch[]> {
  const { data, error } = await supabase.rpc('list_student_joinable_batches', {
    p_academy_id: academyId,
  })
  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    difficulty: (row.difficulty as string | null) ?? null,
    capacity: row.capacity == null ? null : Number(row.capacity),
  }))
}

export async function joinStudentAcademyBatch(batchId: string): Promise<void> {
  const { error } = await supabase.rpc('join_student_academy_batch', {
    p_batch_id: batchId,
  })
  if (error) throw error
}
