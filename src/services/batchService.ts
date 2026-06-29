import type { CreateBatchInput, EnrollBatchStudentInput } from '../domain/academy/models'
import { batchRepository } from '../repositories/batchRepository'

export async function fetchBatchById(id: string) {
  return batchRepository.findById(id)
}

export async function fetchAcademyBatches(academyId: string, status?: string) {
  return batchRepository.listByAcademy(academyId, status)
}

export async function createBatch(input: CreateBatchInput) {
  return batchRepository.create(input)
}

export async function fetchBatchStudents(batchId: string) {
  return batchRepository.listStudents(batchId)
}

export async function enrollStudentInBatch(input: EnrollBatchStudentInput) {
  return batchRepository.enrollStudent(input)
}

export async function fetchStudentBatchMemberships(studentId: string) {
  return batchRepository.listStudentBatches(studentId)
}
