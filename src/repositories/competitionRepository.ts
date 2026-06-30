import { supabase } from '../lib/supabase'
import { isMissingTableError } from '../utils/supabaseErrors'
import type {
  CreateCompetitionCategoryInput,
  CreateCompetitionInput,
} from '../domain/competition/models'
import {
  mapCompetition,
  mapCompetitionAnnouncement,
  mapCompetitionCategory,
  mapCompetitionEvent,
} from '../utils/competitionMappers'
import { defaultCompetitionSettings } from '../utils/defaultScoringCriteria'

function nullableText(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function nullableDate(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

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

/** Flat select for writes — avoids embed RLS failures on insert/update returning. */
const competitionRowSelect = `
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
  updated_at
`

const categorySelect = `
  id,
  competition_id,
  name,
  age_group,
  style_type,
  difficulty,
  max_participants,
  entry_fee_override,
  sort_order,
  status,
  created_at,
  updated_at
`

export const competitionRepository = {
  async findById(id: string) {
    const { data, error } = await supabase
      .from('competitions')
      .select(competitionSelect)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      if (isMissingTableError(error)) return null
      throw error
    }
    return data ? mapCompetition(data) : null
  },

  async findBySlug(slug: string) {
    const { data, error } = await supabase
      .from('competitions')
      .select(competitionSelect)
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      if (isMissingTableError(error)) return null
      throw error
    }
    return data ? mapCompetition(data) : null
  },

  async slugTaken(slug: string) {
    const { data, error } = await supabase
      .from('competitions')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      if (isMissingTableError(error)) return false
      throw error
    }
    return data !== null
  },

  async listPublished(limit = 50) {
    const { data, error } = await supabase
      .from('competitions')
      .select(competitionSelect)
      .in('status', [
        'published',
        'registration_open',
        'registration_closed',
        'in_progress',
        'scoring',
        'results_pending',
        'completed',
      ])
      .order('start_date', { ascending: true, nullsFirst: false })
      .limit(limit)

    if (error) {
      if (isMissingTableError(error)) return []
      throw error
    }
    return (data ?? []).map(mapCompetition)
  },

  async listAll(limit = 200) {
    const { data, error } = await supabase
      .from('competitions')
      .select(competitionSelect)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      if (isMissingTableError(error)) return []
      throw error
    }
    return (data ?? []).map(mapCompetition)
  },

  async listForOrganizer(userId: string) {
    const { data, error } = await supabase
      .from('competitions')
      .select(competitionSelect)
      .or(`organizer_id.eq.${userId},created_by.eq.${userId}`)
      .order('start_date', { ascending: false, nullsFirst: false })

    if (error) {
      if (isMissingTableError(error)) return []
      throw error
    }
    return (data ?? []).map(mapCompetition)
  },

  async create(input: CreateCompetitionInput & { slug: string; createdBy: string }) {
    const { data, error } = await supabase
      .from('competitions')
      .insert({
        name: input.name.trim(),
        slug: input.slug,
        description: nullableText(input.description),
        organizer_id: input.organizerId ?? input.createdBy,
        academy_id: input.academyId ?? null,
        venue: nullableText(input.venue),
        city: nullableText(input.city),
        state: nullableText(input.state),
        country: input.country ?? 'IN',
        start_date: nullableDate(input.startDate),
        end_date: nullableDate(input.endDate),
        registration_deadline: nullableDate(input.registrationDeadline),
        entry_fee: input.entryFee ?? 0,
        format: input.format ?? 'individual',
        scope: input.scope ?? 'friendly',
        max_participants:
          input.maxParticipants && input.maxParticipants > 0 ? input.maxParticipants : null,
        rules: nullableText(input.rules),
        settings: defaultCompetitionSettings(),
        created_by: input.createdBy,
      })
      .select(competitionRowSelect)
      .single()

    if (error) throw error
    return mapCompetition(data)
  },

  async listEvents(competitionId: string) {
    const { data, error } = await supabase
      .from('competition_events')
      .select('*')
      .eq('competition_id', competitionId)
      .order('sort_order', { ascending: true })
      .order('starts_at', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapCompetitionEvent)
  },

  async listCategories(competitionId: string) {
    const { data, error } = await supabase
      .from('competition_categories')
      .select(categorySelect)
      .eq('competition_id', competitionId)
      .eq('status', 'active')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapCompetitionCategory)
  },

  async createCategory(input: CreateCompetitionCategoryInput) {
    const { data, error } = await supabase
      .from('competition_categories')
      .insert({
        competition_id: input.competitionId,
        name: input.name,
        age_group: input.ageGroup ?? null,
        style_type: input.styleType ?? null,
        difficulty: input.difficulty ?? null,
        max_participants: input.maxParticipants ?? null,
        entry_fee_override: input.entryFeeOverride ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select(categorySelect)
      .single()

    if (error) throw error
    return mapCompetitionCategory(data)
  },

  async listAnnouncements(competitionId: string) {
    const { data, error } = await supabase
      .from('competition_announcements')
      .select('*')
      .eq('competition_id', competitionId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapCompetitionAnnouncement)
  },
}
