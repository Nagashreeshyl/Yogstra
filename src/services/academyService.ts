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

export async function fetchAllAcademies(limit = 200) {
  return academyRepository.listAll(limit)
}

export async function fetchActiveAcademies(limit = 50) {
  return academyRepository.listActive(limit)
}

export async function fetchAcademyBranches(parentAcademyId: string) {
  return academyRepository.listBranches(parentAcademyId)
}

/** Ensures owner membership and settings exist for academies the user created. */
export async function ensureAcademyBootstrap(academyId: string, userId: string) {
  const academy = await academyRepository.findById(academyId)
  if (!academy || academy.createdBy !== userId) return

  const membership = await academyMemberRepository.findMembership(academyId, userId)
  if (!membership || membership.status !== 'active') {
    try {
      await academyMemberRepository.addMember({
        academyId,
        userId,
        role: 'owner',
      })
    } catch {
      /* membership may already exist from a concurrent request */
    }
  }

  const settings = await academyRepository.getSettings(academyId)
  if (!settings) {
    try {
      await academyRepository.createDefaultSettings(academyId)
    } catch {
      /* settings may already exist */
    }
  }
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

  try {
    await academyMemberRepository.addMember({
      academyId: academy.id,
      userId: createdBy,
      role: 'owner',
    })
  } catch (memberErr) {
    const existing = await academyMemberRepository.findMembership(academy.id, createdBy)
    if (!existing || existing.status !== 'active') throw memberErr
  }

  try {
    await academyRepository.createDefaultSettings(academy.id)
  } catch (settingsErr) {
    const existing = await academyRepository.getSettings(academy.id)
    if (!existing) throw settingsErr
  }

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
