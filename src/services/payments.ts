import type { ClassOrderInput } from './classOrders'

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: RazorpayFailureResponse) => void) => void
    }
  }
}

type RazorpayFailureResponse = {
  error?: {
    description?: string
    reason?: string
    code?: string
  }
}

type RazorpaySuccessResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

let scriptPromise: Promise<void> | null = null

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load Razorpay checkout.'))
    document.body.appendChild(script)
  })

  return scriptPromise
}

function normalizeInrAmount(amountInr: number) {
  const rounded = Math.round(amountInr)
  if (!Number.isFinite(rounded) || rounded <= 0) {
    throw new Error('Invalid payment amount.')
  }
  const paise = rounded * 100
  if (paise < 100) {
    throw new Error('Minimum payment is ₹1.')
  }
  return { inr: rounded, paise }
}

function trimEnv(value: string | undefined) {
  return value?.trim() ?? ''
}

async function createRazorpayOrder(params: {
  amountInr: number
  receipt?: string
  teacherId: string
  orderInput: ClassOrderInput
}) {
  const response = await fetch('/api/razorpay-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amountInr: params.amountInr,
      receipt: params.receipt,
      teacherId: params.teacherId,
      orderInput: params.orderInput,
    }),
  })

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    if (import.meta.env.DEV) return null
    throw new Error(
      'Payment service is unavailable. Refresh the page and try again in a moment.',
    )
  }

  const body = (await response.json().catch(() => ({}))) as {
    orderId?: string
    keyId?: string
    commissionPercent?: number
    platformFeeInr?: number
    teacherAmountInr?: number
    routeEnabled?: boolean
    error?: string
  }

  if (!response.ok || !body.orderId) {
    throw new Error(body.error ?? 'Could not initialize Razorpay payment.')
  }

  return {
    orderId: body.orderId,
    keyId: body.keyId ? trimEnv(body.keyId) : undefined,
    commissionPercent: body.commissionPercent,
    platformFeeInr: body.platformFeeInr,
    teacherAmountInr: body.teacherAmountInr,
    routeEnabled: body.routeEnabled,
  }
}

async function fulfillVerifiedPayment(response: RazorpaySuccessResponse) {
  const res = await fetch('/api/razorpay-fulfill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    }),
  })

  const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
  if (!res.ok || !body.ok) {
    throw new Error(body.error ?? 'Payment succeeded but booking could not be completed.')
  }
}

export async function openRazorpayCheckout(params: {
  amountInr: number
  studentName: string
  studentEmail?: string
  teacherId: string
  teacherName: string
  classType: string
  orderInput: ClassOrderInput
  receipt?: string
  onSuccess: () => void | Promise<void>
  onDismiss?: () => void
}) {
  const key = trimEnv(import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined)
  if (!key) {
    throw new Error(
      'Payment gateway is not configured. Add VITE_RAZORPAY_KEY_ID to your .env file.',
    )
  }

  const { inr, paise } = normalizeInrAmount(params.amountInr)
  await loadRazorpayScript()

  const serverOrder = await createRazorpayOrder({
    amountInr: inr,
    receipt: params.receipt,
    teacherId: params.teacherId,
    orderInput: params.orderInput,
  })

  if (!serverOrder && !import.meta.env.DEV) {
    throw new Error(
      'Payment service is unavailable. Refresh the page and try again in a moment.',
    )
  }

  return new Promise<void>((resolve, reject) => {
    let settled = false
    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      fn()
    }

    const prefill: Record<string, string> = { name: params.studentName }
    if (params.studentEmail) prefill.email = params.studentEmail

    const descriptionParts = [
      `${params.classType} class with ${params.teacherName}`,
      serverOrder?.commissionPercent != null
        ? `Platform fee ${serverOrder.commissionPercent}%`
        : null,
    ].filter(Boolean)

    const options: Record<string, unknown> = {
      key: serverOrder?.keyId ?? key,
      name: 'Yogstra',
      description: descriptionParts.join(' · '),
      prefill,
      theme: { color: '#5BB8C4' },
      handler(response: RazorpaySuccessResponse) {
        void (async () => {
          try {
            if (serverOrder?.orderId) {
              await fulfillVerifiedPayment(response)
            }
            await params.onSuccess()
            finish(() => resolve())
          } catch (err) {
            params.onDismiss?.()
            finish(() =>
              reject(
                err instanceof Error
                  ? err
                  : new Error('Payment succeeded but booking could not be completed.'),
              ),
            )
          }
        })()
      },
      modal: {
        ondismiss() {
          params.onDismiss?.()
          finish(() => reject(new Error('Payment cancelled.')))
        },
      },
    }

    if (serverOrder?.orderId) {
      options.order_id = serverOrder.orderId
    } else {
      options.amount = paise
      options.currency = 'INR'
    }

    const rzp = new window.Razorpay!(options)

    rzp.on('payment.failed', (response: RazorpayFailureResponse) => {
      params.onDismiss?.()
      finish(() =>
        reject(
          new Error(
            response.error?.description ??
              response.error?.reason ??
              'Payment failed. Please try again.',
          ),
        ),
      )
    })

    rzp.open()
  })
}
