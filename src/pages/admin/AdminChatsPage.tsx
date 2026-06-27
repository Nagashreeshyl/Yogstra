import { useEffect, useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchChatConversations, subscribeToAdminChats } from '../../services/admin'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export function AdminChatsPage() {
  const { data: conversations, loading, error, refetch } = useAsyncData(() =>
    fetchChatConversations(),
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToAdminChats(() => {
      void refetch(true)
    })
    return unsubscribe
  }, [refetch])

  const selected =
    conversations?.find((c) => c.id === selectedId) ?? conversations?.[0] ?? null

  return (
    <div className="p-8 h-full">
      <h1 className="font-heading text-3xl font-medium mb-2">Chats</h1>
      <p className="text-sm text-charcoal/50 mb-8">
        Read-only view of all accepted conversations between users.
      </p>

      {loading && !conversations ? (
        <p className="text-charcoal/50">Loading conversations...</p>
      ) : error ? (
        <p className="text-sm text-red-600">
          Could not load chats. Run <code className="text-xs">supabase/chat-threads.sql</code> and{' '}
          <code className="text-xs">supabase/admin-chat-policies.sql</code> in Supabase.
        </p>
      ) : (conversations ?? []).length === 0 ? (
        <p className="text-charcoal/50">No conversations yet.</p>
      ) : (
        <div className="flex gap-6 h-[calc(100vh-220px)]">
          <div className="w-80 shrink-0 border border-border rounded-sm overflow-y-auto bg-cream">
            {conversations!.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left p-4 border-b border-border cursor-pointer hover:bg-cream-dark transition-colors ${
                  selected?.id === conv.id ? 'bg-teal-soft' : ''
                }`}
              >
                <p className="text-sm font-medium truncate">
                  {conv.participantOneName} ↔ {conv.participantTwoName}
                </p>
                <div className="flex gap-1 mt-1">
                  <Badge>{conv.participantOneRole}</Badge>
                  <Badge>{conv.participantTwoRole}</Badge>
                </div>
                <p className="text-xs text-charcoal/50 truncate mt-2">{conv.lastMessage}</p>
              </button>
            ))}
          </div>

          {selected && (
            <Card className="flex-1 flex flex-col overflow-hidden bg-cream-dark">
              <div className="px-6 py-4 border-b border-border bg-cream">
                <p className="font-medium">
                  {selected.participantOneName}{' '}
                  <span className="text-charcoal/40">↔</span>{' '}
                  {selected.participantTwoName}
                </p>
                <p className="text-xs text-charcoal/50 mt-0.5">Read-only · updates in real time</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-cream-dark">
                {selected.messages.length === 0 ? (
                  <p className="text-sm text-charcoal/50 text-center py-8">No messages in this thread.</p>
                ) : (
                  selected.messages.map((msg, i) => {
                    const isFirst = msg.sender === selected.participantOneName
                    return (
                      <div
                        key={i}
                        className={`flex ${isFirst ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className="max-w-[75%]">
                          <p className="text-[11px] text-charcoal/45 mb-1 px-1">
                            {msg.sender} · {msg.time}
                          </p>
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm ${
                              isFirst
                                ? 'bg-cream border border-border text-charcoal rounded-tl-sm'
                                : 'bg-teal text-cream rounded-tr-sm'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
