import {
  createRazorpayOrder,
  getRazorpayAuthHeader,
} from '../server/razorpayClient.js'
import {
  createPendingClassOrder,
  getTeacherLinkedAccountId,
  prepareOrderSplit,
  type PendingClassOrderInput,
} from '../server/fulfillPayment.js'

type OrderRequest = {
  amountInr?: number
  receipt?: string
  teacherId?: string
  orderInput?: PendingClassOrderInput
}

type VercelRequest = {
  method?: string
  body?: OrderRequest
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
    const { keyId } = getRazorpayAuthHeader()
    const amountInr = Number(req.body?.amountInr)
    const teacherId = req.body?.teacherId
    const orderInput = req.body?.orderInput

    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount.' })
    }

    if (!teacherId || !orderInput) {
      return res.status(400).json({ error: 'Missing booking details for payment.' })
    }

    const split = await prepareOrderSplit(amountInr)
    if (split.grossPaise < 100) {
      return res.status(400).json({ error: 'Minimum payment is ₹1.' })
    }

    const linkedAccountId = await getTeacherLinkedAccountId(teacherId)
    const rawReceipt = req.body?.receipt ?? `yogstra_${Date.now()}`
    const receipt = String(rawReceipt).slice(0, 40)

    const razorpayOrder = await createRazorpayOrder({
      amountPaise: split.grossPaise,
      receipt,
      teacherLinkedAccountId: linkedAccountId,
      teacherAmountPaise: linkedAccountId ? split.teacherAmountPaise : undefined,
      notes: {
        teacher_id: teacherId,
        student_id: orderInput.studentId,
      },
    })

    await createPendingClassOrder(orderInput, razorpayOrder.id, split)

    return res.status(200).json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount ?? split.grossPaise,
      currency: razorpayOrder.currency ?? 'INR',
      keyId,
      commissionPercent: split.commissionPercent,
      platformFeeInr: split.platformFeeInr,
      teacherAmountInr: split.teacherAmountInr,
      routeEnabled: Boolean(linkedAccountId),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create payment order.'
    const status = message.includes('not configured') ? 500 : 502
    return res.status(status).json({ error: message })
  }
}
