import { BadgeCheck, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { upsertThreadSettings } from '../../services/chatSettings'
import { ensureDirectChat, formatChatError, sendDirectMessage } from '../../services/directChat'
import { getChatParticipantProfilePath } from '../../utils/chatRoutes'

interface EmptyChatPanelProps {
  currentUserId: string
  participantId: string
  participantName: string
  participantAvatar?: string
  participantVerified?: boolean
  participantRole?: 'student' | 'teacher'
  currentUserRole?: 'student' | 'teacher'
  onConversationStarted: (threadId: string) => void
}

/** Chat shell with no messages — used after delete or before first message. */
export function EmptyChatPanel({
  currentUserId,
  participantId,
  participantName,
  participantAvatar,
  participantVerified,
  participantRole = 'student',
  currentUserRole = 'student',
  onConversationStarted,
}: EmptyChatPanelProps) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const profilePath = getChatParticipantProfilePath(
    participantId,
    participantRole,
    currentUserRole,
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || sending) return
    const text = draft.trim()
    setDraft('')
    setSending(true)
    setError(null)
    try {
      const { threadId } = await ensureDirectChat(currentUserId, participantId)
      await sendDirectMessage(threadId, currentUserId, text)
      await upsertThreadSettings(threadId, currentUserId, { hidden: false })
      onConversationStarted(threadId)
    } catch (err) {
      setError(formatChatError(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-cream-dark border border-border rounded-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-cream/10 bg-charcoal shrink-0 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(profilePath)}
          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer rounded-sm hover:bg-cream/5 transition-colors -m-1 p-1"
        >
          <Avatar src={participantAvatar} name={participantName} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold truncate text-cream">{participantName}</h2>
              {participantVerified && (
                <Badge variant="verified" className="flex items-center gap-1 shrink-0">
                  <BadgeCheck size={10} />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-xs text-cream/45">Tap to view profile</p>
          </div>
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-cream-dark" />

      {error && (
        <p className="px-4 py-2 text-xs text-red-600 border-t border-border bg-cream shrink-0">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="px-3 py-2.5 border-t border-border bg-cream-dark shrink-0 flex items-center gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message"
          disabled={sending}
          className="flex-1 min-w-0 px-4 py-2.5 bg-charcoal border border-cream/10 rounded-full text-cream placeholder:text-cream/40 focus:outline-none focus:border-teal transition-colors text-sm disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="shrink-0 w-10 h-10 inline-flex items-center justify-center bg-teal text-cream rounded-full hover:bg-teal-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
