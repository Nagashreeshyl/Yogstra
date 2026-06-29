import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../../context/AppContext'
import { INCOMING_CALL_POLL_MS } from '../../constants/refresh'
import {
  createDirectVideoCall,
  fetchDirectVideoCall,
  fetchIncomingRingingCall,
  fetchUserActiveDirectCall,
  subscribeToDirectVideoCallById,
  subscribeToDirectVideoCalls,
  updateDirectVideoCallStatus,
  watchDirectVideoCallTerminalStatus,
  type DirectVideoCall,
  type DirectVideoCallStatus,
} from '../../services/directVideoCalls'
import { ChatVideoCallRingOverlay } from './ChatVideoCallRingOverlay'
import { preflightCameraAndMic } from '../../utils/preflightMedia'

const DirectVideoCallRoom = lazy(() =>
  import('./DirectVideoCallRoom').then((m) => ({ default: m.DirectVideoCallRoom })),
)

const OUTGOING_RING_MS = 45_000
const TERMINAL_STATUSES: DirectVideoCallStatus[] = ['ended', 'declined', 'missed']

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
  const activeCallRef = useRef<DirectVideoCall | null>(null)
  const incomingCallRef = useRef<DirectVideoCall | null>(null)
  const outgoingCallRef = useRef<DirectVideoCall | null>(null)

  activeCallRef.current = activeCall
  incomingCallRef.current = incomingCall
  outgoingCallRef.current = outgoingCall

  const clearOutgoingTimer = () => {
    if (outgoingTimerRef.current) {
      clearTimeout(outgoingTimerRef.current)
      outgoingTimerRef.current = null
    }
  }

  const clearAllCallState = useCallback(() => {
    setActiveCall(null)
    setIncomingCall(null)
    setOutgoingCall(null)
  }, [])

  const applyIncomingCall = useCallback(async (callId: string) => {
    if (activeCallRef.current) return
    const call = await fetchDirectVideoCall(callId)
    if (call?.status === 'ringing' && call.calleeId === user?.id) {
      setIncomingCall(call)
    }
  }, [user?.id])

  const refreshCalls = useCallback(async () => {
    if (!user || (user.role !== 'student' && user.role !== 'teacher')) {
      if (!activeCallRef.current) clearAllCallState()
      return
    }

    if (activeCallRef.current || outgoingCallRef.current) return

    const incoming = await fetchIncomingRingingCall(user.id)
    setIncomingCall(incoming)

    const active = await fetchUserActiveDirectCall(user.id)
    if (active?.status === 'active') {
      setActiveCall(active)
      setIncomingCall(null)
    }
  }, [user, clearAllCallState])

  useEffect(() => {
    void refreshCalls()
  }, [refreshCalls])

  useEffect(() => {
    if (!user || (user.role !== 'student' && user.role !== 'teacher')) return

    return subscribeToDirectVideoCalls(user.id, {
      onChange: () => {
        void refreshCalls()
      },
      onIncomingRinging: (callId) => {
        void applyIncomingCall(callId)
      },
      onIncomingUpdated: (call) => {
        if (call.status === 'ringing' && call.calleeId === user.id) {
          void applyIncomingCall(call.id)
          return
        }
        if (incomingCallRef.current?.id === call.id && call.status !== 'ringing') {
          setIncomingCall(null)
        }
      },
    })
  }, [user, refreshCalls, applyIncomingCall])

  useEffect(() => {
    if (!user || activeCall || outgoingCall) return
    if (user.role !== 'student' && user.role !== 'teacher') return

    const id = window.setInterval(() => {
      void refreshCalls()
    }, INCOMING_CALL_POLL_MS)

    return () => window.clearInterval(id)
  }, [user, activeCall, outgoingCall, refreshCalls])

  useEffect(() => {
    const wake = () => {
      if (!activeCallRef.current && !outgoingCallRef.current) void refreshCalls()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') wake()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', wake)
    window.addEventListener('pageshow', wake)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', wake)
      window.removeEventListener('pageshow', wake)
    }
  }, [refreshCalls])

  useEffect(() => {
    if (!activeCall) return

    const unsub = subscribeToDirectVideoCallById(activeCall.id, (call) => {
      if (call.status === 'active') return
      if (TERMINAL_STATUSES.includes(call.status)) {
        clearAllCallState()
        if (call.status === 'declined' || call.status === 'ended') setCallNotice('Call ended')
        else if (call.status === 'missed') setCallNotice('Missed call')
      }
    })

    return unsub
  }, [activeCall, clearAllCallState])

  const callerRingingCall =
    outgoingCall && user && outgoingCall.callerId === user.id ? outgoingCall : null
  const liveKitCall = activeCall ?? callerRingingCall
  const isCallerRinging = Boolean(callerRingingCall && !activeCall)

  useEffect(() => {
    if (!liveKitCall) return

    return watchDirectVideoCallTerminalStatus(liveKitCall.id, (status) => {
      clearAllCallState()
      if (status === 'declined' || status === 'ended') setCallNotice('Call ended')
      else if (status === 'missed') setCallNotice('Missed call')
    })
  }, [liveKitCall?.id, clearAllCallState])

  useEffect(() => {
    if (!incomingCall || liveKitCall) return

    return watchDirectVideoCallTerminalStatus(incomingCall.id, () => {
      setIncomingCall(null)
      setCallNotice('Call ended')
    })
  }, [incomingCall?.id, liveKitCall, clearAllCallState])

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
        void fetchDirectVideoCall(call.id).then((fresh) => {
          if (fresh) setActiveCall(fresh)
        })
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
      if (activeCallRef.current || outgoingCallRef.current || incomingCallRef.current) {
        setCallNotice('Already on a call')
        return
      }

      setCallNotice(null)
      try {
        const mediaReady = await preflightCameraAndMic()
        if (!mediaReady) {
          setCallNotice('Camera or microphone access is required for video calls.')
          return
        }

        const call = await createDirectVideoCall({
          threadId: params.threadId,
          callerId: user.id,
          calleeId: params.calleeId,
        })
        setOutgoingCall(call)
      } catch {
        setCallNotice('Could not start call. Check your connection and try again.')
      }
    },
    [user],
  )

  const handleAcceptIncoming = async () => {
    if (!incomingCall) return
    try {
      const mediaReady = await preflightCameraAndMic()
      if (!mediaReady) {
        setCallNotice('Allow camera and microphone to join the call.')
        return
      }

      await updateDirectVideoCallStatus(incomingCall.id, 'active', {
        startedAt: new Date().toISOString(),
      })
      const fresh = await fetchDirectVideoCall(incomingCall.id)
      setIncomingCall(null)
      if (fresh) setActiveCall(fresh)
    } catch {
      setCallNotice('Could not join call. Try again.')
    }
  }

  const handleDeclineIncoming = async () => {
    if (!incomingCall) return
    await updateDirectVideoCallStatus(incomingCall.id, 'declined', {
      endedAt: new Date().toISOString(),
    })
    setIncomingCall(null)
  }

  const handleLeaveCall = useCallback(() => {
    clearAllCallState()
  }, [clearAllCallState])

  const handleRemoteEnd = (status: DirectVideoCallStatus) => {
    if (status === 'declined' || status === 'ended') setCallNotice('Call ended')
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

  const canReceiveCalls = Boolean(
    user && (user.role === 'student' || user.role === 'teacher'),
  )

  const callOverlay =
    canReceiveCalls &&
    createPortal(
      <>
        {incomingCall && !liveKitCall && (
          <ChatVideoCallRingOverlay
            callId={incomingCall.id}
            peerName={otherParty(incomingCall).name}
            peerPhoto={otherParty(incomingCall).avatar}
            mode="incoming"
            onAccept={() => void handleAcceptIncoming()}
            onDecline={() => void handleDeclineIncoming()}
          />
        )}

        {liveKitCall && user && (
          <Suspense fallback={null}>
            <DirectVideoCallRoom
              call={liveKitCall}
              participantName={user.name}
              participantId={user.id}
              otherName={otherParty(liveKitCall).name}
              ringing={isCallerRinging}
              onLeave={handleLeaveCall}
              onRemoteEnd={handleRemoteEnd}
            />
          </Suspense>
        )}

        {callNotice && !activeCall && !outgoingCall && !incomingCall && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[210] px-4 py-2 rounded-full bg-sidebar/95 border border-cream/10 text-primary-foreground text-sm shadow-lg">
            {callNotice}
            <button
              type="button"
              className="ml-3 text-primary-foreground/50 hover:text-primary-foreground cursor-pointer"
              onClick={() => setCallNotice(null)}
            >
              ×
            </button>
          </div>
        )}
      </>,
      document.body,
    )

  return (
    <DirectVideoCallContext.Provider value={{ startCall, callBusy }}>
      {children}
      {callOverlay}
    </DirectVideoCallContext.Provider>
  )
}
