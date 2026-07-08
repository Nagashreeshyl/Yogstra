import { useState } from 'react'
import { useRoomContext } from '@livekit/components-react'
import {
  applyLiveKitVideoQuality,
  getLiveKitQualityResolutionLabel,
  getLiveKitVideoQuality,
  LIVEKIT_VIDEO_QUALITY_OPTIONS,
  saveLiveKitVideoQuality,
  type LiveKitVideoQuality,
} from '../../utils/livekitVideoQuality'

type VideoQualitySelectorProps = {
  /** `floating` for live class overlay; `inline` for DM call toolbar */
  variant?: 'floating' | 'inline'
  className?: string
}

export function VideoQualitySelector({
  variant = 'floating',
  className,
}: VideoQualitySelectorProps) {
  const room = useRoomContext()
  const [quality, setQuality] = useState<LiveKitVideoQuality>(() => getLiveKitVideoQuality())
  const [busy, setBusy] = useState(false)
  const [appliedNote, setAppliedNote] = useState<string | null>(null)

  async function handleChange(next: LiveKitVideoQuality) {
    if (next === quality || busy) return
    setBusy(true)
    setQuality(next)
    try {
      if (room.state === 'connected') {
        await applyLiveKitVideoQuality(room, next)
        setAppliedNote(`Sending ${getLiveKitQualityResolutionLabel(next)}`)
      } else {
        saveLiveKitVideoQuality(next)
        setAppliedNote(`Will use ${getLiveKitQualityResolutionLabel(next)} on join`)
      }
    } catch {
      setQuality(getLiveKitVideoQuality())
      setAppliedNote(null)
    } finally {
      setBusy(false)
      window.setTimeout(() => setAppliedNote(null), 2600)
    }
  }

  const shellClass =
    variant === 'inline'
      ? 'yogstra-call-quality-shell yogstra-call-quality-inline'
      : 'yogstra-call-quality-shell yogstra-call-quality-floating'

  return (
    <div className={[shellClass, className].filter(Boolean).join(' ')} role="group" aria-label="Video quality">
      <span className="yogstra-call-quality-label">Out</span>
      {LIVEKIT_VIDEO_QUALITY_OPTIONS.map((option) => {
        const active = quality === option
        return (
          <button
            key={option}
            type="button"
            disabled={busy}
            onClick={() => void handleChange(option)}
            className={`yogstra-call-quality-btn${active ? ' yogstra-call-quality-btn-active' : ''}`}
            aria-pressed={active}
            title={`Send video at ${getLiveKitQualityResolutionLabel(option)}`}
          >
            {option}
          </button>
        )
      })}
      {appliedNote ? <span className="yogstra-call-quality-applied">{appliedNote}</span> : null}
    </div>
  )
}
