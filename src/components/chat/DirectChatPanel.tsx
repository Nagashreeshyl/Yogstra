import { useEffect, useState } from 'react'
import { Clock, MessageCircle, UserPlus } from 'lucide-react'
import type { MessagingUser } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { WhatsAppChatWindow } from './WhatsAppChatWindow'
import {
  ensureDirectChat,
  requestChat,
  requiresChatRequest,
  respondToChatRequest,
  subscribeToThreadUpdates,
} from '../../services/directChat'

interface DirectChatPanelProps {
  user: MessagingUser
  currentUserId: string
  currentUserRole: 'student' | 'teacher'
  onThreadChange: () => void
  onRead?: (threadId: string) => void
}

export function DirectChatPanel({
  user,
  currentUserId,
  currentUserRole,
  onThreadChange,
  onRead,
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

  useEffect(() => {
    if (needsRequest) return
    if (localUser.threadId && localUser.threadStatus === 'accepted') return

    let cancelled = false
    setOpening(true)
    setError(null)

    ensureDirectChat(currentUserId, localUser.id)
      .then((result) => {
        if (cancelled) return
        setLocalUser((prev) => ({
          ...prev,
          threadId: result.threadId,
          threadStatus: result.status,
        }))
        onThreadChange()
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not open chat. Run supabase/chat-threads.sql if this is a new setup.')
        }
      })
      .finally(() => {
        if (!cancelled) setOpening(false)
      })

    return () => {
      cancelled = true
    }
  }, [needsRequest, localUser.id, localUser.threadId, localUser.threadStatus, currentUserId, onThreadChange])

  const isIncoming =
    needsRequest &&
    localUser.threadStatus === 'pending' &&
    localUser.requestedBy !== currentUserId
  const isOutgoing =
    needsRequest &&
    localUser.threadStatus === 'pending' &&
    localUser.requestedBy === currentUserId
  const isAccepted = localUser.threadStatus === 'accepted'
  const isRejected = needsRequest && localUser.threadStatus === 'rejected'
  const hasNoThread = !localUser.threadId

  const handleRequest = async () => {
    setRequesting(true)
    setError(null)
    try {
      const result = await requestChat(currentUserId, localUser.id)
      setLocalUser((prev) => ({
        ...prev,
        threadId: result.threadId,
        threadStatus: result.status,
        requestedBy: currentUserId,
      }))
      onThreadChange()
    } catch {
      setError('Could not send chat request.')
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
      setLocalUser((prev) => ({ ...prev, threadStatus: status }))
      onThreadChange()
    } catch {
      setError('Could not update chat request.')
    } finally {
      setResponding(false)
    }
  }

  if (!needsRequest && opening) {
    return (
      <div className="flex flex-col h-full min-h-[420px] bg-cream border border-border rounded-sm items-center justify-center">
        <p className="text-sm text-charcoal/50">Opening chat...</p>
      </div>
    )
  }

  if (isAccepted && localUser.threadId) {
    return (
      <WhatsAppChatWindow
        threadId={localUser.threadId}
        currentUserId={currentUserId}
        participantName={localUser.name}
        participantAvatar={localUser.avatar}
        participantVerified={localUser.verified}
        onRead={onRead}
      />
    )
  }

  return (
    <div className="flex flex-col h-full min-h-[420px] bg-cream border border-border rounded-sm overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
        <Avatar src={localUser.avatar} name={localUser.name} size={80} />
        <h2 className="text-base font-semibold mt-4">{localUser.name}</h2>
        <p className="text-sm text-charcoal/50 capitalize mt-0.5">{localUser.role}</p>

        {hasNoThread && (
          <>
            <p className="text-sm text-charcoal/60 mt-6 max-w-xs leading-relaxed">
              Send a chat request. {localUser.name.split(' ')[0]} needs to accept before you can message each other.
            </p>
            <Button
              onClick={() => void handleRequest()}
              disabled={requesting}
              className="mt-6 gap-2"
            >
              <UserPlus size={16} />
              {requesting ? 'Sending...' : 'Request to chat'}
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
              Request again
            </Button>
          </>
        )}

        {error && (
          <p className="text-xs text-red-600 mt-4 max-w-sm">{error}</p>
        )}
      </div>
    </div>
  )
}
