import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { Avatar } from '../../ui/Avatar'
import { EmptyState } from '../../shell/EmptyState'
import { formatRelativeDate } from '../../../utils/format'
import type { TeacherDashboardMessage } from '../../../services/teacherDashboard'

interface MessagesWidgetProps {
  messages: TeacherDashboardMessage[]
  unreadTotal: number
}

export function MessagesWidget({ messages, unreadTotal }: MessagesWidgetProps) {
  return (
    <DashboardCard
      title="Messages"
      description={unreadTotal > 0 ? `${unreadTotal} unread` : 'Recent conversations'}
      action={
        <Link to="/dashboard/teacher/messages" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      }
    >
      {messages.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={24} />}
          title="No messages yet"
          description="Conversations with students will appear here."
          action={
            <Link to="/dashboard/teacher/messages" className="text-sm font-medium text-primary hover:underline">
              Open messages
            </Link>
          }
          className="py-8"
        />
      ) : (
        <ul className="space-y-2">
          {messages.map((message) => (
            <li key={message.userId}>
              <Link
                to="/dashboard/teacher/messages"
                state={{ openUserId: message.userId }}
                className="flex items-start gap-3 rounded-[12px] border border-border px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <Avatar src={message.avatar} name={message.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{message.name}</p>
                    {message.lastMessageAt && (
                      <time className="text-xs text-muted-foreground shrink-0">
                        {formatRelativeDate(message.lastMessageAt)}
                      </time>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{message.preview}</p>
                </div>
                {message.unreadCount > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    {message.unreadCount > 99 ? '99+' : message.unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}
