import { Megaphone } from 'lucide-react'
import type { CompetitionAnnouncement } from '../../../domain/competition/models'

interface AnnouncementCardProps {
  announcement: CompetitionAnnouncement
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const when = announcement.publishedAt
    ? new Date(announcement.publishedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  return (
    <article className="rounded-[12px] border border-border bg-muted/30 px-4 py-3">
      <div className="flex items-start gap-3">
        <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <h4 className="text-sm font-semibold">{announcement.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{announcement.body}</p>
          {when && (
            <time className="mt-2 block text-xs text-muted-foreground" dateTime={announcement.publishedAt!}>
              {when}
            </time>
          )}
        </div>
      </div>
    </article>
  )
}
