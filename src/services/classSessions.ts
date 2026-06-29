import { supabase } from '../lib/supabase'

// VERIFIED: live class sessions — teacher start, student ring, LiveKit join, session status
export type ClassSessionStatus = 'ringing' | 'active' | 'ended' | 'declined' | 'missed'

export type ClassSession = {
  id: string
  teacherId: string
  studentId: string
  scheduleId: string | null
  roomName: string
  status: ClassSessionStatus
  startedAt: string | null
  endedAt: string | null
  createdAt: string
  teacherName?: string
  studentName?: string
  /** Linked schedule slot start (1-hour class window begins here) */
  scheduledSessionAt?: string | null
}

function mapSession(row: Record<string, unknown>): ClassSession {
  const teacher = row.teacher as { full_name?: string } | null
  const student = row.student as { full_name?: string } | null
  const schedule = row.schedule as { scheduled_at?: string } | null | Array<{ scheduled_at?: string }>
  const scheduleRow = Array.isArray(schedule) ? schedule[0] : schedule
  return {
    id: row.id as string,
    teacherId: row.teacher_id as string,
    studentId: row.student_id as string,
    scheduleId: (row.schedule_id as string) ?? null,
    roomName: row.room_name as string,
    status: row.status as ClassSessionStatus,
    startedAt: (row.started_at as string) ?? null,
    endedAt: (row.ended_at as string) ?? null,
    createdAt: row.created_at as string,
    teacherName: teacher?.full_name,
    studentName: student?.full_name,
    scheduledSessionAt: scheduleRow?.scheduled_at ?? null,
  }
}

const sessionSelect = `
  *,
  teacher:profiles!teacher_id(full_name),
  student:profiles!student_id(full_name, avatar_url),
  schedule:schedules(scheduled_at)
`

export async function fetchLiveKitToken(params: {
  roomName: string
  participantName: string
  participantId: string
}) {
  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token
  if (!token) throw new Error('Please sign in again to join video.')

  if (!params.roomName?.trim() || !params.participantName?.trim() || !params.participantId?.trim()) {
    throw new Error('Missing video call details. Refresh and try again.')
  }

  const response = await fetch('/api/livekit-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      roomName: params.roomName,
      participantName: params.participantName,
      participantId: params.participantId,
    }),
  })

  const body = (await response.json().catch(() => ({}))) as {
    token?: string
    serverUrl?: string
    error?: string
  }

  if (!response.ok || !body.token || !body.serverUrl) {
    const fallback =
      response.status === 404
        ? 'Video API is unavailable. Restart with npm run dev (local) or redeploy on Vercel.'
        : 'Could not connect to video server.'
    throw new Error(body.error ?? fallback)
  }

  return { token: body.token, serverUrl: body.serverUrl }
}

export async function createClassSession(params: {
  teacherId: string
  studentId: string
  scheduleId?: string | null
}) {
  const roomName = `yogstra-${crypto.randomUUID()}`

  const { data, error } = await supabase
    .from('class_sessions')
    .insert({
      teacher_id: params.teacherId,
      student_id: params.studentId,
      schedule_id: params.scheduleId ?? null,
      room_name: roomName,
      status: 'ringing',
    })
    .select(sessionSelect)
    .single()

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      throw new Error('Video classes are not set up. Run supabase/class-sessions.sql.')
    }
    throw error
  }

  return mapSession(data as Record<string, unknown>)
}

export async function fetchClassSession(sessionId: string): Promise<ClassSession | null> {
  const { data, error } = await supabase
    .from('class_sessions')
    .select(sessionSelect)
    .eq('id', sessionId)
    .maybeSingle()

  if (error) throw error
  return data ? mapSession(data as Record<string, unknown>) : null
}

export async function updateClassSessionStatus(
  sessionId: string,
  status: ClassSessionStatus,
  extra?: { startedAt?: string; endedAt?: string },
) {
  const patch: Record<string, unknown> = { status }
  if (extra?.startedAt) patch.started_at = extra.startedAt
  if (extra?.endedAt) patch.ended_at = extra.endedAt

  const { error } = await supabase.from('class_sessions').update(patch).eq('id', sessionId)
  if (error) throw error
}

/** Re-ring the student while the teacher stays in the active class. */
export async function ringStudentAgain(sessionId: string) {
  const { error } = await supabase
    .from('class_sessions')
    .update({ status: 'ringing' })
    .eq('id', sessionId)
    .in('status', ['active', 'ringing'])

  if (error) throw error
}

export async function fetchStudentRingingSession(studentId: string): Promise<ClassSession | null> {
  const { data, error } = await supabase
    .from('class_sessions')
    .select(sessionSelect)
    .eq('student_id', studentId)
    .eq('status', 'ringing')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return null
    throw error
  }

  return data ? mapSession(data as Record<string, unknown>) : null
}

export async function fetchTeacherActiveSessions(teacherId: string): Promise<ClassSession[]> {
  const { data, error } = await supabase
    .from('class_sessions')
    .select(sessionSelect)
    .eq('teacher_id', teacherId)
    .in('status', ['ringing', 'active'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapSession(row as Record<string, unknown>))
}

export async function fetchStudentActiveSessions(studentId: string): Promise<ClassSession[]> {
  const { data, error } = await supabase
    .from('class_sessions')
    .select(sessionSelect)
    .eq('student_id', studentId)
    .in('status', ['ringing', 'active'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapSession(row as Record<string, unknown>))
}

type Listener = () => void

const sessionChannels = new Map<
  string,
  { channel: ReturnType<typeof supabase.channel>; listeners: Set<Listener> }
>()

export function subscribeToClassSessions(
  userId: string,
  role: 'teacher' | 'student',
  onChange: () => void,
) {
  const key = `${role}:${userId}`
  let entry = sessionChannels.get(key)
  if (!entry) {
    const listeners = new Set<Listener>()
    const filterCol = role === 'teacher' ? 'teacher_id' : 'student_id'
    const channel = supabase
      .channel(`class_sessions:${key}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_sessions',
          filter: `${filterCol}=eq.${userId}`,
        },
        () => listeners.forEach((l) => l()),
      )
      .subscribe()

    entry = { channel, listeners }
    sessionChannels.set(key, entry)
  }

  entry.listeners.add(onChange)
  return () => {
    entry!.listeners.delete(onChange)
    if (entry!.listeners.size === 0) {
      void supabase.removeChannel(entry!.channel)
      sessionChannels.delete(key)
    }
  }
}

type SessionListener = (session: ClassSession) => void

const sessionByIdChannels = new Map<
  string,
  { channel: ReturnType<typeof supabase.channel>; listeners: Set<SessionListener> }
>()

export function subscribeToClassSessionById(
  sessionId: string,
  onChange: SessionListener,
) {
  let entry = sessionByIdChannels.get(sessionId)
  if (!entry) {
    const listeners = new Set<SessionListener>()
    const channel = supabase
      .channel(`class_session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'class_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const session = mapSession(row)
          listeners.forEach((l) => l(session))
        },
      )
      .subscribe()

    entry = { channel, listeners }
    sessionByIdChannels.set(sessionId, entry)
  }

  entry.listeners.add(onChange)
  return () => {
    entry!.listeners.delete(onChange)
    if (entry!.listeners.size === 0) {
      void supabase.removeChannel(entry!.channel)
      sessionByIdChannels.delete(sessionId)
    }
  }
}
