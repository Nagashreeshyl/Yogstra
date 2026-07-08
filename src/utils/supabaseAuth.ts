import { supabase } from '../lib/supabase'

const REFRESH_BUFFER_SECONDS = 120

/** Returns a valid access token, refreshing the Supabase session when needed. */
export async function getFreshAccessToken(): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  const session = sessionData.session

  if (sessionError || !session?.access_token) {
    throw new Error('Please sign in again to continue.')
  }

  const expiresAt = session.expires_at ?? 0
  const secondsLeft = expiresAt - Math.floor(Date.now() / 1000)

  if (secondsLeft > REFRESH_BUFFER_SECONDS) {
    return session.access_token
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
  const nextToken = refreshed.session?.access_token

  if (refreshError || !nextToken) {
    throw new Error('Your session expired. Please sign in again.')
  }

  return nextToken
}

/** Refresh once and return a new access token — used after a 401 from our APIs. */
export async function forceRefreshAccessToken(): Promise<string> {
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
  const nextToken = refreshed.session?.access_token

  if (refreshError || !nextToken) {
    throw new Error('Your session expired. Please sign in again.')
  }

  return nextToken
}
