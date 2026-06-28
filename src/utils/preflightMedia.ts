/** Warm up camera/mic while a user gesture (tap) is still active — required on mobile. */
export async function preflightCameraAndMic(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch {
    return false
  }
}
