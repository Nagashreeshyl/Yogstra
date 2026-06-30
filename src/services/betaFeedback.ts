import { supabase } from '../lib/supabase'

export type FeedbackCategory = 'bug' | 'suggestion' | 'feature' | 'general'

export type BetaFeedback = {
  id: string
  userId: string | null
  role: string | null
  category: FeedbackCategory
  message: string
  pageUrl: string | null
  status: string
  adminNotes: string | null
  createdAt: string
}

export async function submitBetaFeedback(params: {
  category: FeedbackCategory
  message: string
  pageUrl?: string
  role?: string
}) {
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user.id
  if (!userId) throw new Error('Please sign in to submit feedback.')

  const { error } = await supabase.from('beta_feedback').insert({
    user_id: userId,
    role: params.role ?? null,
    category: params.category,
    message: params.message.trim().slice(0, 2000),
    page_url: params.pageUrl ?? null,
  })

  if (error) throw error
}

export async function fetchBetaFeedback(limit = 100): Promise<BetaFeedback[]> {
  const { data, error } = await supabase
    .from('beta_feedback')
    .select('id, user_id, role, category, message, page_url, status, admin_notes, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    userId: (row.user_id as string | null) ?? null,
    role: (row.role as string | null) ?? null,
    category: row.category as FeedbackCategory,
    message: row.message as string,
    pageUrl: (row.page_url as string | null) ?? null,
    status: row.status as string,
    adminNotes: (row.admin_notes as string | null) ?? null,
    createdAt: row.created_at as string,
  }))
}

export async function updateFeedbackStatus(id: string, status: string, adminNotes?: string) {
  const { error } = await supabase
    .from('beta_feedback')
    .update({ status, admin_notes: adminNotes ?? null })
    .eq('id', id)

  if (error) throw error
}
