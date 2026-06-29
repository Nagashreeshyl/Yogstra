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
import { PageHeader } from '../../components/shell/PageHeader'
import { EmptyState } from '../../components/shell/EmptyState'
import { ErrorState } from '../../components/shell/ErrorState'
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
    <div className="space-y-6 h-full flex flex-col min-h-0">
      <PageHeader
        title="Reported Chats"
        description="Conversations appear here only when reported. Snapshots include deleted messages."
      />

      <div className="flex gap-1 mb-6 border-b border-border">
        {(['open', 'history'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize cursor-pointer border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground/70 hover:text-muted-foreground'
            }`}
          >
            {t === 'open' ? 'Open reports' : 'Report history'}
          </button>
        ))}
      </div>

      {loading && !conversations ? (
        <AdminChatSkeleton />
      ) : error ? (
        <ErrorState message={formatChatError({ message: error })} onRetry={refetch} />
      ) : (conversations ?? []).length === 0 ? (
        <EmptyState
          icon={<Flag size={24} />}
          title={tab === 'open' ? 'No open reports' : 'No report history yet'}
          description={
            tab === 'open'
              ? 'When a user reports a chat, it will appear here with the full conversation snapshot.'
              : 'Reviewed reports will appear in this history.'
          }
        />
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0 md:h-[calc(100vh-260px)]">
          <div
            className={`w-full md:w-80 shrink-0 rounded-[16px] border border-border overflow-y-auto bg-elevated max-h-[40vh] md:max-h-none ${
              selectedReportId ? 'hidden md:block' : 'block'
            }`}
          >
            {conversations!.map((conv) => (
              <button
                key={conv.reportId}
                type="button"
                onClick={() => setSelectedReportId(conv.reportId)}
                className={`w-full text-left p-4 border-b border-border cursor-pointer hover:bg-muted transition-colors ${
                  selected?.reportId === conv.reportId ? 'bg-primary/10' : ''
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
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  {conv.reporterName} · {formatReportDate(conv.reportedAt)}
                </p>
              </button>
            ))}
          </div>

          {selected && (
            <Card className={`flex-1 flex flex-col overflow-hidden bg-muted min-h-[50vh] md:min-h-0 ${selectedReportId ? 'flex' : 'hidden md:flex'}`}>
              <div className="px-4 sm:px-6 py-4 border-b border-border bg-elevated space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setSelectedReportId(null)}
                      className="md:hidden mb-2 text-sm text-primary font-medium cursor-pointer"
                    >
                      ← Back to list
                    </button>
                    <p className="font-medium">
                      {selected.participantOneName}{' '}
                      <span className="text-muted-foreground/70">↔</span>{' '}
                      {selected.participantTwoName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Reported by {selected.reporterName} · {formatReportDate(selected.reportedAt)}
                    </p>
                  </div>
                  {tab === 'open' && (
                    <button
                      type="button"
                      onClick={() => void handleReviewed()}
                      disabled={reviewing}
                      className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white rounded-[12px] cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
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
                  <p className="text-xs text-muted-foreground/70">
                    Reviewed {formatReportDate(selected.reviewedAt)}
                  </p>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-muted">
                {selected.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
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
                          <p className="text-[11px] text-muted-foreground/70 mb-1 px-1">
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
                                ? 'border border-dashed border-charcoal/25 text-muted-foreground italic bg-sidebar/5'
                                : isTeacher
                                  ? 'bg-primary text-primary-foreground rounded-tl-sm'
                                  : 'bg-elevated border border-border text-foreground rounded-tr-sm'
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
