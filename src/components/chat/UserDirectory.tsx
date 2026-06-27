import { Clock } from 'lucide-react'
import type { MessagingUser } from '../../types'
import { requiresChatRequest } from '../../services/directChat'
import { Avatar } from '../ui/Avatar'
import { formatRelativeDate } from '../../utils/format'
import { UserDirectorySkeleton } from '../ui/Skeleton'

type Tab = 'students' | 'teachers'

interface UserDirectoryProps {
  tab: Tab
  users: MessagingUser[]
  selectedUserId: string | null
  currentUserId: string
  currentUserRole: 'student' | 'teacher'
  loading: boolean
  onSelect: (userId: string) => void
  className?: string
}

export function UserDirectory({
  tab,
  users,
  selectedUserId,
  currentUserId,
  currentUserRole,
  loading,
  onSelect,
  className = '',
}: UserDirectoryProps) {
  if (loading) {
    return (
      <div className={className}>
        <UserDirectorySkeleton />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className={`border border-border rounded-sm p-6 text-sm text-charcoal/50 bg-cream md:h-full ${className}`}>
        No {tab} found yet.
      </div>
    )
  }

  return (
    <div
      className={`overflow-hidden bg-cream shrink-0 w-full flex flex-col md:border md:border-border md:rounded-sm md:h-full md:w-72 ${className}`}
    >
      <div className="overflow-y-auto flex-1">
        {users.map((user) => {
          const requestRequired = requiresChatRequest(currentUserRole, user.role)
          const isIncoming =
            requestRequired &&
            user.threadStatus === 'pending' &&
            user.requestedBy !== currentUserId
          const isOutgoing =
            requestRequired &&
            user.threadStatus === 'pending' &&
            user.requestedBy === currentUserId
          const isActive = user.threadStatus === 'accepted'
          const hasUnread = (user.unreadCount ?? 0) > 0

          return (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user.id)}
              className={`w-full text-left px-3 py-3 border-b border-border last:border-b-0 cursor-pointer transition-colors hover:bg-cream-dark flex items-center gap-3 ${
                selectedUserId === user.id ? 'bg-teal-soft' : hasUnread ? 'bg-cream-dark/40' : ''
              }`}
            >
              <div className="relative shrink-0">
                <Avatar src={user.avatar} name={user.name} size={44} />
                {(isIncoming || isOutgoing || hasUnread) && (
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-cream ${
                      hasUnread ? 'bg-teal' : isIncoming ? 'bg-teal' : 'bg-amber-500'
                    }`}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm truncate ${
                      hasUnread ? 'font-bold text-charcoal' : 'font-semibold text-charcoal'
                    }`}
                  >
                    {user.name}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    {hasUnread && (
                      <span className="min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-teal text-cream text-[10px] font-bold">
                        {user.unreadCount! > 99 ? '99+' : user.unreadCount}
                      </span>
                    )}
                    {isIncoming && !hasUnread && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-teal bg-teal-soft px-1.5 py-0.5 rounded-sm">
                        New
                      </span>
                    )}
                    {isOutgoing && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-sm">
                        <Clock size={10} />
                        Sent
                      </span>
                    )}
                  </div>
                </div>
                {user.lastMessage && isActive ? (
                  <>
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        hasUnread ? 'font-semibold text-charcoal/80' : 'text-charcoal/50'
                      }`}
                    >
                      {user.lastMessage}
                    </p>
                    {user.lastMessageAt && (
                      <p className="text-[10px] text-charcoal/40 mt-0.5">
                        {formatRelativeDate(user.lastMessageAt)}
                      </p>
                    )}
                  </>
                ) : isOutgoing ? (
                  <p className="text-xs text-amber-700/80 mt-0.5">Waiting for acceptance</p>
                ) : isIncoming ? (
                  <p className="text-xs text-teal mt-0.5">Wants to chat with you</p>
                ) : (
                  <p className="text-xs text-charcoal/40 mt-0.5 capitalize">{user.role}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
