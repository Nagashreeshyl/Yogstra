import { supabase } from '../lib/supabase'
import { fetchPosts } from './posts'
import { fetchStudentCount } from './students'
import type { CommunityPost, Teacher } from '../types'
import type { Academy } from '../domain/academy/models'
import type { Competition, CompetitionCategory } from '../domain/competition/models'
import { mapTeacher } from '../utils/mappers'
import { mapCompetition, mapCompetitionCategory } from '../utils/competitionMappers'
import { mapAcademy } from '../utils/academyMappers'
import { isTeacherProfileComplete } from '../utils/teacherProfileCompletion'
import type { ProfileWithTeacher } from '../types/database'

const teacherSelect = `
  *,
  teacher_profiles!inner (*)
`

const academySelect = `
  id,
  parent_academy_id,
  slug,
  name,
  description,
  logo_url,
  city,
  state,
  status,
  created_by,
  created_at,
  updated_at
`

const competitionSelect = `
  id,
  slug,
  name,
  description,
  organizer_id,
  academy_id,
  venue,
  city,
  state,
  country,
  start_date,
  end_date,
  registration_deadline,
  entry_fee,
  format,
  scope,
  status,
  max_participants,
  rules,
  settings,
  created_by,
  created_at,
  updated_at,
  organizer:profiles!organizer_id(full_name),
  academy:academies!academy_id(name)
`

export type LandingStats = {
  students: number
  verifiedCoaches: number
  academies: number
  competitions: number
}

export type LandingCoach = {
  id: string
  name: string
  photo: string
  academyName: string | null
  city: string
  state: string
  specializations: string[]
  rating: number
  totalStudents: number
  programsAvailable: number
  teacher: Teacher
}

export type LandingAcademy = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  city: string | null
  state: string | null
  programCount: number
  teacherCount: number
  studentCount: number
}

export type LandingCompetition = Competition & {
  registrationOpen: boolean
  daysUntil: number | null
  categories: CompetitionCategory[]
  bannerUrl: string | null
}

export type LandingPageData = {
  stats: LandingStats
  coaches: LandingCoach[]
  academies: LandingAcademy[]
  competitions: LandingCompetition[]
  communityPosts: CommunityPost[]
}

const LANDING_COACH_LIMIT = 6
const LANDING_ACADEMY_LIMIT = 6
const LANDING_COMPETITION_LIMIT = 4
const LANDING_POST_LIMIT = 6

const OPEN_COMPETITION_STATUSES = [
  'published',
  'registration_open',
] as const

function countTeacherPrograms(teacher: Teacher): number {
  let count = 0
  if (teacher.pricing.oneOnOneMonth > 0 || teacher.pricing.oneOnOneWeek > 0) count += 1
  if (teacher.pricing.groupMonth > 0 || teacher.pricing.groupWeek > 0) count += 1
  if (teacher.achievements.some((a) => a.toLowerCase().includes('competition'))) count += 1
  return count || (teacher.monthlyFee > 0 ? 1 : 0)
}

function sortFeaturedCoaches(teachers: Teacher[]): Teacher[] {
  return [...teachers].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating
    if (b.totalStudents !== a.totalStudents) return b.totalStudents - a.totalStudents
    return new Date(b.registeredDate).getTime() - new Date(a.registeredDate).getTime()
  })
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

function isUpcomingCompetition(competition: Competition): boolean {
  if (competition.status === 'registration_open') return true
  if (competition.status !== 'published') return false
  const days = daysUntilDate(competition.startDate)
  return days === null || days >= 0
}

function countByKey<T extends string>(rows: { key: T }[]): Map<T, number> {
  const map = new Map<T, number>()
  for (const row of rows) {
    map.set(row.key, (map.get(row.key) ?? 0) + 1)
  }
  return map
}

async function fetchLandingStats(): Promise<LandingStats> {
  const [students, verifiedCoaches, academies, competitions] = await Promise.all([
    fetchStudentCount(),
    supabase
      .from('teacher_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified'),
    supabase
      .from('academies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('parent_academy_id', null),
    supabase
      .from('competitions')
      .select('*', { count: 'exact', head: true })
      .in('status', [...OPEN_COMPETITION_STATUSES]),
  ])

  if (verifiedCoaches.error) throw verifiedCoaches.error
  if (academies.error) throw academies.error
  if (competitions.error) throw competitions.error

  return {
    students,
    verifiedCoaches: verifiedCoaches.count ?? 0,
    academies: academies.count ?? 0,
    competitions: competitions.count ?? 0,
  }
}

async function fetchLandingCoaches(limit = LANDING_COACH_LIMIT): Promise<LandingCoach[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(teacherSelect)
    .eq('role', 'teacher')
    .eq('teacher_profiles.status', 'verified')
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) throw error

  const teachers = (data ?? [])
    .map((row) => mapTeacher(row as ProfileWithTeacher))
    .filter((t) => t.verified && isTeacherProfileComplete(t))

  const featured = sortFeaturedCoaches(teachers).slice(0, limit)
  if (featured.length === 0) return []

  const teacherIds = featured.map((t) => t.id)
  const { data: academyLinks, error: academyError } = await supabase
    .from('teacher_academies')
    .select('teacher_id, is_primary, academies(name)')
    .in('teacher_id', teacherIds)
    .eq('status', 'active')

  if (academyError) throw academyError

  const academyByTeacher = new Map<string, string>()
  for (const link of academyLinks ?? []) {
    const academy = Array.isArray(link.academies) ? link.academies[0] : link.academies
    const name = academy?.name as string | undefined
    if (!name) continue
    if (link.is_primary || !academyByTeacher.has(link.teacher_id)) {
      academyByTeacher.set(link.teacher_id, name)
    }
  }

  return featured.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    photo: teacher.photo,
    academyName: academyByTeacher.get(teacher.id) ?? null,
    city: teacher.city,
    state: teacher.state,
    specializations: teacher.specializations,
    rating: teacher.rating,
    totalStudents: teacher.totalStudents,
    programsAvailable: countTeacherPrograms(teacher),
    teacher,
  }))
}

