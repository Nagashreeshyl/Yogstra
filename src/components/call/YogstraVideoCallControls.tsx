import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRoomContext, useTrackToggle } from '@livekit/components-react'
import {
  LocalVideoTrack,
  Room,
  RoomEvent,
  Track,
} from 'livekit-client'
import {
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  SwitchCamera,
  Video,
  VideoOff,
} from 'lucide-react'
import { getLiveKitCameraCaptureOptions } from '../../utils/livekitVideoQuality'
import {
  canOfferScreenShare,
  disableScreenShare,
  enableScreenShare,
  screenShareErrorMessage,
} from '../../utils/screenShareSupport'

function YogstraCallControlButton({
  label,
  active,
  danger,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  danger?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`yogstra-call-control-btn${active ? ' yogstra-call-control-btn-active' : ''}${danger ? ' yogstra-call-control-btn-danger' : ''}`}
    >
      <span className="yogstra-call-control-icon">{children}</span>
      <span className="yogstra-call-control-label">{label}</span>
    </button>
  )
}

type YogstraVideoCallControlsProps = {
  onEnd: () => void
  endLabel?: string
  cancelLabel?: string
  ringing?: boolean
}

export function YogstraVideoCallControls({
  onEnd,
  endLabel = 'Leave',
  cancelLabel = 'Cancel',
  ringing = false,
}: YogstraVideoCallControlsProps) {
  const room = useRoomContext()
  const mic = useTrackToggle({ source: Track.Source.Microphone })
  const camera = useTrackToggle({ source: Track.Source.Camera })
  const showScreenShare = canOfferScreenShare()
  const [screenSharing, setScreenSharing] = useState(false)
  const [busy, setBusy] = useState<'flip' | 'screen' | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!showScreenShare) return

    const syncScreenShare = () => {
      setScreenSharing(room.localParticipant.isScreenShareEnabled)
    }

    syncScreenShare()
    room.on(RoomEvent.LocalTrackPublished, syncScreenShare)
    room.on(RoomEvent.LocalTrackUnpublished, syncScreenShare)
    room.on(RoomEvent.TrackMuted, syncScreenShare)
    room.on(RoomEvent.TrackUnmuted, syncScreenShare)

    return () => {
      room.off(RoomEvent.LocalTrackPublished, syncScreenShare)
      room.off(RoomEvent.LocalTrackUnpublished, syncScreenShare)
      room.off(RoomEvent.TrackMuted, syncScreenShare)
      room.off(RoomEvent.TrackUnmuted, syncScreenShare)
    }
  }, [room, showScreenShare])

  useEffect(() => {
    if (!actionNotice) return
    const timer = window.setTimeout(() => setActionNotice(null), 3500)
    return () => window.clearTimeout(timer)
  }, [actionNotice])

  const flipCamera = async () => {
    if (busy) return
    setBusy('flip')
    setActionNotice(null)
    try {
      const publication = room.localParticipant.getTrackPublication(Track.Source.Camera)
      const videoTrack = publication?.videoTrack as LocalVideoTrack | undefined

      if (!videoTrack) {
        await room.localParticipant.setCameraEnabled(true, getLiveKitCameraCaptureOptions())
        return
      }

      const settings = videoTrack.mediaStreamTrack.getSettings()
      const facing = settings.facingMode

      if (facing === 'user' || facing === 'environment') {
        await videoTrack.restartTrack({
          facingMode: facing === 'user' ? 'environment' : 'user',
        })
        return
      }

      const devices = await Room.getLocalDevices('videoinput', true)
      if (devices.length < 2) {
        setActionNotice('No other camera found on this device.')
        return
      }

      const activeId = room.getActiveDevice('videoinput') ?? settings.deviceId
      const currentIndex = Math.max(0, devices.findIndex((device) => device.deviceId === activeId))
      const nextDevice = devices[(currentIndex + 1) % devices.length]

      await videoTrack.restartTrack({
        deviceId: { exact: nextDevice.deviceId },
      })
    } catch {
      setActionNotice('Could not switch camera. Try turning the camera off and on.')
    } finally {
      setBusy(null)
    }
  }

  const toggleScreenShare = async () => {
    if (busy || !showScreenShare) return
    setBusy('screen')
    setActionNotice(null)

    try {
      if (room.localParticipant.isScreenShareEnabled) {
        await disableScreenShare(room)
        return
      }

      await enableScreenShare(room)
    } catch (err) {
      setActionNotice(screenShareErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const handleEnd = () => {
    room.disconnect()
    onEnd()
  }

  return createPortal(
    <>
      {actionNotice && <div className="yogstra-call-action-notice">{actionNotice}</div>}
      <div className="yogstra-call-controls" role="toolbar" aria-label="Call controls">
        <YogstraCallControlButton
          label="Mic"
          disabled={mic.pending}
          active={!mic.enabled}
          onClick={() => void mic.toggle()}
        >
          {mic.enabled ? <Mic size={20} /> : <MicOff size={20} />}
        </YogstraCallControlButton>

        <YogstraCallControlButton
          label="Camera"
          disabled={camera.pending}
          active={!camera.enabled}
          onClick={() => void camera.toggle()}
        >
          {camera.enabled ? <Video size={20} /> : <VideoOff size={20} />}
        </YogstraCallControlButton>

        <YogstraCallControlButton
          label="Flip"
          disabled={busy === 'flip'}
          onClick={() => void flipCamera()}
        >
          <SwitchCamera size={20} />
        </YogstraCallControlButton>

        {showScreenShare && (
          <YogstraCallControlButton
            label="Share"
            disabled={busy === 'screen'}
            active={screenSharing}
            onClick={() => void toggleScreenShare()}
          >
            <MonitorUp size={20} />
          </YogstraCallControlButton>
        )}

        <YogstraCallControlButton
          label={ringing ? cancelLabel : endLabel}
          danger
          onClick={handleEnd}
        >
          <PhoneOff size={20} />
        </YogstraCallControlButton>
      </div>
    </>,
    document.body,
  )
}

export function YogstraCallHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return createPortal(
    <div className="yogstra-call-header">
      <div className="yogstra-call-header-inner">
        <p className="yogstra-call-header-title">{title}</p>
        {subtitle ? <p className="yogstra-call-header-subtitle">{subtitle}</p> : null}
      </div>
    </div>,
    document.body,
  )
}
