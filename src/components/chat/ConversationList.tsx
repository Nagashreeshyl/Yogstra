import type { MessageConversation } from '../../types'
import { formatRelativeDate } from '../../utils/format'

interface ConversationListProps {
  conversations: MessageConversation[]
  selectedBookingId: string | null
  onSelect: (bookingId: string) => void
  emptyMessage: string
}

export function ConversationList({
  conversations,
  selectedBookingId,
  onSelect,
  emptyMessage,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-[16px] border border-border p-6 text-sm text-muted-foreground bg-elevated">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-border overflow-hidden bg-elevated shrink-0 w-full md:w-72">
      {conversations.map((conv) => (
        <button
          key={conv.bookingId}
          type="button"
          onClick={() => onSelect(conv.bookingId)}
          className={`w-full text-left px-4 py-4 border-b border-border last:border-b-0 cursor-pointer transition-colors hover:bg-muted ${
            selectedBookingId === conv.bookingId ? 'bg-primary/10' : ''
          }`}
        >
          <p className="text-sm font-medium text-foreground truncate">{conv.participantName}</p>
          {conv.lastMessage ? (
            <>
              <p className="text-xs text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
              {conv.lastMessageAt && (
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  {formatRelativeDate(conv.lastMessageAt)}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground/70 mt-1">No messages yet</p>
          )}
        </button>
      ))}
    </div>
  )
}
