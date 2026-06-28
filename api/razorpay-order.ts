import {
  createRazorpayOrder,
  getRazorpayAuthHeader,
} from '../server/razorpayClient.js'
import {
  assertStudentAccessToken,
} from '../server/supabaseAdmin.js'
import {
  createPendingClassOrder,
  getTeacherLinkedAccountId,
  prepareOrderSplit,
  type PendingClassOrderInput,
} from '../server/fulfillPayment.js'
import { validatePendingOrderRequest } from '../server/orderValidation.js'
import { sanitizeText } from '../server/validateInput.js'
import {
  extractBearerToken,
  enforceRateLimit,
  handleApiPreflight,
} from '../server/apiSecurity.js'

type OrderRequest = {
  amountInr?: number
  receipt?: string
  teacherId?: string
  orderInput?: PendingClassOrderInput
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

  if (!enforceRateLimit(req, res, 'razorpay-order', 20, 60_000)) return

  try {
    const studentId = await assertStudentAccessToken(extractBearerToken(req))
    const { keyId } = getRazorpayAuthHeader()
    const amountInr = Number(req.body?.amountInr)
    const teacherId = req.body?.teacherId
    const orderInput = req.body?.orderInput

    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount.' })
    }

    if (!teacherId || !orderInput?.threadId) {
      return res.status(400).json({ error: 'Missing booking details for payment.' })
    }

    const sanitizedInput: PendingClassOrderInput = {
      ...orderInput,
      studentId,
      studentName: sanitizeText(orderInput.studentName, 120),
      teacherId,
      teacherName: sanitizeText(orderInput.teacherName, 120),
      threadId: orderInput.threadId,
      notes: sanitizeText(orderInput.notes, 2000),
      classType: orderInput.classType === 'group' ? 'group' : '1:1',
      duration: orderInput.duration === 'week' ? 'week' : 'month',
    }

    await validatePendingOrderRequest({
      studentId,
      amountInr,
      teacherId,
      threadId: sanitizedInput.threadId,
      orderInput: sanitizedInput,
    })

    const split = await prepareOrderSplit(amountInr)
    if (split.grossPaise < 100) {
      return res.status(400).json({ error: 'Minimum payment is ₹1.' })
    }

    const linkedAccountId = await getTeacherLinkedAccountId(teacherId)
    const rawReceipt = req.body?.receipt ?? `yogstra_${Date.now()}`
    const receipt = sanitizeText(String(rawReceipt), 40)

    const razorpayOrder = await createRazorpayOrder({
      amountPaise: split.grossPaise,
      receipt,
      teacherLinkedAccountId: linkedAccountId,
      teacherAmountPaise: linkedAccountId ? split.teacherAmountPaise : undefined,
      notes: {
        teacher_id: teacherId,
        student_id: studentId,
      },
    })

    await createPendingClassOrder(sanitizedInput, razorpayOrder.id, split)

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
    const status =
      message.includes('Authentication') ||
      message.includes('Student access') ||
      message.includes('Invalid session')
        ? 401
        : message.includes('amount') ||
            message.includes('coupon') ||
            message.includes('thread') ||
            message.includes('Teacher')
          ? 400
          : message.includes('not configured')
            ? 500
            : 502
    return res.status(status).json({ error: message })
  }
}
