import { useParticipants } from '@livekit/components-react'

export function StudentTeacherAwayNotice() {
  const participants = useParticipants()
  const teacherPresent = participants.some((p) => !p.isLocal)

  if (teacherPresent) return null

  return (
    <div className="absolute inset-x-0 top-20 z-[110] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto max-w-md rounded-sm border border-primary/40 bg-sidebar/95 px-4 py-3 text-center shadow-lg">
        <p className="text-primary-foreground text-sm font-medium">Your teacher stepped out briefly</p>
        <p className="text-primary-foreground/55 text-xs mt-1">Please stay on the call — they may rejoin shortly.</p>
      </div>
    </div>
  )
}
