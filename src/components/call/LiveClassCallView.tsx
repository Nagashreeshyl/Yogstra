import { createPortal } from 'react-dom'
import { RoomAudioRenderer, useParticipants } from '@livekit/components-react'
import { ClassRoomAudioSetup } from '../classes/ClassRoomAudioSetup'
import { LiveKitVideoQualityBootstrap } from '../classes/LiveKitVideoQualityBootstrap'
import { VideoQualitySelector } from '../classes/VideoQualitySelector'
import { ClassHourTimeUpNotice } from '../classes/ClassHourTimeUpNotice'
import { StudentTeacherAwayNotice } from '../classes/StudentTeacherAwayNotice'
import { TeacherStudentAwayActions } from '../classes/TeacherStudentAwayActions'
import { YogstraCallStage } from './YogstraCallStage'
import { YogstraCallHeader, YogstraVideoCallControls } from './YogstraVideoCallControls'
import { useBackgroundCameraPause } from './useBackgroundCameraPause'

type LiveClassCallViewProps = {
  role: 'teacher' | 'student'
  sessionId: string
  otherParticipantName: string | null | undefined
  sessionScheduledAt: string | null
  sessionStartedAt: string | null
  onEnd: () => void
}

export function LiveClassCallView({
  role,
  sessionId,
  otherParticipantName,
  sessionScheduledAt,
  sessionStartedAt,
  onEnd,
}: LiveClassCallViewProps) {
  useBackgroundCameraPause()

  const participants = useParticipants()
  const remotePresent = participants.some((participant) => !participant.isLocal)
  const otherName = otherParticipantName?.trim() || (role === 'teacher' ? 'Student' : 'Teacher')

  return (
    <>
      <LiveKitVideoQualityBootstrap />
      <RoomAudioRenderer />
      <ClassRoomAudioSetup />
      <YogstraCallHeader title="Live class" subtitle={otherName} />
      {createPortal(
        <VideoQualitySelector variant="floating" className="yogstra-call-quality" />,
        document.body,
      )}
      <YogstraCallStage
        otherName={otherName}
        remoteAway={role === 'student' && !remotePresent}
      />
      <YogstraVideoCallControls onEnd={onEnd} endLabel="Leave class" />
      {role === 'student' && <StudentTeacherAwayNotice />}
      {role === 'teacher' && (
        <TeacherStudentAwayActions
          sessionId={sessionId}
          studentName={otherParticipantName ?? undefined}
        />
      )}
      <ClassHourTimeUpNotice
        role={role}
        sessionScheduledAt={sessionScheduledAt}
        sessionStartedAt={sessionStartedAt}
        otherParticipantName={otherParticipantName ?? undefined}
      />
    </>
  )
}
