import { useCallback, useEffect, useState } from 'react'
import { Clock, MessageCircle, UserPlus } from 'lucide-react'
import type { MessagingUser } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { ChatWindowSkeleton } from '../ui/Skeleton'
import { WhatsAppChatWindow } from './WhatsAppChatWindow'
import { EmptyChatPanel } from './EmptyChatPanel'
import { ChatMobileBackBar } from './ChatMobileBackBar'
import {
  ensureDirectChat,
  fetchDirectChatThread,
  formatChatError,
  invalidateMessagingCache,
  requestChat,
  requiresChatRequest,
  respondToChatRequest,
  subscribeToThreadUpdates,
} from '../../services/directChat'
import { fetchHiddenThreadIds, upsertThreadSettings } from '../../services/chatSettings'

interface DirectChatPanelProps {
  user: MessagingUser
  currentUserId: string
  currentUserName: string
  currentUserRole: 'student' | 'teacher'
  onThreadChange: () => void
  onRead?: (threadId: string) => void
  onThreadHidden?: () => void
  onBack?: () => void
}

export function DirectChatPanel({
  user,
  currentUserId,
  currentUserName,
  currentUserRole,
  onThreadChange,
  onRead,
  onThreadHidden,
  onBack,
}: DirectChatPanelProps) {
  const [localUser, setLocalUser] = useState(user)
  const [requesting, setRequesting] = useState(false)
  const [responding, setResponding] = useState(false)
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsRequest = requiresChatRequest(currentUserRole, localUser.role)

  useEffect(() => {
    setLocalUser(user)
    setError(null)
  }, [user])

  useEffect(() => {
    const unsubscribe = subscribeToThreadUpdates(currentUserId, () => {
      onThreadChange()
    })
    return unsubscribe
  }, [currentUserId, onThreadChange])

  const loadThreadMetadata = useCallback(async () => {
    setOpening(true)
    setError(null)
    try {
      const hiddenIds = await fetchHiddenThreadIds(currentUserId).catch(() => new Set<string>())

      if (needsRequest) {
        const existing = await fetchDirectChatThread(currentUserId, localUser.id)
        if (!existing) return

        setLocalUser((prev) => ({
          ...prev,
          threadId: existing.threadId,
          threadStatus: existing.status,
          requestedBy: existing.requestedBy,
          threadHidden: hiddenIds.has(existing.threadId),
        }))
        return
      }

      const result = await ensureDirectChat(currentUserId, localUser.id)
      setLocalUser((prev) => ({
        ...prev,
        threadId: result.threadId,
        threadStatus: result.status,
        threadHidden: hiddenIds.has(result.threadId),
      }))
      onThreadChange()
    } catch (err) {
      setError(formatChatError(err))
    } finally {
      setOpening(false)
    }
  }, [currentUserId, localUser.id, needsRequest, onThreadChange])

  useEffect(() => {
    if (localUser.threadId && localUser.threadStatus) return
    void loadThreadMetadata()
  }, [localUser.id, localUser.threadId, localUser.threadStatus, loadThreadMetadata])

  const isHidden = Boolean(user.threadHidden || localUser.threadHidden)
  const isAccepted = localUser.threadStatus === 'accepted'
  const canMessage = isAccepted && Boolean(localUser.threadId)
  const isIncoming =
    needsRequest &&
    localUser.threadStatus === 'pending' &&
    localUser.requestedBy !== currentUserId
  const isOutgoing =
    needsRequest &&
    localUser.threadStatus === 'pending' &&
    localUser.requestedBy === currentUserId
  const isRejected = needsRequest && localUser.threadStatus === 'rejected'
  const hasNoThread = !localUser.threadId

  const handleConversationStarted = (threadId: string) => {
    setLocalUser((prev) => ({
      ...prev,
      threadId,
      threadStatus: 'accepted',
      threadHidden: false,
    }))
    onThreadChange()
  }

  const handleRequest = async () => {
    setRequesting(true)
    setError(null)
    try {
      const result = await requestChat(currentUserId, localUser.id)

      if (result.status === 'accepted') {
        await upsertThreadSettings(result.threadId, currentUserId, { hidden: false }).catch(
          () => {},
        )
        setLocalUser((prev) => ({
          ...prev,
          threadId: result.threadId,
          threadStatus: 'accepted',
          threadHidden: false,
        }))
      } else {
        setLocalUser((prev) => ({
          ...prev,
          threadId: result.threadId,
          threadStatus: result.status,
          requestedBy: currentUserId,
          threadHidden: false,
        }))
      }
      onThreadChange()
    } catch (err) {
      setError(formatChatError(err))
    } finally {
      setRequesting(false)
    }
  }

  const handleRespond = async (accept: boolean) => {
    if (!localUser.threadId) return
    setResponding(true)
    setError(null)
    try {
      const status = await respondToChatRequest(localUser.threadId, currentUserId, accept)
      invalidateMessagingCache()
      setLocalUser((prev) => ({ ...prev, threadStatus: status, threadHidden: false }))
      onThreadChange()
    } catch (err) {
      setError(formatChatError(err))
    } finally {
      setResponding(false)
    }
  }

  if (!needsRequest && opening) {
    return (
      <div className="flex flex-col h-full min-h-0 flex-1">
        <ChatMobileBackBar onBack={onBack} />
        <ChatWindowSkeleton />
      </div>
    )
  }

  if (canMessage && isHidden) {
    return (
      <EmptyChatPanel
        currentUserId={currentUserId}
        participantId={localUser.id}
        participantName={localUser.name}
        participantAvatar={localUser.avatar}
        participantVerified={localUser.verified}
        participantRole={localUser.role}
        currentUserRole={currentUserRole}
        onConversationStarted={handleConversationStarted}
        onBack={onBack}
      />
    )
  }

  if (canMessage && !isHidden) {
    return (
      <div className="h-full min-h-0 flex flex-col flex-1">
        <WhatsAppChatWindow
        threadId={localUser.threadId!}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        participantId={localUser.id}
        participantName={localUser.name}
        participantAvatar={localUser.avatar}
        participantVerified={localUser.verified}
        participantRole={localUser.role}
        currentUserRole={currentUserRole}
        onRead={onRead}
        onThreadHidden={onThreadHidden}
        onBack={onBack}
      />
      </div>
    )
  }

  if (!needsRequest && !opening && !canMessage) {
    return (
      <EmptyChatPanel
        currentUserId={currentUserId}
        participantId={localUser.id}
        participantName={localUser.name}
        participantAvatar={localUser.avatar}
        participantVerified={localUser.verified}
        participantRole={localUser.role}
        currentUserRole={currentUserRole}
        onConversationStarted={handleConversationStarted}
        onBack={onBack}
      />
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 bg-cream md:border md:border-border md:rounded-sm overflow-hidden">
      <ChatMobileBackBar onBack={onBack} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center min-h-0 overflow-y-auto">
        <Avatar src={localUser.avatar} name={localUser.name} size={80} />
        <h2 className="text-base font-semibold mt-4">{localUser.name}</h2>
        <p className="text-sm text-charcoal/50 capitalize mt-0.5">{localUser.role}</p>

        {needsRequest && hasNoThread && (
          <>
            <p className="text-sm text-charcoal/60 mt-6 max-w-xs leading-relaxed">
              Send a chat request. {localUser.name.split(' ')[0]} must accept before you can message
              each other.
            </p>
            <Button
              onClick={() => void handleRequest()}
              disabled={requesting}
              className="mt-6 gap-2"
            >
              <UserPlus size={16} />
              {requesting ? 'Sending...' : 'Send Chat Request'}
            </Button>
          </>
        )}

        {isOutgoing && (
          <>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber-800 bg-amber-100 px-3 py-1.5 rounded-full">
              <Clock size={16} />
              Request sent
            </div>
            <p className="text-sm text-charcoal/45 mt-3 max-w-xs">
              Waiting for {localUser.name.split(' ')[0]} to accept your request.
            </p>
          </>
        )}

        {isIncoming && (
          <>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-teal bg-teal-soft px-3 py-1.5 rounded-full">
              <MessageCircle size={16} />
              New chat request
            </div>
            <p className="text-sm text-charcoal/60 mt-3 max-w-xs leading-relaxed">
              {localUser.name} wants to chat with you.
            </p>
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => void handleRespond(false)}
                disabled={responding}
              >
                Decline
              </Button>
              <Button onClick={() => void handleRespond(true)} disabled={responding}>
                {responding ? 'Accepting...' : 'Accept'}
              </Button>
            </div>
          </>
        )}

        {isRejected && (
          <>
            <p className="text-sm text-charcoal/50 mt-6 max-w-xs">
              Chat request was declined. You can send a new request.
            </p>
            <Button
              onClick={() => void handleRequest()}
              disabled={requesting}
              className="mt-4 gap-2"
            >
              <UserPlus size={16} />
              Send Request Again
            </Button>
          </>
        )}

        {needsRequest && error && (
          <p className="text-sm text-red-600 mt-4 max-w-sm leading-relaxed border border-red-200 bg-red-50 px-4 py-3 rounded-sm">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
