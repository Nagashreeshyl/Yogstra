import { getSupabaseAdmin, getSupabaseUserClient } from '../server/supabaseAdmin.js'
import {
  extractBearerToken,
  enforceRateLimit,
  handleApiPreflight,
} from '../server/apiSecurity.js'

type CompleteRequest = {
  registrationId?: string
  amount?: number
}

type VercelRequest = {
  method?: string
  body?: CompleteRequest
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

  if (!enforceRateLimit(req, res, 'competition-registration-complete', 20, 60_000)) return

  const registrationId = req.body?.registrationId?.trim()
  void Number(req.body?.amount ?? 0)

  if (!registrationId) {
    return res.status(400).json({ error: 'Registration id is required.' })
  }

  const token = extractBearerToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' })
  }

  try {
    const userClient = getSupabaseUserClient(token)
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid session.' })
    }

    const { data: registration, error: regError } = await userClient
      .from('competition_registrations')
      .select('id, competition_id, registrant_id, payment_status, status')
      .eq('id', registrationId)
      .maybeSingle()

    if (regError || !registration) {
      return res.status(404).json({ error: 'Registration not found.' })
    }

    if (registration.registrant_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized for this registration.' })
    }

    if (registration.payment_status === 'paid' || registration.payment_status === 'waived') {
      return res.status(200).json({ ok: true, alreadyComplete: true })
    }

    const { data: competition, error: compError } = await userClient
      .from('competitions')
      .select('id, entry_fee')
      .eq('id', registration.competition_id)
      .maybeSingle()

    if (compError || !competition) {
      return res.status(404).json({ error: 'Competition not found.' })
    }

    const entryFee = Number(competition.entry_fee ?? 0)
    if (entryFee > 0) {
      return res.status(501).json({
        error:
          'Paid competition entry requires Razorpay integration. Contact the organizer or try again after payment is enabled.',
      })
    }

    const admin = getSupabaseAdmin()
    const paymentStatus = 'waived'
    const now = new Date().toISOString()

    const { error: updateError } = await admin
      .from('competition_registrations')
      .update({
        payment_status: paymentStatus,
        payment_amount: null,
        status: 'confirmed',
        confirmed_at: now,
      })
      .eq('id', registrationId)

    if (updateError) {
      return res.status(500).json({ error: 'Could not complete registration.' })
    }

    await admin
      .from('competition_participants')
      .update({ status: 'registered' })
      .eq('registration_id', registrationId)
      .neq('status', 'withdrawn')

    return res.status(200).json({ ok: true })
  } catch {
    return res.status(500).json({ error: 'Registration completion failed.' })
  }
}
