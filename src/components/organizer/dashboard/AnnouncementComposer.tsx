import { useState } from 'react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Select } from '../../ui/Select'
import { Textarea } from '../../ui/Textarea'
import { EmptyState } from '../../shell/EmptyState'
import type { CompetitionAnnouncement } from '../../../domain/competition/models'
import type { CompetitionAnnouncementAudience } from '../../../domain/competition/models'
import { publishAnnouncement, saveAnnouncement } from '../../../services/organizerOperations'

interface AnnouncementComposerProps {
  competitionId: string
  createdBy: string
  announcements: CompetitionAnnouncement[]
  onUpdated: () => void
}

const AUDIENCES: { value: CompetitionAnnouncementAudience; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'judges', label: 'Judges' },
  { value: 'participants', label: 'Students' },
  { value: 'organizers', label: 'Teachers' },
  { value: 'public', label: 'Academies / Public' },
]

export function AnnouncementComposer({
  competitionId,
  createdBy,
  announcements,
  onUpdated,
}: AnnouncementComposerProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<CompetitionAnnouncementAudience>('all')
  const [busy, setBusy] = useState(false)

  async function handleSave(publish: boolean) {
    if (!title.trim() || !body.trim()) return
    setBusy(true)
    try {
      await saveAnnouncement({
        competitionId,
        title: title.trim(),
        body: body.trim(),
        audience,
        createdBy,
        publish,
      })
      setTitle('')
      setBody('')
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  async function handlePublishExisting(id: string) {
    setBusy(true)
    try {
      await publishAnnouncement(id)
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardCard title="Announcements" description="Create, edit, and publish updates.">
      <div className="space-y-3 mb-6">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Message" value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
        <Select
          label="Target audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value as CompetitionAnnouncementAudience)}
        >
          {AUDIENCES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy || !title.trim() || !body.trim()}
            onClick={() => void handleSave(false)}
          >
            Save draft
          </Button>
          <Button
            size="sm"
            disabled={busy || !title.trim() || !body.trim()}
            onClick={() => void handleSave(true)}
          >
            Publish
          </Button>
        </div>
      </div>

      {announcements.length === 0 ? (
        <EmptyState title="No announcements" description="Publish updates for judges and participants." className="py-6" />
      ) : (
        <ul className="space-y-3">
          {announcements.map((announcement) => (
            <li
              key={announcement.id}
              className="rounded-[12px] border border-border px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{announcement.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {announcement.audience} · {announcement.status}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{announcement.body}</p>
                </div>
                {announcement.status === 'draft' && (
                  <Button size="sm" disabled={busy} onClick={() => void handlePublishExisting(announcement.id)}>
                    Publish
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}
