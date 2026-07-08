import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Loader2, X } from 'lucide-react'
import { ClassSessionRemoteWatcher } from './ClassSessionRemoteWatcher'
import { ClassSessionStatusWatcher } from './ClassSessionStatusWatcher'
import { LiveClassCallView } from '../call/LiveClassCallView'
import { Button } from '../ui/Button'
import { buildLiveKitRoomOptions, getLiveKitVideoQuality } from '../../utils/livekitVideoQuality'
import {
  fetchLiveKitToken,
  updateClassSessionStatus,
  type ClassSession,
  type ClassSessionStatus,
} from '../../services/classSessions'

type CallPhase = 'loading' | 'live' | 'confirm_end'

interface LiveClassRoomProps {
  session: ClassSession
  participantName: string
  participantId: string
  role: 'teacher' | 'student'
  onLeave: () => void
  /** Teacher closed overlay without ending the session — return to classes list */
  onBackToClasses?: () => void
  onRemoteEnd?: (status: ClassSessionStatus) => void
  onStudentLeftCall?: () => void
}

export function LiveClassRoom({
  session,
  participantName,
  participantId,
  role,
  onLeave,
  onBackToClasses,
  onRemoteEnd,
  onStudentLeftCall,
}: LiveClassRoomProps) {
  const [connectInfo, setConnectInfo] = useState<{ token: string; serverUrl: string } | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [callPhase, setCallPhase] = useState<CallPhase>('loading')
  const endHandledRef = useRef(false)
  const localEndInitiatedRef = useRef(false)

  useEffect(() => {
    endHandledRef.current = false
    localEndInitiatedRef.current = false
    setCallPhase('loading')
    setConnectInfo(null)
    setError(null)
  }, [session.id])

  useEffect(() => {
    if (callPhase === 'confirm_end') return

    let cancelled = false
    setError(null)

    void fetchLiveKitToken({
      roomName: session.roomName,
      participantName,
      participantId,
    })
      .then((info) => {
        if (cancelled) return
        setConnectInfo(info)
        setCallPhase('live')
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not join the class.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [session.roomName, participantName, participantId])

  const finishLeave = useCallback(
    (localLeave: boolean) => {
      if (endHandledRef.current) return
      endHandledRef.current = true

      if (localLeave) {
        localEndInitiatedRef.current = true
        void updateClassSessionStatus(session.id, 'ended', {
          endedAt: new Date().toISOString(),
        }).finally(onLeave)
        return
      }

      onLeave()
    },
    [session.id, onLeave],
  )

  const handleRemoteEnd = useCallback(
    (status: ClassSessionStatus) => {
      if (!localEndInitiatedRef.current) {
        onRemoteEnd?.(status)
      }
      if (endHandledRef.current) return
      finishLeave(false)
    },
    [finishLeave, onRemoteEnd],
  )

  const handleDisconnected = useCallback(() => {
    if (role === 'teacher') {
      setCallPhase('confirm_end')
      return
    }
    endHandledRef.current = true
    onStudentLeftCall?.()
    onLeave()
  }, [role, onLeave, onStudentLeftCall])

  const handleTeacherEndClass = () => {
    finishLeave(true)
  }

  const handleTeacherBackToClasses = () => {
    ;(onBackToClasses ?? onLeave)()
  }

  const showLiveKitRoom = callPhase === 'live' && connectInfo

  if (error && callPhase !== 'confirm_end') {
    return (
      <div className="fixed inset-0 z-[100] bg-sidebar flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={onLeave}>Go back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] yogstra-call-root pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {callPhase === 'confirm_end' && role === 'teacher' && (
        <ClassSessionStatusWatcher sessionId={session.id} onTerminalStatus={handleRemoteEnd} />
      )}

      {callPhase === 'loading' && (
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-accent" size={40} />
          <p className="text-primary-foreground/70 text-sm">Joining live class…</p>
        </div>
      )}

      {callPhase === 'confirm_end' && role === 'teacher' && (
        <div className="flex h-full items-center justify-center p-6">
          <div className="relative w-full max-w-md rounded-sm border border-primary/40 bg-sidebar shadow-2xl p-8 text-center">
            <button
              type="button"
              onClick={handleTeacherBackToClasses}
              className="absolute top-3 right-3 p-1.5 text-primary-foreground/50 hover:text-primary-foreground cursor-pointer rounded-sm"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h2 className="text-primary-foreground text-xl font-semibold mb-2">Is the class over?</h2>
            <p className="text-primary-foreground/55 text-sm mb-6">
              {session.studentName ?? 'Your student'} will stay in the call until you confirm.
              Choose <strong className="text-primary-foreground font-medium">Yes</strong> only when the class
              is finished.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={handleTeacherEndClass}>
                Yes, end class
              </Button>
              <Button variant="secondary" className="flex-1" onClick={handleTeacherBackToClasses}>
                No
              </Button>
            </div>
          </div>
        </div>
      )}

      {showLiveKitRoom && (
        <LiveKitRoom
          key={session.id}
          token={connectInfo.token}
          serverUrl={connectInfo.serverUrl}
          connect
          video
          audio
          connectOptions={{ autoSubscribe: true }}
          options={buildLiveKitRoomOptions(getLiveKitVideoQuality())}
          onDisconnected={handleDisconnected}
          data-lk-theme="default"
          className="h-full w-full yogstra-call-room"
        >
          <ClassSessionRemoteWatcher sessionId={session.id} onRemoteEnd={handleRemoteEnd} />
          <LiveClassCallView
            role={role}
            sessionId={session.id}
            otherParticipantName={
              role === 'teacher' ? session.studentName : session.teacherName
            }
            sessionScheduledAt={session.scheduledSessionAt ?? null}
            sessionStartedAt={session.startedAt}
            onEnd={() => finishLeave(true)}
          />
        </LiveKitRoom>
      )}
    </div>
  )
}
