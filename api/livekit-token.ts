import { createLiveKitToken } from '../server/livekitToken'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const result = await createLiveKitToken({
      roomName: req.body?.roomName ?? '',
      participantName: req.body?.participantName ?? '',
      participantId: req.body?.participantId ?? '',
    })
    return res.status(200).json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create video token.'
    const status = message.includes('required') ? 400 : 500
    return res.status(status).json({ error: message })
  }
}
