import { createHmac } from 'node:crypto'

export function trimEnv(value: string | undefined) {
  return value?.trim() ?? ''
}

export function getRazorpayAuthHeader() {
  const keyId = trimEnv(process.env.RAZORPAY_KEY_ID ?? process.env.VITE_RAZORPAY_KEY_ID)
  const keySecret = trimEnv(process.env.RAZORPAY_KEY_SECRET)

  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to env vars.',
    )
  }

  return {
    keyId,
    keySecret,
    authorization: `Basic ${globalThis.btoa(`${keyId}:${keySecret}`)}`,
  }
}

export async function razorpayRequest<T>(
  path: string,
  init?: Omit<RequestInit, 'body'> & { body?: unknown },
): Promise<T> {
  const { authorization } = getRazorpayAuthHeader()
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init?.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
      ...(init?.headers ?? {}),
    },
    body: init?.body != null ? JSON.stringify(init.body) : undefined,
  })

  const data = (await response.json().catch(() => ({}))) as T & {
    error?: { description?: string; reason?: string }
  }

  if (!response.ok) {
    throw new Error(
      data.error?.description ??
        data.error?.reason ??
        `Razorpay request failed (${response.status}).`,
    )
  }

  return data
}

export type PaymentSplit = {
  grossInr: number
  grossPaise: number
  platformFeeInr: number
  platformFeePaise: number
  teacherAmountInr: number
  teacherAmountPaise: number
  commissionPercent: number
}

export function calculatePaymentSplit(grossInr: number, commissionPercent: number): PaymentSplit {
  const grossPaise = Math.round(grossInr * 100)
  const platformFeePaise = Math.round((grossPaise * commissionPercent) / 100)
  const teacherAmountPaise = grossPaise - platformFeePaise

  return {
    grossInr,
    grossPaise,
    platformFeeInr: platformFeePaise / 100,
    platformFeePaise,
    teacherAmountInr: teacherAmountPaise / 100,
    teacherAmountPaise,
    commissionPercent,
  }
}

export async function getCommissionPercent(
  supabase: ReturnType<typeof import('./supabaseAdmin.js').getSupabaseAdmin>,
) {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('commission_percent')
    .eq('id', 'default')
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return 10
    throw error
  }

  const value = Number(data?.commission_percent ?? 10)
  return Number.isFinite(value) ? value : 10
}

export async function createRazorpayOrder(params: {
  amountPaise: number
  receipt: string
  teacherLinkedAccountId?: string | null
  teacherAmountPaise?: number
  notes?: Record<string, string>
}) {
  const body: Record<string, unknown> = {
    amount: params.amountPaise,
    currency: 'INR',
    receipt: params.receipt.slice(0, 40),
    notes: params.notes ?? {},
  }

  if (
    params.teacherLinkedAccountId &&
    params.teacherAmountPaise &&
    params.teacherAmountPaise > 0
  ) {
    body.transfers = [
      {
        account: params.teacherLinkedAccountId,
        amount: params.teacherAmountPaise,
        currency: 'INR',
        on_hold: false,
      },
    ]
  }

  return razorpayRequest<{ id: string; amount: number; currency: string }>('/orders', {
    method: 'POST',
    body,
  })
}

export async function createRazorpayLinkedAccount(params: {
  email: string
  phone: string
  contactName: string
  accountHolderName: string
  accountNumber: string
  ifsc: string
  pan?: string
}) {
  return razorpayRequest<{ id: string; status?: string }>('/accounts', {
    method: 'POST',
    body: {
      email: params.email,
      phone: params.phone,
      type: 'route',
      legal_business_name: params.contactName.slice(0, 200),
      business_type: 'individual',
      contact_name: params.contactName.slice(0, 120),
      profile: {
        category: 'education',
        subcategory: 'online_education',
      },
      bank_account: {
        name: params.accountHolderName.slice(0, 120),
        ifsc: params.ifsc.toUpperCase(),
        account_number: params.accountNumber,
      },
      ...(params.pan ? { legal_info: { pan: params.pan.toUpperCase() } } : {}),
    },
  })
}

export function verifyPaymentSignature(params: {
  orderId: string
  paymentId: string
  signature: string
}) {
  const { keySecret } = getRazorpayAuthHeader()
  const expected = createHmac('sha256', keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex')

  return expected === params.signature
}

export function verifyWebhookSignature(rawBody: string, signature: string | undefined) {
  const secret = trimEnv(process.env.RAZORPAY_WEBHOOK_SECRET)
  if (!secret || !signature) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  return expected === signature
}
