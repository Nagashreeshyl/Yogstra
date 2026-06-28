import { verifyPaymentSignature } from '../server/razorpayClient.js'
import { fulfillPaidClassOrder } from '../server/fulfillPayment.js'

type FulfillRequest = {
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
}

type VercelRequest = {
  method?: string
  body?: FulfillRequest
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const orderId = req.body?.razorpay_order_id
  const paymentId = req.body?.razorpay_payment_id
  const signature = req.body?.razorpay_signature

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ error: 'Missing payment verification fields.' })
  }

  try {
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
    return res.status(500).json({ error: message })
  }
}
