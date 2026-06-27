import { supabase } from '../lib/supabase'

type Listener = () => void

type TableSpec = {
  table: string
  filter?: string
}

function debounceListeners(listeners: Set<Listener>, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      listeners.forEach((listener) => listener())
    }, ms)
  }
}

function createLiveChannel(channelName: string, tables: TableSpec[]) {
  const registry = new Map<
    string,
    { channel: ReturnType<typeof supabase.channel>; listeners: Set<Listener> }
  >()

  return function subscribe(onChange: Listener) {
    let entry = registry.get(channelName)
    if (!entry) {
      const listeners = new Set<Listener>()
      const notify = debounceListeners(listeners, 350)
      let channel = supabase.channel(channelName)

      for (const { table, filter } of tables) {
        channel = channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            ...(filter ? { filter } : {}),
          },
          notify,
        )
      }

      channel.subscribe()
      entry = { channel, listeners }
      registry.set(channelName, entry)
    }

    entry.listeners.add(onChange)
    return () => {
      entry!.listeners.delete(onChange)
      if (entry!.listeners.size === 0) {
        void supabase.removeChannel(entry!.channel)
        registry.delete(channelName)
      }
    }
  }
}

/** Teacher listings, profile pages, and cards (profiles + teacher_profiles). */
export const subscribeToTeacherListing = createLiveChannel('live:teachers', [
  { table: 'teacher_profiles' },
  { table: 'profiles' },
])

/** Bookings, student counts, earnings, teacher student lists. */
export const subscribeToBookings = createLiveChannel('live:bookings', [
  { table: 'bookings' },
])

/** Community feed and comments. */
export const subscribeToPosts = createLiveChannel('live:posts', [
  { table: 'posts' },
  { table: 'comments' },
])

/** Schedules and paid class orders. */
export const subscribeToSchedules = createLiveChannel('live:schedules', [
  { table: 'schedules' },
  { table: 'class_orders' },
])

/** Payout records for teacher earnings. */
export const subscribeToPayouts = createLiveChannel('live:payouts', [
  { table: 'payouts' },
])

export type LiveSyncScope = 'teachers' | 'bookings' | 'posts' | 'schedules' | 'payouts'

export const LIVE_SYNC_SUBSCRIBERS: Record<
  LiveSyncScope,
  (onChange: Listener) => () => void
> = {
  teachers: subscribeToTeacherListing,
  bookings: subscribeToBookings,
  posts: subscribeToPosts,
  schedules: subscribeToSchedules,
  payouts: subscribeToPayouts,
}

export function subscribeToLiveScopes(
  scopes: LiveSyncScope[],
  onChange: Listener,
): () => void {
  const unsubs = scopes.map((scope) => LIVE_SYNC_SUBSCRIBERS[scope](onChange))
  return () => unsubs.forEach((unsub) => unsub())
}

/** Current user's profile row (avatar, name, teacher status fields). */
export function subscribeToOwnProfile(userId: string, onChange: Listener) {
  return createLiveChannel(`live:profile:${userId}`, [
    { table: 'profiles', filter: `id=eq.${userId}` },
    { table: 'teacher_profiles', filter: `id=eq.${userId}` },
  ])(onChange)
}
