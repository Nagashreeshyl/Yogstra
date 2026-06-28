import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useApp } from '../../context/AppContext'
import { useAppIntervalRefresh } from '../../hooks/useIntervalRefresh'
import {
  createDirectVideoCall,
  fetchDirectVideoCall,
  fetchIncomingRingingCall,
  fetchUserActiveDirectCall,
  subscribeToDirectVideoCallById,
  subscribeToDirectVideoCalls,
  updateDirectVideoCallStatus,
  type DirectVideoCall,
  type DirectVideoCallStatus,
} from '../../services/directVideoCalls'
import { ChatVideoCallRingOverlay } from './ChatVideoCallRingOverlay'
import { DirectVideoCallRoom } from './DirectVideoCallRoom'

const OUTGOING_RING_MS = 45_000

type DirectVideoCallContextValue = {
  startCall: (params: {
    threadId: string
    calleeId: string
    calleeName: string
    calleeAvatar?: string
  }) => Promise<void>
  callBusy: boolean
}

const DirectVideoCallContext = createContext<DirectVideoCallContextValue | null>(null)

export function useDirectVideoCall() {
  const ctx = useContext(DirectVideoCallContext)
  if (!ctx) {
    throw new Error('useDirectVideoCall must be used within DirectVideoCallProvider')
  }
  return ctx
}

