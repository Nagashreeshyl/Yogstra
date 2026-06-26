import { supabase } from '../lib/supabase'
import type { Category } from '../types'
import { mapCategory } from '../utils/mappers'

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return (data ?? []).map(mapCategory)
}

export async function createCategory(cat: Omit<Category, 'id'>) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: cat.name, icon: cat.icon })
    .select()
    .single()

  if (error) throw error
  return mapCategory(data)
}

export async function updateCategory(id: string, cat: Partial<Category>) {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: cat.name, icon: cat.icon })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapCategory(data)
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
