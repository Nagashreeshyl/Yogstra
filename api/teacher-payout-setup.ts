import { createRazorpayLinkedAccount } from '../server/razorpayClient.js'
import {
  assertTeacherAccessToken,
  getSupabaseAdmin,
} from '../server/supabaseAdmin.js'

type SetupRequest = {
  teacherId?: string
  accountHolderName?: string
  accountNumber?: string
  ifsc?: string
  pan?: string
}

type VercelRequest = {
  method?: string
  body?: SetupRequest
  headers?: Record<string, string | string[] | undefined>
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
}

function authToken(req: VercelRequest) {
  const header = req.headers?.authorization ?? req.headers?.Authorization
  const value = Array.isArray(header) ? header[0] : header
  return value?.startsWith('Bearer ') ? value.slice(7) : undefined
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const teacherId = req.body?.teacherId
  const accountHolderName = req.body?.accountHolderName?.trim()
  const accountNumber = req.body?.accountNumber?.trim()
  const ifsc = req.body?.ifsc?.trim().toUpperCase()
  const pan = req.body?.pan?.trim().toUpperCase()

  if (!teacherId || !accountHolderName || !accountNumber || !ifsc) {
    return res.status(400).json({ error: 'All bank details are required.' })
  }

  try {
    await assertTeacherAccessToken(authToken(req), teacherId)

    const supabase = getSupabaseAdmin()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', teacherId)
      .maybeSingle()

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Teacher profile not found.' })
    }

    await supabase
      .from('teacher_profiles')
      .update({
        account_holder_name: accountHolderName,
        bank_account_number: accountNumber,
        bank_ifsc: ifsc,
        pan_number: pan ?? null,
        payout_onboarding_status: 'pending',
      })
      .eq('id', teacherId)

    const account = await createRazorpayLinkedAccount({
      email: `${teacherId.slice(0, 8)}@payouts.yogstra.app`,
      phone: profile.phone ?? '9999999999',
      contactName: profile.full_name ?? 'Teacher',
      accountHolderName,
      accountNumber,
      ifsc,
      pan,
    })

    await supabase
      .from('teacher_profiles')
      .update({
        razorpay_linked_account_id: account.id,
        payout_onboarding_status: account.status === 'active' ? 'active' : 'pending',
      })
      .eq('id', teacherId)

    return res.status(200).json({
      ok: true,
      linkedAccountId: account.id,
      status: account.status ?? 'pending',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not set up payouts.'
    const status = message.includes('Authentication') || message.includes('own payout') ? 401 : 500
    return res.status(status).json({ error: message })
  }
}
