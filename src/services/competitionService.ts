import type { CreateCompetitionInput } from '../domain/competition/models'
import { supabase } from '../lib/supabase'
import { competitionRepository } from '../repositories/competitionRepository'
import { slugifyCompetitionName } from '../utils/competitionMappers'

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug || 'competition'
  let suffix = 0

  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`
    const taken = await competitionRepository.slugTaken(candidate)
    if (!taken) return candidate
    suffix += 1
  }
}

export async function fetchCompetitionById(id: string) {
  return competitionRepository.findById(id)
}

export async function fetchCompetitionBySlug(slug: string) {
  return competitionRepository.findBySlug(slug)
}

export async function fetchPublishedCompetitions(limit = 50) {
  return competitionRepository.listPublished(limit)
}

export async function fetchOrganizerCompetitions(userId: string) {
  return competitionRepository.listForOrganizer(userId)
}

export async function fetchAllCompetitions(limit = 200) {
  return competitionRepository.listAll(limit)
}

export async function fetchCompetitionEvents(competitionId: string) {
  return competitionRepository.listEvents(competitionId)
}

export async function fetchCompetitionCategories(competitionId: string) {
  return competitionRepository.listCategories(competitionId)
}

export async function fetchCompetitionAnnouncements(competitionId: string) {
  return competitionRepository.listAnnouncements(competitionId)
}

/** Creates a competition in draft status with a unique slug. */
export async function createCompetition(input: CreateCompetitionInput, _createdBy?: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const creatorId = user.id

  const baseSlug = slugifyCompetitionName(input.slug ?? input.name)
  const slug = await ensureUniqueSlug(baseSlug)

  return competitionRepository.create({
    ...input,
    slug,
    createdBy: creatorId,
    organizerId: input.organizerId ?? creatorId,
  })
}

export async function fetchCompetitionSummary(competitionId: string) {
  const [competition, categories, events, announcements] = await Promise.all([
    competitionRepository.findById(competitionId),
    competitionRepository.listCategories(competitionId),
    competitionRepository.listEvents(competitionId),
    competitionRepository.listAnnouncements(competitionId),
  ])

  if (!competition) return null

  return {
    competition,
    categories,
    events,
    announcements,
    categoryCount: categories.length,
    eventCount: events.length,
  }
}
