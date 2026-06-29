import { useEffect, useRef } from 'react'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import type { ClassSession } from '../../services/classSessions'
import { startIncomingCallRing } from '../../utils/notificationSounds'

interface IncomingCallOverlayProps {
  session: ClassSession
  callerName: string
  callerPhoto?: string
  onAccept: () => void
  onDecline: () => void
}

export function IncomingCallOverlay({
  session,
  callerName,
  callerPhoto,
  onAccept,
  onDecline,
}: IncomingCallOverlayProps) {
  const stopRingRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    stopRingRef.current = startIncomingCallRing()

    if (navigator.vibrate) {
      navigator.vibrate([400, 200, 400, 200, 400])
    }

    return () => {
      stopRingRef.current?.()
      stopRingRef.current = null
    }
  }, [session.id])

  const stopRing = () => {
    stopRingRef.current?.()
    stopRingRef.current = null
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-sidebar/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-sm border border-primary/40 bg-sidebar shadow-2xl p-8 text-center animate-pulse">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Avatar src={callerPhoto} name={callerName} size={88} />
            <span className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5">
              <Video size={16} className="text-foreground" />
            </span>
          </div>
        </div>
        <p className="text-primary-foreground/60 text-sm mb-1">Incoming video class</p>
        <p className="text-primary-foreground text-xl font-semibold mb-6">{callerName}</p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            className="gap-2 bg-red-600/20 border-red-400/40 text-red-200 hover:bg-red-600/30"
            onClick={() => {
              stopRing()
              onDecline()
            }}
          >
            <PhoneOff size={18} />
            Decline
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              stopRing()
              onAccept()
            }}
          >
            <Phone size={18} />
            Join class
          </Button>
        </div>
      </div>
    </div>
  )
}
