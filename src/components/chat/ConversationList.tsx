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
      <div className="border border-border rounded-sm p-6 text-sm text-charcoal/50 bg-cream">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="border border-border rounded-sm overflow-hidden bg-cream shrink-0 w-full md:w-72">
      {conversations.map((conv) => (
        <button
          key={conv.bookingId}
          type="button"
          onClick={() => onSelect(conv.bookingId)}
          className={`w-full text-left px-4 py-4 border-b border-border last:border-b-0 cursor-pointer transition-colors hover:bg-cream-dark ${
            selectedBookingId === conv.bookingId ? 'bg-teal-soft' : ''
          }`}
        >
          <p className="text-sm font-medium text-charcoal truncate">{conv.participantName}</p>
          {conv.lastMessage ? (
            <>
              <p className="text-xs text-charcoal/50 truncate mt-1">{conv.lastMessage}</p>
              {conv.lastMessageAt && (
                <p className="text-[11px] text-charcoal/40 mt-1">
                  {formatRelativeDate(conv.lastMessageAt)}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-charcoal/40 mt-1">No messages yet</p>
          )}
        </button>
      ))}
    </div>
  )
}
