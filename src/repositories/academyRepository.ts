import { supabase } from '../lib/supabase'
import type { CreateAcademyInput, AcademySettings } from '../domain/academy/models'
import { mapAcademy, mapAcademySettings } from '../utils/academyMappers'

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

export const academyRepository = {
  async findById(id: string) {
    const { data, error } = await supabase
      .from('academies')
      .select(academySelect)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? mapAcademy(data) : null
  },

  async findBySlug(slug: string) {
    const { data, error } = await supabase
      .from('academies')
      .select(academySelect)
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    return data ? mapAcademy(data) : null
  },

  async listForUser(userId: string) {
    const { data: memberRows, error: memberError } = await supabase
      .from('academy_members')
      .select(`academy_id, academies (${academySelect})`)
      .eq('user_id', userId)
      .eq('status', 'active')

    if (memberError) throw memberError

    const { data: teacherRows, error: teacherError } = await supabase
      .from('teacher_academies')
      .select(`academy_id, academies (${academySelect})`)
      .eq('teacher_id', userId)
      .eq('status', 'active')

    if (teacherError) throw teacherError

    const academies = new Map<string, ReturnType<typeof mapAcademy>>()

    for (const row of memberRows ?? []) {
      const academy = Array.isArray(row.academies) ? row.academies[0] : row.academies
      if (academy) academies.set(academy.id as string, mapAcademy(academy))
    }

    for (const row of teacherRows ?? []) {
      const academy = Array.isArray(row.academies) ? row.academies[0] : row.academies
      if (academy) academies.set(academy.id as string, mapAcademy(academy))
    }

    return [...academies.values()]
  },

  async listAll(limit = 200) {
    const { data, error } = await supabase
      .from('academies')
      .select(academySelect)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data ?? []).map(mapAcademy)
  },

  async listActive(limit = 50) {
    const { data, error } = await supabase
      .from('academies')
      .select(academySelect)
      .eq('status', 'active')
      .is('parent_academy_id', null)
      .order('name', { ascending: true })
      .limit(limit)

    if (error) throw error
    return (data ?? []).map(mapAcademy)
  },

  async create(input: CreateAcademyInput & { slug: string; createdBy: string }) {
    const { data, error } = await supabase
      .from('academies')
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        parent_academy_id: input.parentAcademyId ?? null,
        logo_url: input.logoUrl ?? null,
        created_by: input.createdBy,
      })
      .select(academySelect)
      .single()

    if (error) throw error
    return mapAcademy(data)
  },

  async createDefaultSettings(academyId: string) {
    const { data, error } = await supabase
      .from('academy_settings')
      .insert({ academy_id: academyId })
      .select('*')
      .single()

    if (error) throw error
    return mapAcademySettings(data)
  },

  async listBranches(parentAcademyId: string) {
    const { data, error } = await supabase
      .from('academies')
      .select(academySelect)
      .eq('parent_academy_id', parentAcademyId)
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapAcademy)
  },

  async getSettings(academyId: string) {
    const { data, error } = await supabase
      .from('academy_settings')
      .select('*')
      .eq('academy_id', academyId)
      .maybeSingle()

    if (error) throw error
    return data ? mapAcademySettings(data) : null
  },

  async updateSettings(
    academyId: string,
    partial: Partial<Pick<AcademySettings, 'timezone' | 'currency' | 'settings'>>,
  ) {
    const payload: Record<string, unknown> = {}
    if (partial.timezone !== undefined) payload.timezone = partial.timezone
    if (partial.currency !== undefined) payload.currency = partial.currency
    if (partial.settings !== undefined) payload.settings = partial.settings

    const { data, error } = await supabase
      .from('academy_settings')
      .update(payload)
      .eq('academy_id', academyId)
      .select('*')
      .single()

    if (error) throw error
    return mapAcademySettings(data)
  },
}
