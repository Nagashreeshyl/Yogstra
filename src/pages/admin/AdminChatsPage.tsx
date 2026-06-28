import { useCallback, useEffect, useState } from 'react'
import { Flag } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  fetchReportHistory,
  fetchReportedChatConversations,
  formatReportDate,
  markChatReportReviewed,
  subscribeToChatReports,
} from '../../services/reports'
import { subscribeToAdminChats } from '../../services/admin'
import { formatChatError } from '../../services/directChat'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { AdminChatSkeleton } from '../../components/ui/Skeleton'

type Tab = 'open' | 'history'

export function AdminChatsPage() {
  const { user } = useApp()
  const [tab, setTab] = useState<Tab>('open')
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState(false)

  const { data: openReports, loading: openLoading, error: openError, refetch: refetchOpen } =
    useAsyncData(() => fetchReportedChatConversations(), [tab])

  const { data: historyReports, loading: historyLoading, refetch: refetchHistory } = useAsyncData(
    () => (tab === 'history' ? fetchReportHistory() : Promise.resolve([])),
    [tab],
  )

  const conversations = tab === 'open' ? openReports : historyReports
  const loading = tab === 'open' ? openLoading : historyLoading
  const error = openError

  const refetch = useCallback(() => {
    void refetchOpen(true)
    void refetchHistory(true)
  }, [refetchOpen, refetchHistory])

  useEffect(() => {
    const refresh = () => refetch()
    const unsubMessages = subscribeToAdminChats(refresh)
    const unsubReports = subscribeToChatReports(refresh)
    return () => {
      unsubMessages()
      unsubReports()
    }
  }, [refetch])

  const selected =
    conversations?.find((c) => c.reportId === selectedReportId) ?? conversations?.[0] ?? null

  const handleReviewed = async () => {
    if (!selected?.reportId || !user) return
    setReviewing(true)
    try {
      await markChatReportReviewed(selected.reportId, user.id)
      setSelectedReportId(null)
      refetch()
    } finally {
      setReviewing(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col min-h-0">
      <h1 className="font-heading text-2xl sm:text-3xl font-medium mb-2">Reported Chats</h1>
      <p className="text-sm text-charcoal/50 mb-6 max-w-2xl">
        Conversations appear here only when reported. Snapshots include deleted messages.
      </p>

      <div className="flex gap-1 mb-6 border-b border-border">
        {(['open', 'history'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize cursor-pointer border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-teal text-charcoal'
                : 'border-transparent text-charcoal/45 hover:text-charcoal/70'
            }`}
          >
            {t === 'open' ? 'Open reports' : 'Report history'}
          </button>
        ))}
      </div>

      {loading && !conversations ? (
        <AdminChatSkeleton />
      ) : error ? (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3 rounded-sm max-w-xl">
          {formatChatError({ message: error })}
        </p>
      ) : (conversations ?? []).length === 0 ? (
        <div className="border border-border rounded-sm p-10 text-center max-w-lg bg-surface-muted">
          <Flag size={32} className="mx-auto text-charcoal/25 mb-3" />
          <p className="text-charcoal/70 font-medium">
            {tab === 'open' ? 'No open reports' : 'No report history yet'}
          </p>
          <p className="text-sm text-charcoal/45 mt-2">
            {tab === 'open'
              ? 'When a user reports a chat, it will appear here with the full conversation snapshot.'
              : 'Reviewed reports will appear in this history.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0 md:h-[calc(100vh-260px)]">
          <div
            className={`w-full md:w-80 shrink-0 border border-border rounded-sm overflow-y-auto bg-cream max-h-[40vh] md:max-h-none ${
              selectedReportId ? 'hidden md:block' : 'block'
            }`}
          >
            {conversations!.map((conv) => (
              <button
                key={conv.reportId}
                type="button"
                onClick={() => setSelectedReportId(conv.reportId)}
                className={`w-full text-left p-4 border-b border-border cursor-pointer hover:bg-cream-dark transition-colors ${
                  selected?.reportId === conv.reportId ? 'bg-teal-soft' : ''
                }`}
              >
                <p className="text-sm font-medium truncate">
                  {conv.participantOneName} ↔ {conv.participantTwoName}
                </p>
                <div className="flex gap-1 mt-1">
                  <Badge>{conv.participantOneRole}</Badge>
                  <Badge>{conv.participantTwoRole}</Badge>
                </div>
                <p className="text-xs text-red-700/80 truncate mt-2 flex items-center gap-1">
                  <Flag size={12} />
                  {conv.reportReason}
                </p>
                <p className="text-[10px] text-charcoal/40 mt-1">
                  {conv.reporterName} · {formatReportDate(conv.reportedAt)}
                </p>
              </button>
            ))}
          </div>

          {selected && (
            <Card className={`flex-1 flex flex-col overflow-hidden bg-cream-dark min-h-[50vh] md:min-h-0 ${selectedReportId ? 'flex' : 'hidden md:flex'}`}>
              <div className="px-4 sm:px-6 py-4 border-b border-border bg-cream space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setSelectedReportId(null)}
                      className="md:hidden mb-2 text-sm text-teal font-medium cursor-pointer"
                    >
                      ← Back to list
                    </button>
                    <p className="font-medium">
                      {selected.participantOneName}{' '}
                      <span className="text-charcoal/40">↔</span>{' '}
                      {selected.participantTwoName}
                    </p>
                    <p className="text-xs text-charcoal/50 mt-0.5">
                      Reported by {selected.reporterName} · {formatReportDate(selected.reportedAt)}
                    </p>
                  </div>
                  {tab === 'open' && (
                    <button
                      type="button"
                      onClick={() => void handleReviewed()}
                      disabled={reviewing}
                      className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white rounded-sm cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: '#72B1C1' }}
                    >
                      {reviewing ? 'Saving...' : 'Report Reviewed'}
                    </button>
                  )}
                </div>
                <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-800 mb-1">
                    Report reason
                  </p>
                  <p className="text-sm text-red-900 leading-relaxed">{selected.reportReason}</p>
                </div>
                {selected.reviewedAt && (
                  <p className="text-xs text-charcoal/45">
                    Reviewed {formatReportDate(selected.reviewedAt)}
                  </p>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-cream-dark">
                {selected.messages.length === 0 ? (
                  <p className="text-sm text-charcoal/50 text-center py-8">
                    No messages in snapshot.
                  </p>
                ) : (
                  selected.messages.map((msg, i) => {
                    const isTeacher = msg.senderRole === 'teacher'
                    const isDeleted = msg.deleteScope === 'both'
                    return (
                      <div
                        key={i}
                        className={`flex ${isTeacher ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className="max-w-[75%]">
                          <p className="text-[11px] text-charcoal/45 mb-1 px-1">
                            {msg.sender}
                            <span className="mx-1">·</span>
                            <span className="capitalize">{msg.senderRole}</span>
                            <span className="mx-1">·</span>
                            {msg.time}
                            {msg.editedAt && <span className="ml-1">· edited</span>}
                          </p>
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm ${
                              isDeleted
                                ? 'border border-dashed border-charcoal/25 text-charcoal/50 italic bg-charcoal/5'
                                : isTeacher
                                  ? 'bg-teal text-cream rounded-tl-sm'
                                  : 'bg-cream border border-border text-charcoal rounded-tr-sm'
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
