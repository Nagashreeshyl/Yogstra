import { useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchChatConversations } from '../../services/admin'
import { Card } from '../../components/ui/Card'

export function AdminChatsPage() {
  const { data: conversations, loading } = useAsyncData(() => fetchChatConversations())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = conversations?.find((c) => c.id === selectedId) ?? conversations?.[0]

  return (
    <div className="p-8 h-full">
      <h1 className="font-heading text-3xl font-medium mb-8">Chats</h1>

      {loading ? (
        <p className="text-charcoal/50">Loading conversations...</p>
      ) : (conversations ?? []).length === 0 ? (
        <p className="text-charcoal/50">No conversations yet.</p>
      ) : (
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          <div className="w-72 shrink-0 border border-border rounded-sm overflow-y-auto">
            {conversations!.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left p-4 border-b border-border cursor-pointer hover:bg-cream-dark transition-colors ${
                  selected?.id === conv.id ? 'bg-teal-soft' : ''
                }`}
              >
                <p className="text-sm font-medium">{conv.teacherName} ↔ {conv.studentName}</p>
                <p className="text-xs text-charcoal/50 truncate mt-1">{conv.lastMessage}</p>
              </button>
            ))}
          </div>

          {selected && (
            <Card className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <p className="font-medium">{selected.teacherName} & {selected.studentName}</p>
                <p className="text-xs text-charcoal/50 mt-0.5">Read-only view</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selected.messages.map((msg, i) => (
                  <div key={i} className={`max-w-[70%] ${msg.sender === selected.teacherName ? 'ml-auto text-right' : ''}`}>
                    <p className="text-xs text-charcoal/50 mb-1">{msg.sender} · {msg.time}</p>
                    <div className={`inline-block px-4 py-2 rounded-sm text-sm ${
                      msg.sender === selected.teacherName ? 'bg-teal-soft' : 'bg-cream-dark border border-border'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
