/** Profile URL when opening a chat participant from messages */
export function getChatParticipantProfilePath(
  participantId: string,
  participantRole: 'student' | 'teacher',
  viewerRole: 'student' | 'teacher',
): string {
  if (participantRole === 'teacher') {
    return viewerRole === 'student'
      ? `/dashboard/student/teachers/${participantId}`
      : `/teachers/${participantId}`
  }
  return viewerRole === 'teacher'
    ? `/dashboard/teacher/students/${participantId}`
    : `/dashboard/student/students/${participantId}`
}

export function studentProfilePath(
  studentId: string,
  viewerRole: 'student' | 'teacher' = 'student',
) {
  return viewerRole === 'teacher'
    ? `/dashboard/teacher/students/${studentId}`
    : `/dashboard/student/students/${studentId}`
}
