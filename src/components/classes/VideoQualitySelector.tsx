import { useState } from 'react'
import { useRoomContext } from '@livekit/components-react'
import {
  applyLiveKitVideoQuality,
  getLiveKitVideoQuality,
  LIVEKIT_VIDEO_QUALITY_OPTIONS,
  saveLiveKitVideoQuality,
  type LiveKitVideoQuality,
} from '../../utils/livekitVideoQuality'

type VideoQualitySelectorProps = {
  /** `floating` for live class overlay; `inline` for DM call toolbar */
  variant?: 'floating' | 'inline'
}

export function VideoQualitySelector({ variant = 'floating' }: VideoQualitySelectorProps) {
  const room = useRoomContext()
  const [quality, setQuality] = useState<LiveKitVideoQuality>(() => getLiveKitVideoQuality())
  const [busy, setBusy] = useState(false)

  async function handleChange(next: LiveKitVideoQuality) {
    if (next === quality || busy) return
    setBusy(true)
    setQuality(next)
    try {
      if (room.state === 'connected') {
        await applyLiveKitVideoQuality(room, next)
      } else {
        saveLiveKitVideoQuality(next)
      }
    } catch {
      setQuality(getLiveKitVideoQuality())
    } finally {
      setBusy(false)
    }
  }

  const shellClass =
    variant === 'inline'
      ? 'inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-1 py-1 backdrop-blur-md'
      : 'absolute right-4 top-4 z-[120] inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-1 py-1 backdrop-blur-md'

  return (
    <div className={shellClass} role="group" aria-label="Video quality">
      <span className="hidden sm:inline px-2 text-[10px] font-medium uppercase tracking-wide text-white/70">
        Quality
      </span>
      {LIVEKIT_VIDEO_QUALITY_OPTIONS.map((option) => {
        const active = quality === option
        return (
          <button
            key={option}
            type="button"
            disabled={busy}
            onClick={() => void handleChange(option)}
            className={`min-h-[32px] rounded-full px-2.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            aria-pressed={active}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
