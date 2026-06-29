import { Link } from 'react-router-dom'
import { studentProfilePath } from '../../utils/chatRoutes'
import { PROFILE_LINK_REGEX } from '../../utils/messageContent'

interface ChatMessageContentProps {
  text: string
  isSent: boolean
  viewerRole?: 'student' | 'teacher'
}

export function ChatMessageContent({
  text,
  isSent,
  viewerRole = 'student',
}: ChatMessageContentProps) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  const re = new RegExp(PROFILE_LINK_REGEX.source, 'g')
  let match: RegExpExecArray | null

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const [, studentId, name] = match
    parts.push(
      <Link
        key={`${studentId}-${match.index}`}
        to={studentProfilePath(studentId, viewerRole)}
        className={`font-semibold underline underline-offset-2 ${
          isSent ? 'text-primary-foreground hover:text-white' : 'text-primary hover:text-primary-dark'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {name}
      </Link>,
    )
    lastIndex = re.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <>{parts}</>
}
