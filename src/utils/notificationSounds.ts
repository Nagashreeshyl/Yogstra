let sharedContext: AudioContext | null = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!sharedContext) {
    sharedContext = new AudioContext()
  }
  if (sharedContext.state === 'suspended') {
    void sharedContext.resume()
  }
  return sharedContext
}

export function playMessageReceivedSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(740, now)
  osc.frequency.setValueAtTime(988, now + 0.08)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.36)
}

export function startIncomingCallRing(): () => void {
  const ctx = getAudioContext()
  if (!ctx) return () => undefined

  let stopped = false
  let intervalId: ReturnType<typeof setInterval> | null = null

  const playPulse = () => {
    if (stopped) return
    const now = ctx.currentTime
    for (let i = 0; i < 2; i += 1) {
      const start = now + i * 0.45
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(i === 0 ? 440 : 480, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.38)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.4)
    }
  }

  playPulse()
  intervalId = setInterval(playPulse, 2200)

  return () => {
    stopped = true
    if (intervalId) clearInterval(intervalId)
  }
}

const DEFAULT_RING_DURATION_MS = 30_000

export function startIncomingCallRingFor(durationMs = DEFAULT_RING_DURATION_MS): () => void {
  const stop = startIncomingCallRing()
  const timer = setTimeout(() => stop(), durationMs)
  return () => {
    clearTimeout(timer)
    stop()
  }
}
