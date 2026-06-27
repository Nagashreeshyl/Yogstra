import type { Teacher } from '../types'
import { buildTeacherRequestMessage } from '../utils/teacherIntroMessage'
import { createTeacherBookingRequest, hasExistingTeacherRequest } from './bookings'
import { fetchHiddenThreadIds } from './chatSettings'
import {
  ensureDirectChat,
  hideLatestMessageForUser,
  sendDirectMessage,
} from './directChat'

export async function requestTeacherWithIntro(params: {
  studentId: string
  studentName: string
  teacher: Teacher
}): Promise<{ threadId: string; isNewRequest: boolean }> {
  const { studentId, studentName, teacher } = params

  const alreadyRequested = await hasExistingTeacherRequest(studentId, teacher.id)

  if (!alreadyRequested) {
    await createTeacherBookingRequest(studentId, teacher.id, teacher.monthlyFee)
  }

  const { threadId } = await ensureDirectChat(studentId, teacher.id)
  const hiddenThreadIds = await fetchHiddenThreadIds(studentId).catch(() => new Set<string>())
  const chatHiddenForStudent = hiddenThreadIds.has(threadId)

  if (!alreadyRequested) {
    const message = buildTeacherRequestMessage(studentName, teacher.gender)
    await sendDirectMessage(threadId, studentId, message)
    if (chatHiddenForStudent) {
      await hideLatestMessageForUser(threadId, studentId)
    }
    return { threadId, isNewRequest: true }
  }

  return { threadId, isNewRequest: false }
}
