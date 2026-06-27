type Tab = 'students' | 'teachers'

export type ChatNavigationParticipant = {
  id: string
  name: string
  avatar?: string
  photo?: string
  verified?: boolean
}

export type ChatNavigationState = {
  selectedUserId: string
  tab: Tab
  participant: {
    id: string
    name: string
    avatar: string
    role: 'student' | 'teacher'
    verified?: boolean
  }
}

export function messagesPathForRole(role: 'student' | 'teacher') {
  return role === 'teacher' ? '/dashboard/teacher/messages' : '/dashboard/student/messages'
}

export function buildChatNavigationState(
  participant: ChatNavigationParticipant,
  participantRole: 'student' | 'teacher',
): ChatNavigationState {
  return {
    selectedUserId: participant.id,
    tab: participantRole === 'teacher' ? 'teachers' : 'students',
    participant: {
      id: participant.id,
      name: participant.name,
      avatar: participant.avatar ?? participant.photo ?? '',
      role: participantRole,
      verified: participant.verified,
    },
  }
}
