import { AccessToken } from 'livekit-server-sdk'

type TokenRequest = {
  roomName?: string
  participantName?: string
  participantId?: string
}

type VercelRequest = {
  method?: string
  body?: TokenRequest
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
}

function trimEnv(value: string | undefined) {
  return value?.trim() ?? ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = trimEnv(process.env.LIVEKIT_API_KEY)
  const apiSecret = trimEnv(process.env.LIVEKIT_API_SECRET)
  const serverUrl = trimEnv(process.env.VITE_LIVEKIT_URL ?? process.env.LIVEKIT_URL)

  if (!apiKey || !apiSecret || !serverUrl) {
    return res.status(500).json({
      error:
        'LiveKit is not configured. Add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and VITE_LIVEKIT_URL in env vars.',
    })
  }

  const roomName = req.body?.roomName?.trim()
  const participantName = req.body?.participantName?.trim()
  const participantId = req.body?.participantId?.trim()

  if (!roomName || !participantName || !participantId) {
    return res.status(400).json({ error: 'roomName, participantName, and participantId are required.' })
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

  return res.status(200).json({
    token: await token.toJwt(),
    serverUrl,
  })
}
