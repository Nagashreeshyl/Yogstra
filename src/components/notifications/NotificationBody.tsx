import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { studentProfilePath } from '../../utils/chatRoutes'
import { PROFILE_LINK_REGEX } from '../../utils/messageContent'

export function NotificationBody({
  text,
  viewerRole = 'teacher',
}: {
  text: string
  viewerRole?: 'student' | 'teacher'
}) {
  const parts: ReactNode[] = []
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
        className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
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