export function DirectVideoCallProvider({ children }: { children: ReactNode }) {
  const { user } = useApp()
  const [incomingCall, setIncomingCall] = useState<DirectVideoCall | null>(null)
  const [outgoingCall, setOutgoingCall] = useState<DirectVideoCall | null>(null)
  const [activeCall, setActiveCall] = useState<DirectVideoCall | null>(null)
  const [callNotice, setCallNotice] = useState<string | null>(null)
  const outgoingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearOutgoingTimer = () => {
    if (outgoingTimerRef.current) {
      clearTimeout(outgoingTimerRef.current)
      outgoingTimerRef.current = null
    }
  }

  const refreshCalls = useCallback(async () => {
    if (!user || (user.role !== 'student' && user.role !== 'teacher')) {
      setIncomingCall(null)
      if (!activeCall) setOutgoingCall(null)
      return
    }

    if (activeCall) return

    const incoming = await fetchIncomingRingingCall(user.id)
    setIncomingCall(incoming)

    const active = await fetchUserActiveDirectCall(user.id)
    if (active?.status === 'active') {
      setActiveCall(active)
      setOutgoingCall(null)
      setIncomingCall(null)
      return
    }

    if (active?.status === 'ringing' && active.callerId === user.id) {
      setOutgoingCall((prev) => prev ?? active)
    }
  }, [user, activeCall])

  useEffect(() => {
    void refreshCalls()
  }, [refreshCalls])

  useEffect(() => {
    if (!user || (user.role !== 'student' && user.role !== 'teacher')) return
    return subscribeToDirectVideoCalls(user.id, () => {
      void refreshCalls()
    })
  }, [user, refreshCalls])

  useAppIntervalRefresh(() => {
    void refreshCalls()
  }, Boolean(user && (user.role === 'student' || user.role === 'teacher') && !activeCall))

  useEffect(() => {
    if (!outgoingCall || outgoingCall.callerId !== user?.id) {
      clearOutgoingTimer()
      return
    }

    clearOutgoingTimer()
    outgoingTimerRef.current = setTimeout(() => {
      void updateDirectVideoCallStatus(outgoingCall.id, 'missed', {
        endedAt: new Date().toISOString(),
      }).then(() => {
        setOutgoingCall(null)
        setCallNotice('No answer')
      })
    }, OUTGOING_RING_MS)

    const unsub = subscribeToDirectVideoCallById(outgoingCall.id, (call) => {
      if (call.status === 'active') {
        clearOutgoingTimer()
        setOutgoingCall(null)
        setActiveCall(call)
      } else if (call.status === 'declined') {
        clearOutgoingTimer()
        setOutgoingCall(null)
        setCallNotice('Call declined')
      } else if (call.status === 'missed' || call.status === 'ended') {
        clearOutgoingTimer()
        setOutgoingCall(null)
      }
    })

    return () => {
      clearOutgoingTimer()
      unsub()
    }
  }, [outgoingCall, user?.id])

  const startCall = useCallback(
    async (params: {
      threadId: string
      calleeId: string
      calleeName: string
      calleeAvatar?: string
    }) => {
      if (!user) return
      if (activeCall || outgoingCall || incomingCall) {
        setCallNotice('Already on a call')
        return
      }

      setCallNotice(null)
      const call = await createDirectVideoCall({
        threadId: params.threadId,
        callerId: user.id,
        calleeId: params.calleeId,
      })
      setOutgoingCall(call)
    },
    [user, activeCall, outgoingCall, incomingCall],
  )

  const handleAcceptIncoming = async () => {
    if (!incomingCall) return
    await updateDirectVideoCallStatus(incomingCall.id, 'active', {
      startedAt: new Date().toISOString(),
    })
    const fresh = await fetchDirectVideoCall(incomingCall.id)
    setIncomingCall(null)
    if (fresh) setActiveCall(fresh)
  }

  const handleDeclineIncoming = async () => {
    if (!incomingCall) return
    await updateDirectVideoCallStatus(incomingCall.id, 'declined', {
      endedAt: new Date().toISOString(),
    })
    setIncomingCall(null)
  }

  const handleCancelOutgoing = async () => {
    if (!outgoingCall) return
    await updateDirectVideoCallStatus(outgoingCall.id, 'ended', {
      endedAt: new Date().toISOString(),
    })
    setOutgoingCall(null)
  }

  const handleLeaveCall = () => {
    setActiveCall(null)
    void refreshCalls()
  }

  const handleRemoteEnd = (status: DirectVideoCallStatus) => {
    if (status === 'declined') setCallNotice('Call ended')
    else if (status === 'missed') setCallNotice('Missed call')
  }

  const callBusy = Boolean(activeCall || outgoingCall || incomingCall)

  const otherParty = (call: DirectVideoCall) => {
    if (!user) return { name: 'Contact', avatar: undefined }
    const isCaller = call.callerId === user.id
    return {
      name: isCaller ? (call.calleeName ?? 'Contact') : (call.callerName ?? 'Contact'),
      avatar: isCaller ? call.calleeAvatar : call.callerAvatar,
    }
  }

  useEffect(() => {
    if (!callNotice) return
    const timer = setTimeout(() => setCallNotice(null), 4000)
    return () => clearTimeout(timer)
  }, [callNotice])

  return (
    <DirectVideoCallContext.Provider value={{ startCall, callBusy }}>
      {children}

      {incomingCall && !activeCall && (
        <ChatVideoCallRingOverlay
          callId={incomingCall.id}
          peerName={otherParty(incomingCall).name}
          peerPhoto={otherParty(incomingCall).avatar}
          mode="incoming"
          onAccept={() => void handleAcceptIncoming()}
          onDecline={() => void handleDeclineIncoming()}
        />
      )}

      {outgoingCall && !activeCall && (
        <ChatVideoCallRingOverlay
          callId={outgoingCall.id}
          peerName={otherParty(outgoingCall).name}
          peerPhoto={otherParty(outgoingCall).avatar}
          mode="outgoing"
          onDecline={() => void handleCancelOutgoing()}
        />
      )}

      {activeCall && user && (
        <DirectVideoCallRoom
          call={activeCall}
          participantName={user.name}
          participantId={user.id}
          otherName={otherParty(activeCall).name}
          onLeave={handleLeaveCall}
          onRemoteEnd={handleRemoteEnd}
        />
      )}

      {callNotice && !activeCall && !outgoingCall && !incomingCall && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-full bg-charcoal/95 border border-cream/10 text-cream text-sm shadow-lg">
          {callNotice}
          <button
            type="button"
            className="ml-3 text-cream/50 hover:text-cream cursor-pointer"
            onClick={() => setCallNotice(null)}
          >
            ×
          </button>
        </div>
      )}
    </DirectVideoCallContext.Provider>
  )
}
