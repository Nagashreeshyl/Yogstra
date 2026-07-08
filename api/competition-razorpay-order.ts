import {
  createRazorpayOrder,
  getRazorpayAuthHeader,
} from '../server/razorpayClient.js'
import { getSupabaseAdmin, getSupabaseUserClient } from '../server/supabaseAdmin.js'
import {
  extractBearerToken,
  enforceRateLimit,
  handleApiPreflight,
} from '../server/apiSecurity.js'

type OrderRequest = {
  registrationId?: string
  amountInr?: number
}

type VercelRequest = {
  method?: string
  body?: OrderRequest
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

  if (!enforceRateLimit(req, res, 'competition-razorpay-order', 20, 60_000)) return

  const registrationId = req.body?.registrationId?.trim()
  const amountInr = Number(req.body?.amountInr ?? 0)

  if (!registrationId) {
    return res.status(400).json({ error: 'Registration id is required.' })
  }

  if (!Number.isFinite(amountInr) || amountInr <= 0) {
    return res.status(400).json({ error: 'Invalid payment amount.' })
  }

  const token = extractBearerToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' })
  }

  try {
    const { keyId } = getRazorpayAuthHeader()
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
      .select('id, competition_id, registrant_id, payment_status, category_id')
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

    let expectedFee = Number(competition.entry_fee ?? 0)
    if (registration.category_id) {
      const { data: category } = await userClient
        .from('competition_categories')
        .select('entry_fee_override')
        .eq('id', registration.category_id)
        .maybeSingle()
      if (category?.entry_fee_override != null) {
        expectedFee = Number(category.entry_fee_override)
      }
    }

    if (expectedFee <= 0) {
      return res.status(400).json({ error: 'This registration does not require payment.' })
    }

    if (Math.round(amountInr) !== Math.round(expectedFee)) {
      return res.status(400).json({ error: 'Payment amount does not match the entry fee.' })
    }

    const amountPaise = Math.round(expectedFee * 100)
    if (amountPaise < 100) {
      return res.status(400).json({ error: 'Minimum payment is ₹1.' })
    }

    const razorpayOrder = await createRazorpayOrder({
      amountPaise,
      receipt: `comp_${registrationId.replace(/-/g, '').slice(0, 12)}`,
      notes: {
        kind: 'competition_registration',
        registration_id: registrationId,
        student_id: user.id,
        competition_id: registration.competition_id,
      },
    })

    const admin = getSupabaseAdmin()
    await admin
      .from('competition_registrations')
      .update({ payment_reference: razorpayOrder.id })
      .eq('id', registrationId)

    return res.status(200).json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount ?? amountPaise,
      currency: razorpayOrder.currency ?? 'INR',
      keyId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create payment order.'
    const status = /not configured|razorpay/i.test(message) ? 503 : 500
    return res.status(status).json({ error: message })
  }
}
