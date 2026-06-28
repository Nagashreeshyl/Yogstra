import { verifyWebhookSignature } from '../server/razorpayClient.js'
import { fulfillPaidClassOrder } from '../server/fulfillPayment.js'

type VercelRequest = {
  method?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  send: (body: string) => void
}

export const config = {
  api: {
    bodyParser: false,
  },
}

async function readRawBody(req: VercelRequest): Promise<string> {
  if (typeof req.body === 'string') return req.body
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8')
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body)

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const readable = req as unknown as NodeJS.ReadableStream
    readable.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    readable.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    readable.on('error', reject)
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const rawBody = await readRawBody(req)
    const signatureHeader = req.headers?.['x-razorpay-signature']
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ error: 'Invalid webhook signature.' })
    }

    const payload = JSON.parse(rawBody) as {
      event?: string
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string } }
        transfer?: { entity?: { id?: string; source_id?: string } }
      }
    }

    if (payload.event === 'payment.captured') {
      const payment = payload.payload?.payment?.entity
      if (payment?.order_id && payment.id) {
        await fulfillPaidClassOrder({
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
        })
      }
    }

    if (payload.event === 'transfer.processed') {
      const transfer = payload.payload?.transfer?.entity
      const paymentId = transfer?.source_id
      if (transfer?.id && paymentId) {
        const { getSupabaseAdmin } = await import('../server/supabaseAdmin.js')
        const supabase = getSupabaseAdmin()
        await supabase
          .from('payouts')
          .update({ status: 'paid', razorpay_transfer_id: transfer.id })
          .eq('razorpay_payment_id', paymentId)
      }
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook processing failed.'
    return res.status(500).json({ error: message })
  }
}
