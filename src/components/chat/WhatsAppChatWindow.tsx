import { ArrowLeft, BadgeCheck, CornerUpLeft, Search, Send, ShoppingBag, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ChatWindowSkeleton } from '../ui/Skeleton'
import { useDirectChatMessages } from '../../hooks/useDirectChatMessages'
import { useActiveClassPurchase } from '../../hooks/useActiveClassPurchase'
import {
  deleteDirectMessageForBoth,
  deleteDirectMessageForMe,
  formatMessageDisplay,
  hideChatFromInbox,
  markThreadAsRead,
} from '../../services/directChat'
import { fetchThreadSettings, upsertThreadSettings, type ThreadSetting } from '../../services/chatSettings'
import { submitChatReport } from '../../services/reports'
import { formatTime } from '../../utils/format'
import { stripProfileTokens } from '../../utils/messageContent'
import { getChatParticipantProfilePath } from '../../utils/chatRoutes'
import { ChatActionModal } from './ChatActionModal'
import { ChatMessageContent } from './ChatMessageContent'
import { BuyClassModal } from './BuyClassModal'
import { ChatEphemeralToast } from './ChatEphemeralToast'
import { ChatMessageMenu } from './ChatMessageMenu'
import { ChatHeaderMenu, ReportChatModal } from './ReportChatModal'

interface WhatsAppChatWindowProps {
  threadId: string
  currentUserId: string
  participantId: string
  currentUserName: string
  participantName: string
  participantAvatar?: string
  participantVerified?: boolean
  participantRole?: 'student' | 'teacher'
  currentUserRole?: 'student' | 'teacher'
  onRead?: (threadId: string) => void
  onThreadHidden?: () => void
  onBack?: () => void
}