async function fetchLandingAcademies(limit = LANDING_ACADEMY_LIMIT): Promise<LandingAcademy[]> {
  const { data, error } = await supabase
    .from('academies')
    .select(academySelect)
    .eq('status', 'active')
    .is('parent_academy_id', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const academies = (data ?? []).map(mapAcademy)
  if (academies.length === 0) return []

  const ids = academies.map((a) => a.id)

  const [batchResult, teacherResult] = await Promise.all([
    supabase.from('batches').select('id, academy_id').in('academy_id', ids).eq('status', 'active'),
    supabase.from('teacher_academies').select('academy_id').in('academy_id', ids).eq('status', 'active'),
  ])

  if (batchResult.error) throw batchResult.error
  if (teacherResult.error) throw teacherResult.error

  const batches = batchResult.data ?? []
  const batchIds = batches.map((b) => b.id)

  let studentRows: { batch_id: string }[] = []
  if (batchIds.length > 0) {
    const { data: students, error: studentError } = await supabase
      .from('batch_students')
      .select('batch_id')
      .in('batch_id', batchIds)
      .eq('status', 'active')

    if (studentError) throw studentError
    studentRows = students ?? []
  }

  const batchToAcademy = new Map(batches.map((b) => [b.id, b.academy_id as string]))
  const programCounts = countByKey(batches.map((b) => ({ key: b.academy_id as string })))
  const teacherCounts = countByKey(teacherResult.data?.map((t) => ({ key: t.academy_id as string })) ?? [])

  const studentCounts = new Map<string, number>()
  for (const row of studentRows) {
    const academyId = batchToAcademy.get(row.batch_id)
    if (!academyId) continue
    studentCounts.set(academyId, (studentCounts.get(academyId) ?? 0) + 1)
  }

  return academies.map((academy: Academy) => ({
    id: academy.id,
    slug: academy.slug,
    name: academy.name,
    logoUrl: academy.logoUrl,
    city: academy.city,
    state: academy.state,
    programCount: programCounts.get(academy.id) ?? 0,
    teacherCount: teacherCounts.get(academy.id) ?? 0,
    studentCount: studentCounts.get(academy.id) ?? 0,
  }))
}

async function fetchLandingCompetitions(limit = LANDING_COMPETITION_LIMIT): Promise<LandingCompetition[]> {
  const { data, error } = await supabase
    .from('competitions')
    .select(competitionSelect)
    .in('status', [...OPEN_COMPETITION_STATUSES])
    .order('start_date', { ascending: true, nullsFirst: false })
    .limit(30)

  if (error) throw error

  const competitions = (data ?? [])
    .map(mapCompetition)
    .filter(isUpcomingCompetition)
    .slice(0, limit)

  if (competitions.length === 0) return []

  const ids = competitions.map((c) => c.id)
  const { data: categoryRows, error: categoryError } = await supabase
    .from('competition_categories')
    .select('*')
    .in('competition_id', ids)
    .eq('status', 'active')
    .order('sort_order', { ascending: true })

  if (categoryError) throw categoryError

  const categoriesByCompetition = new Map<string, CompetitionCategory[]>()
  for (const row of categoryRows ?? []) {
    const category = mapCompetitionCategory(row)
    const list = categoriesByCompetition.get(category.competitionId) ?? []
    list.push(category)
    categoriesByCompetition.set(category.competitionId, list)
  }

  return competitions.map((competition) => {
    const settings = competition.settings ?? {}
    const bannerUrl =
      typeof settings.banner_url === 'string'
        ? settings.banner_url
        : typeof settings.bannerUrl === 'string'
          ? settings.bannerUrl
          : null

    return {
      ...competition,
      registrationOpen: competition.status === 'registration_open',
      daysUntil: daysUntilDate(competition.startDate),
      categories: categoriesByCompetition.get(competition.id) ?? [],
      bannerUrl,
    }
  })
}

async function fetchLandingCommunityPosts(limit = LANDING_POST_LIMIT): Promise<CommunityPost[]> {
  return fetchPosts(limit)
}

/** Aggregates all landing page data in parallel — single entry point for the public homepage. */
export async function fetchLandingPageData(): Promise<LandingPageData> {
  const [stats, coaches, academies, competitions, communityPosts] = await Promise.all([
    fetchLandingStats(),
    fetchLandingCoaches(),
    fetchLandingAcademies(),
    fetchLandingCompetitions(),
    fetchLandingCommunityPosts(),
  ])

  return { stats, coaches, academies, competitions, communityPosts }
}

export {
  fetchLandingStats,
  fetchLandingCoaches,
  fetchLandingAcademies,
  fetchLandingCompetitions,
  fetchLandingCommunityPosts,
}
