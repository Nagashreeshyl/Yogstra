import { AccessToken } from 'livekit-server-sdk'

export type LiveKitTokenInput = {
  roomName: string
  participantName: string
  participantId: string
}

function trimEnv(value: string | undefined) {
  return value?.trim() ?? ''
}

export function getLiveKitEnv() {
  return {
    apiKey: trimEnv(process.env.LIVEKIT_API_KEY),
    apiSecret: trimEnv(process.env.LIVEKIT_API_SECRET),
    serverUrl: trimEnv(process.env.VITE_LIVEKIT_URL ?? process.env.LIVEKIT_URL),
  }
}

export async function createLiveKitToken(input: LiveKitTokenInput) {
  const { apiKey, apiSecret, serverUrl } = getLiveKitEnv()

  if (!apiKey || !apiSecret || !serverUrl) {
    throw new Error(
      'LiveKit is not configured. Add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL (or VITE_LIVEKIT_URL) to your env.',
    )
  }

  const roomName = input.roomName?.trim()
  const participantName = input.participantName?.trim()
  const participantId = input.participantId?.trim()

  if (!roomName || !participantName || !participantId) {
    throw new Error('roomName, participantName, and participantId are required.')
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantId,
    name: participantName,
    ttl: '2h',
  })

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })

  return {
    token: await token.toJwt(),
    serverUrl,
  }
}
