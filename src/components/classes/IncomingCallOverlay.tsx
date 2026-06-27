import { useEffect, useRef } from 'react'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import type { ClassSession } from '../../services/classSessions'

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
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC',
    )
    audio.loop = true
    audioRef.current = audio
    void audio.play().catch(() => undefined)

    if (navigator.vibrate) {
      navigator.vibrate([400, 200, 400, 200, 400])
    }

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [session.id])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-sm border border-teal/40 bg-charcoal shadow-2xl p-8 text-center animate-pulse">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Avatar src={callerPhoto} name={callerName} size={88} />
            <span className="absolute -bottom-1 -right-1 bg-teal rounded-full p-1.5">
              <Video size={16} className="text-charcoal" />
            </span>
          </div>
        </div>
        <p className="text-cream/60 text-sm mb-1">Incoming video class</p>
        <p className="text-cream text-xl font-semibold mb-6">{callerName}</p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            className="gap-2 bg-red-600/20 border-red-400/40 text-red-200 hover:bg-red-600/30"
            onClick={onDecline}
          >
            <PhoneOff size={18} />
            Decline
          </Button>
          <Button className="gap-2" onClick={onAccept}>
            <Phone size={18} />
            Join class
          </Button>
        </div>
      </div>
    </div>
  )
}