export function WhatsAppChatWindow({
  threadId,
  currentUserId,
  currentUserName,
  participantId,
  participantName,
  participantAvatar,
  participantVerified,
  participantRole = 'student',
  currentUserRole = 'student',
  onRead,
  onThreadHidden,
  onBack,
}: WhatsAppChatWindowProps) {
  const navigate = useNavigate()
  const { messages, loading, sending, error, bottomRef, send, reload } = useDirectChatMessages(
    threadId,
    currentUserId,
  )
  const [draft, setDraft] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [ephemeralNotice, setEphemeralNotice] = useState<string | null>(null)
  const [showDeleteChatConfirm, setShowDeleteChatConfirm] = useState(false)
  const [threadSettings, setThreadSettings] = useState<ThreadSetting>({
    muted: false,
    blocked: false,
    hidden: false,
  })
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null)

  const canBuyClass = currentUserRole === 'student' && participantRole === 'teacher'
  const { hasActivePurchase, refetchActivePurchase } = useActiveClassPurchase(
    currentUserId,
    participantId,
    canBuyClass,
  )

  const showBuyButton = canBuyClass && !hasActivePurchase
  const isBlocked = threadSettings.blocked

  const lastReadAt = messages.at(-1)?.createdAt

  useEffect(() => {
    if (loading || !threadId) return
    void markThreadAsRead(threadId, currentUserId, lastReadAt)
      .then(() => onRead?.(threadId))
      .catch(() => undefined)
  }, [threadId, currentUserId, loading, lastReadAt, onRead])

  useEffect(() => {
    setEphemeralNotice(null)
    setShowSearch(false)
    setSearchQuery('')
    setReplyTo(null)
    setShowDeleteChatConfirm(false)
    void fetchThreadSettings(threadId, currentUserId)
      .then(setThreadSettings)
      .catch(() => undefined)
  }, [threadId, currentUserId])

  const flashNotice = (notice: string) => setEphemeralNotice(notice)

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages
    const q = searchQuery.toLowerCase()
    return messages.filter((m) => m.content.toLowerCase().includes(q))
  }, [messages, searchQuery])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || sending || isBlocked) return
    let text = draft.trim()
    if (replyTo) {
      const preview = replyTo.content.slice(0, 120).replace(/\n/g, ' ')
      text = `↩ ${preview}${replyTo.content.length > 120 ? '…' : ''}\n${text}`
    }
    setDraft('')
    setReplyTo(null)
    await send(text)
  }

  const handleReport = async (reason: string) => {
    await submitChatReport({
      threadId,
      reporterId: currentUserId,
      reportedUserId: participantId,
      reason,
    })
    flashNotice('Report submitted. An admin will review this conversation.')
  }

  const patchSettings = async (patch: Partial<ThreadSetting>, notice: string) => {
    await upsertThreadSettings(threadId, currentUserId, patch)
    setThreadSettings((prev) => ({ ...prev, ...patch }))
    flashNotice(notice)
  }

  const handleToggleMute = async () => {
    const next = !threadSettings.muted
    await patchSettings({ muted: next }, next ? 'Conversation muted.' : 'Conversation unmuted.')
  }

  const handleToggleBlock = async () => {
    const next = !threadSettings.blocked
    await patchSettings(
      { blocked: next },
      next ? 'User blocked. Unblock from the menu to message again.' : 'User unblocked.',
    )
  }

  const confirmDeleteChat = async () => {
    setShowDeleteChatConfirm(false)
    try {
      await hideChatFromInbox(threadId, currentUserId)
      flashNotice('Chat deleted from your inbox.')
      onThreadHidden?.()
    } catch {
      flashNotice('Could not delete chat. Run supabase/chat-enhancements.sql in Supabase.')
    }
  }

  const profilePath = getChatParticipantProfilePath(
    participantId,
    participantRole,
    currentUserRole,
  )

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(stripProfileTokens(text))
      flashNotice('Message copied.')
    } catch {
      flashNotice('Could not copy message.')
    }
  }

  if (loading && messages.length === 0) {
    return <ChatWindowSkeleton />
  }

  return (
    <>
      <div className="flex flex-col flex-1 h-full min-h-0 bg-cream-dark md:border md:border-border md:rounded-sm overflow-hidden">
        <div
          className={`px-4 py-3 border-b border-cream/10 bg-charcoal shrink-0 flex items-center gap-2 min-w-0 ${
            onBack ? 'pt-[max(0.75rem,env(safe-area-inset-top))]' : ''
          }`}
        >
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-1.5 -ml-1 text-cream/70 hover:text-cream rounded-sm cursor-pointer shrink-0"
              aria-label="Back to conversations"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(profilePath)}
            className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer rounded-sm hover:bg-cream/5 transition-colors -m-1 p-1 overflow-hidden"
          >
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
                {threadSettings.muted && (
                  <span className="text-[10px] text-cream/40 uppercase tracking-wide">Muted</span>
                )}
              </div>
              <p className="text-xs text-cream/45 hidden sm:block">Tap to view profile</p>
            </div>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            {showBuyButton && (
              <Button
                size="sm"
                className="shrink-0 gap-1.5 h-8 px-3 text-xs"
                onClick={() => setShowBuyModal(true)}
              >
                <ShoppingBag size={14} />
                Buy
              </Button>
            )}
            <ChatHeaderMenu
              muted={threadSettings.muted}
              blocked={threadSettings.blocked}
              onReport={() => setShowReportModal(true)}
              onSearch={() => setShowSearch((v) => !v)}
              onToggleMute={() => void handleToggleMute()}
              onToggleBlock={() => void handleToggleBlock()}
              onDeleteChat={() => setShowDeleteChatConfirm(true)}
            />
          </div>
        </div>

        {showSearch && (
          <div className="px-4 py-3 shrink-0 bg-cream-dark">
            <div
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-sm"
              style={{ backgroundColor: '#2A3942' }}
            >
              <Search size={16} className="text-cream/45 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in chat..."
                className="flex-1 text-sm bg-transparent outline-none text-cream placeholder:text-cream/40"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery('')
                }}
                className="text-cream/45 hover:text-cream cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {isBlocked && (
          <p className="px-4 py-2 text-xs text-red-800 bg-red-50 border-b border-red-200 shrink-0">
            You blocked this user. Unblock from the menu to send messages.
          </p>
        )}

        <div className="relative flex-1 min-h-0 overflow-y-auto bg-cream-dark flex flex-col">
          <div className="mt-auto px-4 sm:px-5 py-4 space-y-4">
          <ChatEphemeralToast
            message={ephemeralNotice}
            onDismiss={() => setEphemeralNotice(null)}
          />
          {filteredMessages.length === 0 ? (
            searchQuery ? (
              <p className="text-sm text-charcoal/50 text-center py-8">
                No messages match your search.
              </p>
            ) : null
          ) : (
            filteredMessages.map((msg) => {
              const isSent = msg.senderId === currentUserId
              const display = formatMessageDisplay(
                msg,
                currentUserId,
                isSent ? currentUserName : participantName,
              )

              if (!display.text && !display.meta) return null

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1 py-0.5 group max-w-full ${
                    isSent ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {isSent && !msg.deletedAt && (
                    <ChatMessageMenu
                      isSent
                      canModify
                      onReply={() =>
                        setReplyTo({ id: msg.id, content: display.text || msg.content })
                      }
                      onCopy={() => void handleCopy(display.text || msg.content)}
                      onDeleteForMe={() =>
                        void deleteDirectMessageForMe(msg.id, currentUserId).then(reload)
                      }
                      onDeleteForEveryone={() =>
                        void deleteDirectMessageForBoth(msg.id, currentUserId).then(reload)
                      }
                    />
                  )}

                  <div
                    className={`relative w-fit max-w-[min(72vw,17.5rem)] sm:max-w-[17.5rem] min-w-[4.5rem] rounded-xl ${
                      msg.deleteScope === 'both'
                        ? 'bg-charcoal/5 border border-dashed border-charcoal/20 text-charcoal/50 italic'
                        : isSent
                          ? 'bg-teal text-cream'
                          : 'bg-cream border border-border text-charcoal shadow-sm'
                    }`}
                  >
                    <div className="px-3.5 py-2.5">
                      <p className="text-[15px] leading-[1.45] whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                        <ChatMessageContent
                          text={display.text}
                          isSent={isSent}
                          viewerRole={currentUserRole}
                        />
                      </p>
                      <div className="flex justify-end items-center gap-1.5 mt-1.5 -mb-0.5">
                        {display.meta && (
                          <span
                            className={`text-[10px] ${
                              isSent && msg.deleteScope !== 'both'
                                ? 'text-cream/55'
                                : 'text-charcoal/35'
                            }`}
                          >
                            {display.meta}
                          </span>
                        )}
                        <span
                          className={`text-[11px] shrink-0 ${
                            isSent && msg.deleteScope !== 'both'
                              ? 'text-cream/65'
                              : 'text-charcoal/40'
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isSent && !msg.deletedAt && (
                    <ChatMessageMenu
                      isSent={false}
                      canModify={false}
                      onReply={() =>
                        setReplyTo({ id: msg.id, content: display.text || msg.content })
                      }
                      onCopy={() => void handleCopy(display.text || msg.content)}
                      onDeleteForMe={() =>
                        void deleteDirectMessageForMe(msg.id, currentUserId).then(reload)
                      }
                      onDeleteForEveryone={() =>
                        void deleteDirectMessageForBoth(msg.id, currentUserId).then(reload)
                      }
                    />
                  )}
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
          </div>
        </div>

        {error && (
          <p className="px-4 py-2 text-xs text-red-600 border-t border-border bg-cream shrink-0">
            {error}
          </p>
        )}

        {replyTo && (
          <div className="px-3 py-2 border-t border-border bg-cream flex items-center gap-2 shrink-0">
            <CornerUpLeft size={16} className="text-teal shrink-0" />
            <p className="flex-1 text-xs text-charcoal/70 truncate border-l-2 border-teal pl-2">
              {replyTo.content}
            </p>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-charcoal/40 hover:text-charcoal cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`px-3 pt-2.5 border-t border-border bg-cream-dark shrink-0 flex items-center gap-2 ${
            onBack ? 'pb-[max(0.5rem,env(safe-area-inset-bottom))]' : 'pb-2.5'
          }`}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={isBlocked ? 'Unblock to message' : 'Type a message'}
            disabled={isBlocked}
            className="flex-1 min-w-0 px-4 py-2.5 bg-charcoal border border-cream/10 rounded-full text-cream placeholder:text-cream/40 focus:outline-none focus:border-teal transition-colors text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending || isBlocked}
            className="shrink-0 w-10 h-10 inline-flex items-center justify-center bg-teal text-cream rounded-full hover:bg-teal-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <ChatActionModal
        isOpen={showDeleteChatConfirm}
        title="Delete chat?"
        onClose={() => setShowDeleteChatConfirm(false)}
        actions={[
          {
            label: 'Delete chat',
            danger: true,
            onClick: () => void confirmDeleteChat(),
          },
          {
            label: 'Cancel',
            onClick: () => setShowDeleteChatConfirm(false),
          },
        ]}
      />

      <ReportChatModal
        isOpen={showReportModal}
        participantName={participantName}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
      />

      {canBuyClass && (
        <BuyClassModal
          isOpen={showBuyModal}
          onClose={() => {
            setShowBuyModal(false)
            void refetchActivePurchase(true)
          }}
          studentId={currentUserId}
          studentName={currentUserName}
          teacherId={participantId}
          teacherName={participantName}
          threadId={threadId}
        />
      )}
    </>
  )
}
