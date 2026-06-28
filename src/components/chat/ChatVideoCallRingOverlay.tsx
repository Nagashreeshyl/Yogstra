import { useEffect, useRef } from 'react'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { startIncomingCallRing } from '../../utils/notificationSounds'

interface ChatVideoCallRingOverlayProps {
  callId: string
  peerName: string
  peerPhoto?: string
  mode: 'incoming' | 'outgoing'
  onAccept?: () => void
  onDecline: () => void
}

export function ChatVideoCallRingOverlay({
  callId,
  peerName,
  peerPhoto,
  mode,
  onAccept,
  onDecline,
}: ChatVideoCallRingOverlayProps) {
  const stopRingRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    stopRingRef.current = startIncomingCallRing()

    if (mode === 'incoming' && navigator.vibrate) {
      navigator.vibrate([400, 200, 400, 200, 400])
    }

    return () => {
      stopRingRef.current?.()
      stopRingRef.current = null
    }
  }, [callId, mode])

  const stopRing = () => {
    stopRingRef.current?.()
    stopRingRef.current = null
  }

  const isIncoming = mode === 'incoming'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-charcoal/95 backdrop-blur-sm">
      <div
        className={`w-full max-w-sm rounded-sm border border-teal/40 bg-charcoal shadow-2xl p-8 text-center ${
          isIncoming ? 'animate-pulse' : ''
        }`}
      >
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Avatar src={peerPhoto} name={peerName} size={88} />
            <span className="absolute -bottom-1 -right-1 bg-teal rounded-full p-1.5">
              <Video size={16} className="text-charcoal" />
            </span>
          </div>
        </div>
        <p className="text-cream/60 text-sm mb-1">
          {isIncoming ? 'Incoming video call' : 'Calling…'}
        </p>
        <p className="text-cream text-xl font-semibold mb-6">{peerName}</p>
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
            {isIncoming ? 'Decline' : 'Cancel'}
          </Button>
          {isIncoming && onAccept && (
            <Button
              className="gap-2"
              onClick={() => {
                stopRing()
                onAccept()
              }}
            >
              <Phone size={18} />
              Accept
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
