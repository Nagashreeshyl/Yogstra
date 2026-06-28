import { verifyPaymentSignature } from '../server/razorpayClient.js'
import { fulfillPaidClassOrder } from '../server/fulfillPayment.js'
import { assertOrderFulfillAccess } from '../server/orderValidation.js'
import {
  extractBearerToken,
  enforceRateLimit,
  handleApiPreflight,
} from '../server/apiSecurity.js'

type FulfillRequest = {
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
}

type VercelRequest = {
  method?: string
  body?: FulfillRequest
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

  if (!enforceRateLimit(req, res, 'razorpay-fulfill', 30, 60_000)) return

  const orderId = req.body?.razorpay_order_id?.trim()
  const paymentId = req.body?.razorpay_payment_id?.trim()
  const signature = req.body?.razorpay_signature?.trim()

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ error: 'Missing payment verification fields.' })
  }

  try {
    const token = extractBearerToken(req)
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' })
    }
    await assertOrderFulfillAccess(token, orderId)

    const valid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
    })

    if (!valid) {
      return res.status(400).json({ error: 'Invalid payment signature.' })
    }

    const result = await fulfillPaidClassOrder({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
    })

    return res.status(200).json({
      ok: true,
      orderId: result.orderId,
      alreadyFulfilled: result.alreadyFulfilled,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not complete booking.'
    const status =
      message.includes('Authentication') ||
      message.includes('Invalid session') ||
      message.includes('your own payment')
        ? 401
        : message.includes('signature') || message.includes('not found')
          ? 400
          : 500
    return res.status(status).json({ error: message })
  }
}
