import { useEffect, useState } from 'react'
import { StartAudio, useRoomContext } from '@livekit/components-react'
import { RoomEvent } from 'livekit-client'
import { Volume2 } from 'lucide-react'

export function ClassRoomAudioSetup() {
  const room = useRoomContext()
  const [audioBlocked, setAudioBlocked] = useState(() => !room.canPlaybackAudio)

  useEffect(() => {
    const sync = () => setAudioBlocked(!room.canPlaybackAudio)
    sync()
    room.on(RoomEvent.AudioPlaybackStatusChanged, sync)
    return () => {
      room.off(RoomEvent.AudioPlaybackStatusChanged, sync)
    }
  }, [room])

  useEffect(() => {
    void room.startAudio().catch(() => undefined)
  }, [room])

  useEffect(() => {
    const unlock = () => {
      void room.startAudio().then(() => {
        setAudioBlocked(!room.canPlaybackAudio)
      })
    }

    window.addEventListener('pointerdown', unlock, { capture: true })
    return () => window.removeEventListener('pointerdown', unlock, { capture: true })
  }, [room])

  if (!audioBlocked) return null

  return (
    <div className="absolute inset-x-0 top-4 z-[200] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-sm border border-primary/50 bg-sidebar/95 px-4 py-3 shadow-lg max-w-md">
        <Volume2 size={20} className="text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-primary-foreground text-sm font-medium">Sound is blocked by your browser</p>
          <p className="text-primary-foreground/55 text-xs mt-0.5">
            Tap below to hear the other person. You can also click anywhere in the room.
          </p>
        </div>
        <StartAudio
          label="Enable sound"
          className="shrink-0 rounded-[12px] bg-primary px-3 py-2 text-sm font-medium text-foreground cursor-pointer hover:bg-primary-hover transition-colors"
        />
      </div>
    </div>
  )
}
