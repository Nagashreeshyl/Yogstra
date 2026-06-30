import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  fetchNotificationsForUser,
  fetchUnreadNotificationCountForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
  subscribeToNotifications,
} from '../../services/notificationCenter'
import { formatRelativeDate } from '../../utils/format'

interface NotificationDropdownProps {
  count?: number
}

export function NotificationDropdown({ count: countProp }: NotificationDropdownProps) {
  const { user } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const role = user?.role
  const userId = user?.id

  const { data: notifications, loading, refetch } = useAsyncData(
    () =>
      userId && role
        ? fetchNotificationsForUser(userId, role)
        : Promise.resolve([]),
    [userId, role],
    { enabled: Boolean(userId && role) },
  )

  const { data: liveCount } = useAsyncData(
    () =>
      userId && role
        ? fetchUnreadNotificationCountForUser(userId, role)
        : Promise.resolve(0),
    [userId, role, notifications?.length],
    { enabled: Boolean(userId && role) },
  )

  const count = countProp ?? liveCount ?? 0

  useEffect(() => {
    if (!userId || !role) return
    return subscribeToNotifications(userId, role, () => void refetch(true))
  }, [userId, role, refetch])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const handleMarkAllRead = async () => {
    if (!userId || !role) return
    await markAllNotificationsReadForUser(userId, role)
    void refetch(true)
  }

  const handleMarkRead = async (id: string) => {
    if (!userId || !role) return
    await markNotificationReadForUser(userId, role, id)
    void refetch(true)
  }

  if (!user) {
    return null
  }

  const settingsPath =
    user.role === 'admin'
      ? '/admin/settings'
      : user.role === 'teacher'
        ? '/dashboard/teacher/settings'
        : '/dashboard/student/settings'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 cursor-pointer"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell size={18} strokeWidth={1.75} />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent text-[10px] font-semibold text-accent-foreground flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-80 max-h-[min(24rem,70vh)] overflow-y-auto rounded-[16px] border border-border bg-elevated shadow-md z-50"
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-border bg-elevated px-4 py-3">
            <p className="text-sm font-medium text-foreground">Notifications</p>
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
            >
              <CheckCheck size={14} aria-hidden />
              Mark all read
            </button>
          </div>

          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : !notifications?.length ? (
            <p className="p-4 text-sm text-muted-foreground">You are all caught up.</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.id}>
                  {n.href ? (
                    <Link
                      to={n.href}
                      onClick={() => {
                        void handleMarkRead(n.id)
                        setOpen(false)
                      }}
                      className={`block px-4 py-3 hover:bg-muted/60 transition-colors ${n.read ? 'opacity-70' : ''}`}
                    >
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{formatRelativeDate(n.createdAt)}</p>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleMarkRead(n.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors cursor-pointer ${n.read ? 'opacity-70' : ''}`}
                    >
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{formatRelativeDate(n.createdAt)}</p>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <Link to={settingsPath} onClick={() => setOpen(false)} className="text-primary hover:underline">
              Notification preferences
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
