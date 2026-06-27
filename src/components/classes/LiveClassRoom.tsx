import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
  VideoConference,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Loader2, X } from 'lucide-react'
import { ClassRoomAudioSetup } from './ClassRoomAudioSetup'
import { ClassSessionRemoteWatcher } from './ClassSessionRemoteWatcher'
import { ClassSessionStatusWatcher } from './ClassSessionStatusWatcher'
import { StudentTeacherAwayNotice } from './StudentTeacherAwayNotice'
import { TeacherStudentAwayActions } from './TeacherStudentAwayActions'
import { ClassHourTimeUpNotice } from './ClassHourTimeUpNotice'
import { Button } from '../ui/Button'
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
      <div className="fixed inset-0 z-[100] bg-charcoal flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="text-red-300 mb-4">{error}</p>
          <button
            type="button"
            onClick={onLeave}
            className="px-4 py-2 bg-cream text-charcoal rounded-sm font-medium cursor-pointer"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-charcoal pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {callPhase === 'confirm_end' && role === 'teacher' && (
        <ClassSessionStatusWatcher sessionId={session.id} onTerminalStatus={handleRemoteEnd} />
      )}

      {callPhase === 'loading' && (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="animate-spin text-teal" size={40} />
        </div>
      )}

      {callPhase === 'confirm_end' && role === 'teacher' && (
        <div className="flex h-full items-center justify-center p-6">
          <div className="relative w-full max-w-md rounded-sm border border-teal/40 bg-charcoal shadow-2xl p-8 text-center">
            <button
              type="button"
              onClick={handleTeacherBackToClasses}
              className="absolute top-3 right-3 p-1.5 text-cream/50 hover:text-cream cursor-pointer rounded-sm"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h2 className="text-cream text-xl font-semibold mb-2">Is the class over?</h2>
            <p className="text-cream/55 text-sm mb-6">
              {session.studentName ?? 'Your student'} will stay in the call until you confirm.
              Choose <strong className="text-cream font-medium">Yes</strong> only when the class
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
          options={{
            audioCaptureDefaults: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }}
          onDisconnected={handleDisconnected}
          data-lk-theme="default"
          style={{ height: '100vh' }}
        >
          <ClassSessionRemoteWatcher sessionId={session.id} onRemoteEnd={handleRemoteEnd} />
          <ClassRoomAudioSetup />
          {role === 'student' && <StudentTeacherAwayNotice />}
          {role === 'teacher' && (
            <TeacherStudentAwayActions
              sessionId={session.id}
              studentName={session.studentName}
            />
          )}
          <ClassHourTimeUpNotice
            role={role}
            sessionScheduledAt={session.scheduledSessionAt ?? null}
            sessionStartedAt={session.startedAt}
            otherParticipantName={
              role === 'teacher' ? session.studentName : session.teacherName
            }
          />
          <VideoConference />
        </LiveKitRoom>
      )}
    </div>
  )
}
