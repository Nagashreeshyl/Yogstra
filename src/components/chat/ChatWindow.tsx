import { useState, type FormEvent } from 'react'
import { BadgeCheck, Send } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { useChatMessages } from '../../hooks/useChatMessages'
import { formatTime } from '../../utils/format'

interface ChatWindowProps {
  bookingId: string
  currentUserId: string
  participantName: string
  participantVerified?: boolean
  readOnly?: boolean
}

export function ChatWindow({
  bookingId,
  currentUserId,
  participantName,
  participantVerified,
  readOnly = false,
}: ChatWindowProps) {
  const { messages, loading, sending, error, bottomRef, send } = useChatMessages(
    bookingId,
    readOnly ? undefined : currentUserId,
  )
  const [draft, setDraft] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || sending) return
    const text = draft
    setDraft('')
    await send(text)
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-elevated rounded-[16px] border border-border overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-border bg-elevated shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-heading text-lg font-medium text-foreground">{participantName}</h2>
          {participantVerified && (
            <Badge variant="verified" className="flex items-center gap-1">
              <BadgeCheck size={12} />
              Verified
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 min-h-0">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Say hello to start the conversation.
          </p>
        ) : (
          messages.map((msg) => {
            const isSent = msg.senderId === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isSent ? 'ml-auto items-end' : 'items-start'}`}
              >
                <p className="text-[11px] text-muted-foreground/70 mb-1 px-1">
                  {formatTime(msg.createdAt)}
                </p>
                <div
                  className={`px-4 py-2.5 rounded-[12px] text-sm leading-relaxed ${
                    isSent
                      ? 'bg-primary text-white'
                      : 'bg-elevated text-foreground border border-border'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-4 sm:px-6 py-2 text-xs text-red-600 border-t border-red-100 bg-red-50">
          {error}
        </p>
      )}

      {!readOnly && (
        <form
          onSubmit={handleSubmit}
          className="px-4 sm:px-6 py-4 border-t border-border bg-elevated shrink-0 flex gap-2"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-w-0 px-4 py-2.5 bg-elevated rounded-[16px] border border-border text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary transition-colors text-sm"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-[12px] text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Send message"
          >
            <Send size={16} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      )}
    </div>
  )
}
