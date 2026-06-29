import { supabase } from '../lib/supabase'
import type {
  CreateCompetitionParticipantInput,
  CreateCompetitionRegistrationInput,
} from '../domain/competition/models'
import {
  mapCompetitionParticipant,
  mapCompetitionRegistration,
} from '../utils/competitionMappers'

const registrationSelect = `
  id,
  competition_id,
  category_id,
  division_id,
  registrant_id,
  registrant_type,
  academy_id,
  batch_id,
  status,
  payment_status,
  payment_amount,
  payment_reference,
  notes,
  submitted_at,
  confirmed_at,
  created_at,
  updated_at,
  registrant:profiles!registrant_id(full_name)
`

const participantSelect = `
  id,
  registration_id,
  competition_id,
  student_id,
  category_id,
  division_id,
  display_name,
  date_of_birth,
  gender,
  academy_id,
  teacher_id,
  status,
  check_in_at,
  documents_verified,
  metadata,
  created_at,
  updated_at,
  student:profiles!student_id(full_name),
  category:competition_categories!category_id(name)
`

export const competitionRegistrationRepository = {
  async findById(id: string) {
    const { data, error } = await supabase
      .from('competition_registrations')
      .select(registrationSelect)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? mapCompetitionRegistration(data) : null
  },

  async listByCompetition(competitionId: string) {
    const { data, error } = await supabase
      .from('competition_registrations')
      .select(registrationSelect)
      .eq('competition_id', competitionId)
      .order('submitted_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapCompetitionRegistration)
  },

  async listByRegistrant(registrantId: string) {
    const { data, error } = await supabase
      .from('competition_registrations')
      .select(registrationSelect)
      .eq('registrant_id', registrantId)
      .order('submitted_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapCompetitionRegistration)
  },

  async create(input: CreateCompetitionRegistrationInput) {
    const { data, error } = await supabase
      .from('competition_registrations')
      .insert({
        competition_id: input.competitionId,
        category_id: input.categoryId ?? null,
        division_id: input.divisionId ?? null,
        registrant_id: input.registrantId,
        registrant_type: input.registrantType,
        academy_id: input.academyId ?? null,
        batch_id: input.batchId ?? null,
        notes: input.notes ?? null,
      })
      .select(registrationSelect)
      .single()

    if (error) throw error
    return mapCompetitionRegistration(data)
  },

  async listParticipants(competitionId: string) {
    const { data, error } = await supabase
      .from('competition_participants')
      .select(participantSelect)
      .eq('competition_id', competitionId)
      .order('display_name', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapCompetitionParticipant)
  },

  async listParticipantsByRegistration(registrationId: string) {
    const { data, error } = await supabase
      .from('competition_participants')
      .select(participantSelect)
      .eq('registration_id', registrationId)

    if (error) throw error
    return (data ?? []).map(mapCompetitionParticipant)
  },

  async addParticipant(input: CreateCompetitionParticipantInput) {
    const { data, error } = await supabase
      .from('competition_participants')
      .insert({
        registration_id: input.registrationId,
        competition_id: input.competitionId,
        student_id: input.studentId,
        category_id: input.categoryId,
        division_id: input.divisionId ?? null,
        display_name: input.displayName,
        date_of_birth: input.dateOfBirth ?? null,
        gender: input.gender ?? null,
        academy_id: input.academyId ?? null,
        teacher_id: input.teacherId ?? null,
        metadata: input.metadata ?? {},
      })
      .select(participantSelect)
      .single()

    if (error) throw error
    return mapCompetitionParticipant(data)
  },

  async countPendingDocuments(competitionId: string) {
    const { count, error } = await supabase
      .from('competition_participants')
      .select('id', { count: 'exact', head: true })
      .eq('competition_id', competitionId)
      .eq('documents_verified', false)
      .neq('status', 'withdrawn')

    if (error) throw error
    return count ?? 0
  },
}
