import { useState } from 'react'
import { Phone, UserX } from 'lucide-react'
import { useRemoteParticipants } from '@livekit/components-react'
import { Button } from '../ui/Button'
import { ringStudentAgain } from '../../services/classSessions'

interface TeacherStudentAwayActionsProps {
  sessionId: string
  studentName?: string
}

export function TeacherStudentAwayActions({
  sessionId,
  studentName,
}: TeacherStudentAwayActionsProps) {
  const remoteParticipants = useRemoteParticipants()
  const [ringing, setRinging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (remoteParticipants.length > 0) return null

  const handleRingAgain = async () => {
    setRinging(true)
    setError(null)
    try {
      await ringStudentAgain(sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not ring the student.')
    } finally {
      setRinging(false)
    }
  }

  return (
    <div className="absolute inset-x-0 top-20 z-[110] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-sm border border-amber-400/40 bg-sidebar/95 px-4 py-4 shadow-lg">
        <div className="flex items-start gap-3">
          <UserX size={20} className="text-amber-300 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-primary-foreground text-sm font-medium">
              {studentName ?? 'Student'} left the call
            </p>
            <p className="text-primary-foreground/55 text-xs mt-1">
              You can stay in the room and ring them again to rejoin.
            </p>
            {error && <p className="text-red-300 text-xs mt-2">{error}</p>}
            <Button
              className="mt-3 gap-2 w-full sm:w-auto"
              size="sm"
              disabled={ringing}
              onClick={() => void handleRingAgain()}
            >
              <Phone size={16} />
              {ringing ? 'Ringing…' : 'Ring student again'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
