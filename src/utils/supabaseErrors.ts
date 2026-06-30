/** True when Supabase/PostgREST reports a missing table or stale schema cache entry. */
export function isMissingTableError(error: {
  code?: string
  message?: string
  status?: number
  statusCode?: number
} | null | undefined): boolean {
  if (!error) return false
  const status = error.status ?? error.statusCode
  if (status === 404) return true
  const message = error.message?.toLowerCase() ?? ''
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    message.includes('schema cache') ||
    message.includes('does not exist')
  )
}
