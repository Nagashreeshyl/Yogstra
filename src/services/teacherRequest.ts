import type { Teacher } from '../types'
import { buildTeacherRequestMessage } from '../utils/teacherIntroMessage'
import { upsertThreadSettings, fetchHiddenThreadIds } from './chatSettings'
import {
  ensureDirectChat,
  formatChatError,
  hideLatestMessageForUser,
  sendDirectMessage,
} from './directChat'
import { supabase } from '../lib/supabase'

export async function requestTeacherWithIntro(params: {
  studentId: string
  studentName: string
  teacher: Teacher
}): Promise<{ threadId: string; isNewRequest: boolean }> {
  const { studentId, studentName, teacher } = params

  let threadId: string
  try {
    ;({ threadId } = await ensureDirectChat(studentId, teacher.id))
  } catch (err) {
    throw new Error(formatChatError(err))
  }

  const { data: existingMessage } = await supabase
    .from('direct_messages')
    .select('id')
    .eq('thread_id', threadId)
    .eq('sender_id', studentId)
    .limit(1)
    .maybeSingle()

  const alreadyRequested = Boolean(existingMessage)

  await upsertThreadSettings(threadId, studentId, { hidden: false }).catch(() => {})

  const hiddenThreadIds = await fetchHiddenThreadIds(studentId).catch(() => new Set<string>())
  const chatHiddenForStudent = hiddenThreadIds.has(threadId)

  if (!alreadyRequested) {
    const message = buildTeacherRequestMessage(studentName, teacher.gender)
    try {
      await sendDirectMessage(threadId, studentId, message)
    } catch (err) {
      throw new Error(formatChatError(err))
    }
    if (chatHiddenForStudent) {
      await hideLatestMessageForUser(threadId, studentId)
    }
    return { threadId, isNewRequest: true }
  }

  return { threadId, isNewRequest: false }
}
