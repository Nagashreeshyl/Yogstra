type OrderRequest = {
  amountInr?: number
  receipt?: string
}

type VercelRequest = {
  method?: string
  body?: OrderRequest
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
}

function trimEnv(value: string | undefined) {
  return value?.trim() ?? ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const keyId = trimEnv(process.env.RAZORPAY_KEY_ID ?? process.env.VITE_RAZORPAY_KEY_ID)
  const keySecret = trimEnv(process.env.RAZORPAY_KEY_SECRET)

  if (!keyId || !keySecret) {
    return res.status(500).json({
      error: 'Razorpay is not configured on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel env vars.',
    })
  }

  const amountInr = Number(req.body?.amountInr)
  if (!Number.isFinite(amountInr) || amountInr <= 0) {
    return res.status(400).json({ error: 'Invalid payment amount.' })
  }

  const amountPaise = Math.round(amountInr * 100)
  if (amountPaise < 100) {
    return res.status(400).json({ error: 'Minimum payment is ₹1.' })
  }

  const rawReceipt = req.body?.receipt ?? `yogstra_${Date.now()}`
  const receipt = String(rawReceipt).slice(0, 40)
  const auth = globalThis.btoa(`${keyId}:${keySecret}`)

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt,
      }),
    })

    const data = (await response.json()) as {
      id?: string
      amount?: number
      currency?: string
      error?: { description?: string; reason?: string }
    }

    if (!response.ok || !data.id) {
      return res.status(response.status || 502).json({
        error:
          data.error?.description ??
          data.error?.reason ??
          'Razorpay could not create a payment order.',
      })
    }

    return res.status(200).json({
      orderId: data.id,
      amount: data.amount ?? amountPaise,
      currency: data.currency ?? 'INR',
      keyId,
    })
  } catch {
    return res.status(502).json({ error: 'Could not reach Razorpay. Try again in a moment.' })
  }
}
