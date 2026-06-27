import { supabase } from '../lib/supabase'

export type ThreadSetting = {
  muted: boolean
  blocked: boolean
  hidden: boolean
  historyClearedAt?: string | null
}

const defaults: ThreadSetting = { muted: false, blocked: false, hidden: false, historyClearedAt: null }

function isMissingTableError(error: { code?: string; message?: string }) {
  return error.code === 'PGRST205' || error.code === '42P01'
}

function isMissingHistoryColumnError(error: { code?: string; message?: string }) {
  return (
    error.code === '42703' ||
    Boolean(error.message?.includes('history_cleared_at'))
  )
}

/** Cached after first query — avoids repeated failures before migration is run. */
let historyClearedAtAvailable: boolean | null = null

export async function fetchThreadSettings(
  threadId: string,
  userId: string,
): Promise<ThreadSetting> {
  if (historyClearedAtAvailable === false) {
    return fetchThreadSettingsBase(threadId, userId)
  }

  const { data, error } = await supabase
    .from('chat_thread_settings')
    .select('muted, blocked, hidden, history_cleared_at')
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) return defaults
    if (isMissingHistoryColumnError(error)) {
      historyClearedAtAvailable = false
      return fetchThreadSettingsBase(threadId, userId)
    }
    throw error
  }
  historyClearedAtAvailable = true
  if (!data) return defaults
  return {
    muted: data.muted,
    blocked: data.blocked,
    hidden: data.hidden,
    historyClearedAt: data.history_cleared_at ?? null,
  }
}

async function fetchThreadSettingsBase(
  threadId: string,
  userId: string,
): Promise<ThreadSetting> {
  const { data, error } = await supabase
    .from('chat_thread_settings')
    .select('muted, blocked, hidden')
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) return defaults
    throw error
  }
  if (!data) return defaults
  return {
    muted: data.muted,
    blocked: data.blocked,
    hidden: data.hidden,
    historyClearedAt: null,
  }
}

export async function fetchUserHistoryCutoffs(
  userId: string,
  threadIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (threadIds.length === 0) return map

  if (historyClearedAtAvailable === false) return map

  const { data, error } = await supabase
    .from('chat_thread_settings')
    .select('thread_id, history_cleared_at')
    .eq('user_id', userId)
    .in('thread_id', threadIds)
    .not('history_cleared_at', 'is', null)

  if (error) {
    if (isMissingTableError(error)) return map
    if (isMissingHistoryColumnError(error)) {
      historyClearedAtAvailable = false
      return map
    }
    throw error
  }
  historyClearedAtAvailable = true

  for (const row of data ?? []) {
    if (row.history_cleared_at) {
      map.set(row.thread_id as string, row.history_cleared_at as string)
    }
  }
  return map
}

export async function fetchHiddenThreadIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('chat_thread_settings')
    .select('thread_id')
    .eq('user_id', userId)
    .eq('hidden', true)

  if (error) {
    if (isMissingTableError(error)) return new Set()
    throw error
  }
  return new Set((data ?? []).map((row) => row.thread_id as string))
}

export async function upsertThreadSettings(
  threadId: string,
  userId: string,
  patch: Partial<ThreadSetting>,
) {
  const row: Record<string, unknown> = {
    thread_id: threadId,
    user_id: userId,
    updated_at: new Date().toISOString(),
  }
  if (patch.muted !== undefined) row.muted = patch.muted
  if (patch.blocked !== undefined) row.blocked = patch.blocked
  if (patch.hidden !== undefined) row.hidden = patch.hidden
  const includeHistory =
    patch.historyClearedAt !== undefined && historyClearedAtAvailable !== false
  if (includeHistory) row.history_cleared_at = patch.historyClearedAt

  const { error } = await supabase.from('chat_thread_settings').upsert(row, {
    onConflict: 'thread_id,user_id',
  })

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error('Chat settings are not set up. Run supabase/chat-enhancements.sql.')
    }
    if (includeHistory && isMissingHistoryColumnError(error)) {
      historyClearedAtAvailable = false
      await upsertThreadSettings(threadId, userId, { ...patch, historyClearedAt: undefined })
      return
    }
    throw error
  }
  if (includeHistory) historyClearedAtAvailable = true
}
