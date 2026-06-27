import { BadgeCheck, Send } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { useDirectChatMessages } from '../../hooks/useDirectChatMessages'
import { markThreadAsRead } from '../../services/directChat'
import { formatTime } from '../../utils/format'

interface WhatsAppChatWindowProps {
  threadId: string
  currentUserId: string
  participantName: string
  participantAvatar?: string
  participantVerified?: boolean
  onRead?: (threadId: string) => void
}

export function WhatsAppChatWindow({
  threadId,
  currentUserId,
  participantName,
  participantAvatar,
  participantVerified,
  onRead,
}: WhatsAppChatWindowProps) {
  const { messages, loading, sending, error, bottomRef, send } = useDirectChatMessages(
    threadId,
    currentUserId,
  )
  const [draft, setDraft] = useState('')

  const lastReadAt = messages.at(-1)?.createdAt

  useEffect(() => {
    if (loading || !threadId) return

    void markThreadAsRead(threadId, currentUserId, lastReadAt)
      .then(() => onRead?.(threadId))
      .catch(() => undefined)
  }, [threadId, currentUserId, loading, lastReadAt, onRead])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || sending) return
    const text = draft
    setDraft('')
    await send(text)
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-cream-dark border border-border rounded-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-cream/10 bg-charcoal shrink-0 flex items-center gap-3">
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
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-1.5 min-h-0 bg-cream-dark">
        {loading ? (
          <p className="text-sm text-charcoal/50 text-center py-8">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-charcoal/50 text-center py-8">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg) => {
            const isSent = msg.senderId === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-[78%] px-3 py-2 ${
                    isSent
                      ? 'bg-teal text-cream rounded-2xl rounded-tr-sm'
                      : 'bg-cream border border-border text-charcoal rounded-2xl rounded-tl-sm'
                  }`}
                >
                  <p className="text-[14.5px] leading-snug whitespace-pre-wrap break-words pr-12">
                    {msg.content}
                  </p>
                  <span
                    className={`absolute bottom-1.5 right-2.5 text-[10px] ${
                      isSent ? 'text-cream/70' : 'text-charcoal/40'
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-4 py-2 text-xs text-red-600 border-t border-border bg-cream">
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
          className="flex-1 min-w-0 px-4 py-2.5 bg-charcoal border border-cream/10 rounded-full text-cream placeholder:text-cream/40 focus:outline-none focus:border-teal transition-colors text-sm"
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
