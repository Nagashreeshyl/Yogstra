import { createLiveKitToken } from '../server/livekitToken.js'
import { assertAuthenticatedUser } from '../server/supabaseAdmin.js'
import { assertLiveKitRoomAccess } from '../server/orderValidation.js'
import { extractBearerToken, enforceRateLimit, handleApiPreflight } from '../server/apiSecurity.js'
import { sanitizeText } from '../server/validateInput.js'

type TokenRequest = {
  roomName?: string
  participantName?: string
  participantId?: string
}

type VercelRequest = {
  method?: string
  body?: TokenRequest
  headers?: Record<string, string | string[] | undefined>
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  send: (body: string) => void
  setHeader: (name: string, value: string) => void
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleApiPreflight(req, res) === 'done') return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!enforceRateLimit(req, res, 'livekit-token', 60, 60_000)) return

  try {
    const token = extractBearerToken(req)
    const user = await assertAuthenticatedUser(token)
    const roomName = sanitizeText(req.body?.roomName, 120)
    const participantName = sanitizeText(req.body?.participantName, 120)

    if (!roomName) {
      return res.status(400).json({ error: 'roomName is required.' })
    }

    await assertLiveKitRoomAccess(roomName, token!, user)

    const result = await createLiveKitToken({
      roomName,
      participantName: participantName || 'Participant',
      participantId: user.userId,
    })

    return res.status(200).json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create video token.'
    const status =
      message.includes('Authentication') ||
      message.includes('Invalid session') ||
      message.includes('access to this video room')
        ? 401
        : message.includes('required')
          ? 400
          : 500
    return res.status(status).json({ error: message })
  }
}
