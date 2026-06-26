import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchTeacherConversations } from '../../services/messages'
import { ConversationList } from '../../components/chat/ConversationList'
import { ChatWindow } from '../../components/chat/ChatWindow'

export function TeacherMessagesPage() {
  const { user } = useApp()
  const { data: conversations, loading } = useAsyncData(
    () => (user ? fetchTeacherConversations(user.id) : Promise.resolve([])),
    [user?.id],
  )
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  useEffect(() => {
    if (conversations?.length && !selectedBookingId) {
      setSelectedBookingId(conversations[0].bookingId)
    }
  }, [conversations, selectedBookingId])

  const selected = conversations?.find((c) => c.bookingId === selectedBookingId)

  return (
    <div className="p-4 sm:p-8 h-full flex flex-col min-h-0">
      <h1 className="font-heading text-2xl sm:text-3xl font-medium mb-6 shrink-0">Messages</h1>

      {loading ? (
        <p className="text-charcoal/50 text-sm">Loading conversations...</p>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0 md:h-[calc(100vh-180px)]">
          <ConversationList
            conversations={conversations ?? []}
            selectedBookingId={selectedBookingId}
            onSelect={setSelectedBookingId}
            emptyMessage="No active students yet. Students will appear here once they book you."
          />

          {selectedBookingId && user && selected ? (
            <div className="flex-1 min-h-[420px] md:min-h-0">
              <ChatWindow
                bookingId={selectedBookingId}
                currentUserId={user.id}
                participantName={selected.participantName}
              />
            </div>
          ) : (
            !loading &&
            (conversations?.length ?? 0) > 0 && (
              <div className="flex-1 hidden md:flex items-center justify-center border border-border rounded-sm text-sm text-charcoal/50 bg-cream">
                Select a student to chat
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
