import { supabase } from '../lib/supabase'
import type { CreateBatchInput, EnrollBatchStudentInput } from '../domain/academy/models'
import { mapBatch, mapBatchStudent } from '../utils/academyMappers'

const batchSelect = `
  id,
  academy_id,
  branch_id,
  teacher_id,
  name,
  description,
  capacity,
  difficulty,
  age_group,
  language,
  status,
  created_at,
  updated_at,
  teacher:profiles!teacher_id(full_name)
`

export const batchRepository = {
  async findById(id: string) {
    const { data, error } = await supabase
      .from('batches')
      .select(batchSelect)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? mapBatch(data) : null
  },

  async listByAcademy(academyId: string, status?: string) {
    let query = supabase
      .from('batches')
      .select(batchSelect)
      .eq('academy_id', academyId)
      .order('name', { ascending: true })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(mapBatch)
  },

  async create(input: CreateBatchInput) {
    const { data, error } = await supabase
      .from('batches')
      .insert({
        academy_id: input.academyId,
        branch_id: input.branchId ?? null,
        teacher_id: input.teacherId ?? null,
        name: input.name,
        description: input.description ?? null,
        capacity: input.capacity ?? null,
        difficulty: input.difficulty ?? null,
        age_group: input.ageGroup ?? null,
        language: input.language ?? 'en',
        status: input.status ?? 'draft',
      })
      .select(batchSelect)
      .single()

    if (error) throw error
    return mapBatch(data)
  },

  async listStudents(batchId: string) {
    const { data, error } = await supabase
      .from('batch_students')
      .select(`
        id,
        batch_id,
        student_id,
        enrollment_type,
        status,
        enrolled_at,
        created_at,
        updated_at,
        student:profiles!student_id(full_name, avatar_url)
      `)
      .eq('batch_id', batchId)
      .neq('status', 'removed')
      .order('enrolled_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapBatchStudent)
  },

  async enrollStudent(input: EnrollBatchStudentInput) {
    const { data, error } = await supabase
      .from('batch_students')
      .insert({
        batch_id: input.batchId,
        student_id: input.studentId,
        enrollment_type: input.enrollmentType ?? 'academy',
        status: 'active',
      })
      .select(`
        id,
        batch_id,
        student_id,
        enrollment_type,
        status,
        enrolled_at,
        created_at,
        updated_at,
        student:profiles!student_id(full_name, avatar_url)
      `)
      .single()

    if (error) throw error
    return mapBatchStudent(data)
  },

  async listStudentBatches(studentId: string) {
    const { data, error } = await supabase
      .from('batch_students')
      .select(`
        id,
        batch_id,
        student_id,
        enrollment_type,
        status,
        enrolled_at,
        created_at,
        updated_at,
        student:profiles!student_id(full_name, avatar_url),
        batch:batches(id, academy_id, name, status)
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')

    if (error) throw error
    return (data ?? []).map(mapBatchStudent)
  },

  async listStudentsByAcademy(academyId: string) {
    const { data: batches, error: batchError } = await supabase
      .from('batches')
      .select('id, name')
      .eq('academy_id', academyId)

    if (batchError) throw batchError

    const batchIds = (batches ?? []).map((b) => b.id as string)
    if (!batchIds.length) return []

    const { data, error } = await supabase
      .from('batch_students')
      .select(`
        id,
        batch_id,
        student_id,
        enrollment_type,
        status,
        enrolled_at,
        created_at,
        updated_at,
        student:profiles!student_id(full_name, avatar_url)
      `)
      .in('batch_id', batchIds)
      .neq('status', 'removed')
      .order('enrolled_at', { ascending: false })

    if (error) throw error

    const batchNameMap = new Map((batches ?? []).map((b) => [b.id as string, b.name as string]))

    return (data ?? []).map((row) => {
      const student = mapBatchStudent(row)
      return {
        ...student,
        batchName: batchNameMap.get(student.batchId) ?? 'Batch',
      }
    })
  },

  async countActiveStudentsByAcademy(academyId: string): Promise<number> {
    const rows = await this.listStudentsByAcademy(academyId)
    const uniqueStudents = new Set(rows.filter((r) => r.status === 'active').map((r) => r.studentId))
    return uniqueStudents.size
  },
}
