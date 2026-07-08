import { getSupabaseAdmin, getSupabaseUserClient } from '../server/supabaseAdmin.js'
import { verifyPaymentSignature } from '../server/razorpayClient.js'
import {
  extractBearerToken,
  enforceRateLimit,
  handleApiPreflight,
} from '../server/apiSecurity.js'

type CompleteRequest = {
  registrationId?: string
  amount?: number
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
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
  const amountInr = Number(req.body?.amount ?? 0)
  const razorpayOrderId = req.body?.razorpay_order_id?.trim()
  const razorpayPaymentId = req.body?.razorpay_payment_id?.trim()
  const razorpaySignature = req.body?.razorpay_signature?.trim()

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
      .select('id, competition_id, registrant_id, payment_status, status, category_id, payment_reference')
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

    let entryFee = Number(competition.entry_fee ?? 0)
    if (registration.category_id) {
      const { data: category } = await userClient
        .from('competition_categories')
        .select('entry_fee_override')
        .eq('id', registration.category_id)
        .maybeSingle()
      if (category?.entry_fee_override != null) {
        entryFee = Number(category.entry_fee_override)
      }
    }

    let paymentStatus: 'paid' | 'waived' = 'waived'
    let paymentAmount: number | null = null
    let paymentReference: string | null = null

    if (entryFee > 0) {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ error: 'Payment verification is required for this entry fee.' })
      }

      if (
        registration.payment_reference &&
        registration.payment_reference !== razorpayOrderId
      ) {
        return res.status(400).json({ error: 'Payment order does not match this registration.' })
      }

      const signatureValid = verifyPaymentSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      })
      if (!signatureValid) {
        return res.status(400).json({ error: 'Payment verification failed.' })
      }

      const expectedAmount = Math.round(entryFee)
      const submittedAmount = Math.round(amountInr)
      if (submittedAmount > 0 && submittedAmount !== expectedAmount) {
        return res.status(400).json({ error: 'Payment amount does not match the entry fee.' })
      }

      paymentStatus = 'paid'
      paymentAmount = expectedAmount
      paymentReference = razorpayPaymentId
    }

    const admin = getSupabaseAdmin()
    const now = new Date().toISOString()

    const { error: updateError } = await admin
      .from('competition_registrations')
      .update({
        payment_status: paymentStatus,
        payment_amount: paymentAmount,
        payment_reference: paymentReference,
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
