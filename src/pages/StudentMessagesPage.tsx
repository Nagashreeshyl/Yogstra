import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { fetchStudentConversation } from '../services/messages'
import { ConversationList } from '../components/chat/ConversationList'
import { ChatWindow } from '../components/chat/ChatWindow'

export function StudentMessagesPage() {
  const { user } = useApp()
  const { data: conversation, loading } = useAsyncData(
    () => (user ? fetchStudentConversation(user.id) : Promise.resolve(null)),
    [user?.id],
  )
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  useEffect(() => {
    if (conversation?.bookingId) {
      setSelectedBookingId(conversation.bookingId)
    }
  }, [conversation?.bookingId])

  const conversations = conversation ? [conversation] : []

  return (
    <div className="p-4 sm:p-8 h-full flex flex-col min-h-0">
      <h1 className="font-heading text-2xl sm:text-3xl font-medium mb-6 shrink-0">Messages</h1>

      {loading ? (
        <p className="text-charcoal/50 text-sm">Loading conversations...</p>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0 md:h-[calc(100vh-180px)]">
          <ConversationList
            conversations={conversations}
            selectedBookingId={selectedBookingId}
            onSelect={setSelectedBookingId}
            emptyMessage="You do not have an active teacher booking. Book a teacher to start messaging."
          />

          {selectedBookingId && user && conversation ? (
            <div className="flex-1 min-h-[420px] md:min-h-0">
              <ChatWindow
                bookingId={selectedBookingId}
                currentUserId={user.id}
                participantName={conversation.participantName}
                participantVerified={conversation.participantVerified}
              />
            </div>
          ) : (
            !loading &&
            conversations.length > 0 && (
              <div className="flex-1 hidden md:flex items-center justify-center border border-border rounded-sm text-sm text-charcoal/50 bg-cream">
                Select a conversation
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
