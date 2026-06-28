import { createRazorpayLinkedAccount } from '../server/razorpayClient.js'
import {
  assertTeacherAccessToken,
  getSupabaseUserClient,
} from '../server/supabaseAdmin.js'
import {
  extractBearerToken,
  handleApiPreflight,
} from '../server/apiSecurity.js'
import {
  sanitizeAccountHolderName,
  sanitizeBankAccountNumber,
  sanitizeIfsc,
  sanitizePan,
} from '../server/validateInput.js'

type SetupRequest = {
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
  send: (body: string) => void
  setHeader: (name: string, value: string) => void
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleApiPreflight(req, res) === 'done') return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = extractBearerToken(req)

  try {
    const teacherId = await assertTeacherAccessToken(token)

    let accountHolderName: string
    let accountNumber: string
    let ifsc: string
    let pan: string | undefined

    try {
      accountHolderName = sanitizeAccountHolderName(req.body?.accountHolderName ?? '')
      accountNumber = sanitizeBankAccountNumber(req.body?.accountNumber ?? '')
      ifsc = sanitizeIfsc(req.body?.ifsc ?? '')
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        throw new Error('Invalid IFSC code.')
      }
      pan = sanitizePan(req.body?.pan)
    } catch (validationError) {
      const message =
        validationError instanceof Error ? validationError.message : 'Invalid bank details.'
      return res.status(400).json({ error: message })
    }

    const supabase = getSupabaseUserClient(token!)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', teacherId)
      .maybeSingle()

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Teacher profile not found.' })
    }

    const account = await createRazorpayLinkedAccount({
      email: `${teacherId.slice(0, 8)}@payouts.yogstra.app`,
      phone: profile.phone ?? '9999999999',
      contactName: profile.full_name ?? 'Teacher',
      accountHolderName,
      accountNumber,
      ifsc,
      pan,
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Razorpay linked account could not be created.'
      throw new Error(
        message.includes('Route') || message.includes('route') || message.includes('not enabled')
          ? 'Razorpay Route is not enabled on this account yet. Bank details can still be saved on Yogstra.'
          : message,
      )
    })

    return res.status(200).json({
      ok: true,
      linkedAccountId: account.id,
      status: account.status ?? 'pending',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not set up payouts.'
    const status =
      message.includes('Authentication') ||
      message.includes('Teacher access') ||
      message.includes('Invalid session')
        ? 401
        : 500
    return res.status(status).json({ error: message })
  }
}
