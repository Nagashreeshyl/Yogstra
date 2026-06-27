import { supabase } from '../lib/supabase'

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
}

function mapSession(row: Record<string, unknown>): ClassSession {
  const teacher = row.teacher as { full_name?: string } | null
  const student = row.student as { full_name?: string } | null
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
  }
}

const sessionSelect = `
  *,
  teacher:profiles!teacher_id(full_name),
  student:profiles!student_id(full_name, avatar_url)
`

export async function fetchLiveKitToken(params: {
  roomName: string
  participantName: string
  participantId: string
}) {
  const response = await fetch('/api/livekit-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const body = (await response.json().catch(() => ({}))) as {
    token?: string
    serverUrl?: string
    error?: string
  }

  if (!response.ok || !body.token || !body.serverUrl) {
    throw new Error(body.error ?? 'Could not connect to video server.')
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
