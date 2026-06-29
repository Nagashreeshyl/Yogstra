import type { CreateAcademyInput, StudentAssociation } from '../domain/academy/models'
import { academyRepository } from '../repositories/academyRepository'
import { academyMemberRepository } from '../repositories/academyMemberRepository'
import { batchRepository } from '../repositories/batchRepository'
import { slugifyAcademyName } from '../utils/academyMappers'

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug || 'academy'
  let suffix = 0

  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`
    const existing = await academyRepository.findBySlug(candidate)
    if (!existing) return candidate
    suffix += 1
  }
}

export async function fetchAcademyById(id: string) {
  return academyRepository.findById(id)
}

export async function fetchAcademyBySlug(slug: string) {
  return academyRepository.findBySlug(slug)
}

export async function fetchAcademiesForUser(userId: string) {
  return academyRepository.listForUser(userId)
}

export async function fetchActiveAcademies(limit = 50) {
  return academyRepository.listActive(limit)
}

export async function fetchAcademyBranches(parentAcademyId: string) {
  return academyRepository.listBranches(parentAcademyId)
}

/** Creates an academy and bootstraps owner membership + default settings. */
export async function createAcademy(input: CreateAcademyInput, createdBy: string) {
  const baseSlug = slugifyAcademyName(input.slug ?? input.name)
  const slug = await ensureUniqueSlug(baseSlug)

  const academy = await academyRepository.create({
    ...input,
    slug,
    createdBy,
  })

  await academyRepository.createDefaultSettings(academy.id)

  await academyMemberRepository.addMember({
    academyId: academy.id,
    userId: createdBy,
    role: 'owner',
  })

  if (input.parentAcademyId) {
    return academy
  }

  return academy
}

export async function fetchStudentAcademyAssociation(studentId: string): Promise<StudentAssociation> {
  const batchMemberships = await batchRepository.listStudentBatches(studentId)

  const active = batchMemberships.find((row) => row.status === 'active')
  if (!active) {
    return { type: 'unassigned' }
  }

  const batch = await batchRepository.findById(active.batchId)
  if (!batch) {
    return { type: 'unassigned' }
  }

  return {
    type: 'academy_batch',
    academyId: batch.academyId,
    batchId: batch.id,
  }
}
