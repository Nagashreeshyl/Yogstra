import type { Competition } from '../domain/competition/models'
import { fetchPublishedCompetitions } from './competitionService'
import { fetchUserRegistrations } from './registrationService'

export type PublicCompetitionFilters = {
  search: string
  state?: string
  country?: string
  registrationOpen?: boolean
  format?: 'online' | 'offline' | ''
  sort: 'nearest' | 'newest' | 'closing_soon' | 'name'
}

export const DEFAULT_PUBLIC_COMPETITION_FILTERS: PublicCompetitionFilters = {
  search: '',
  sort: 'nearest',
}

export type PublicCompetitionItem = Competition & {
  daysUntil: number | null
  registrationOpen: boolean
  isRegistered: boolean
  featured: boolean
}

function daysUntilDate(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  if (Number.isNaN(target.getTime())) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}

function applyFilters(items: PublicCompetitionItem[], filters: PublicCompetitionFilters) {
  let result = items

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.city?.toLowerCase().includes(q) ?? false) ||
        (c.state?.toLowerCase().includes(q) ?? false) ||
        (c.country?.toLowerCase().includes(q) ?? false),
    )
  }

  if (filters.state) {
    result = result.filter((c) => c.state?.toLowerCase() === filters.state!.toLowerCase())
  }

  if (filters.country) {
    result = result.filter((c) => c.country?.toLowerCase() === filters.country!.toLowerCase())
  }

  if (filters.registrationOpen) {
    result = result.filter((c) => c.registrationOpen)
  }

  if (filters.format) {
    result = result.filter((c) => c.format === filters.format)
  }

  switch (filters.sort) {
    case 'newest':
      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      break
    case 'closing_soon':
      result = [...result].sort((a, b) => {
        const aClose = a.registrationDeadline ? new Date(a.registrationDeadline).getTime() : Infinity
        const bClose = b.registrationDeadline ? new Date(b.registrationDeadline).getTime() : Infinity
        return aClose - bClose
      })
      break
    case 'name':
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
      break
    default:
      result = [...result].sort((a, b) => {
        const aStart = a.startDate ? new Date(a.startDate).getTime() : Infinity
        const bStart = b.startDate ? new Date(b.startDate).getTime() : Infinity
        return aStart - bStart
      })
  }

  return result
}

export async function fetchPublicCompetitions(
  filters: PublicCompetitionFilters,
  userId?: string,
  page = 1,
  pageSize = 12,
) {
  const [competitions, registrations] = await Promise.all([
    fetchPublishedCompetitions(200),
    userId ? fetchUserRegistrations(userId) : Promise.resolve([]),
  ])

  const registeredIds = new Set(registrations.map((r) => r.competitionId))

  const enriched: PublicCompetitionItem[] = competitions.map((c, index) => ({
    ...c,
    daysUntil: daysUntilDate(c.startDate),
    registrationOpen: c.status === 'registration_open',
    isRegistered: registeredIds.has(c.id),
    featured: index < 3 && c.status === 'registration_open',
  }))

  const filtered = applyFilters(enriched, filters)
  const featured = filtered.filter((c) => c.featured).slice(0, 3)
  const total = filtered.length
  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return { items, featured, total, page, pageSize, hasMore: start + pageSize < total }
}

export async function fetchPublicCompetitionTeaser(limit = 3) {
  const { items } = await fetchPublicCompetitions(
    { ...DEFAULT_PUBLIC_COMPETITION_FILTERS, sort: 'nearest' },
    undefined,
    1,
    limit,
  )
  return items
}
