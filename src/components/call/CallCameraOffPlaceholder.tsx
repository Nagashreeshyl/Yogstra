import { Mic, MicOff, VideoOff } from 'lucide-react'
import { initialsForName } from './callTrackUtils'

type CallCameraOffPlaceholderProps = {
  name: string
  isLocal?: boolean
  micMuted?: boolean
  away?: boolean
  size?: 'main' | 'pip'
}

export function CallCameraOffPlaceholder({
  name,
  isLocal = false,
  micMuted = false,
  away = false,
  size = 'main',
}: CallCameraOffPlaceholderProps) {
  const displayName = isLocal ? 'You' : name
  const subtitle = away
    ? 'Stepped away — camera off'
    : isLocal
      ? 'Your camera is off'
      : `${name.split(' ')[0] ?? name} turned off their camera`

  return (
    <div
      className={`yogstra-call-camera-off yogstra-call-camera-off-${size}`}
      aria-label={`${displayName} camera off`}
    >
      <div className="yogstra-call-camera-off-glow" aria-hidden="true" />
      <div className="yogstra-call-camera-off-avatar" aria-hidden="true">
        {initialsForName(name)}
      </div>
      <div className="yogstra-call-camera-off-copy">
        <p className="yogstra-call-camera-off-name">{displayName}</p>
        <p className="yogstra-call-camera-off-subtitle">
          <VideoOff size={size === 'pip' ? 12 : 14} aria-hidden="true" />
          <span>{subtitle}</span>
        </p>
      </div>
      {size === 'main' && (
        <div
          className={`yogstra-call-camera-off-mic${micMuted ? ' yogstra-call-camera-off-mic-muted' : ''}`}
          aria-label={micMuted ? 'Microphone muted' : 'Microphone on'}
        >
          {micMuted ? <MicOff size={14} /> : <Mic size={14} />}
          <span>{micMuted ? 'Muted' : 'Mic on'}</span>
        </div>
      )}
    </div>
  )
}
