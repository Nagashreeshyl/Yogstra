export function sanitizeUpiId(value: string) {
  return value.trim().toLowerCase().slice(0, 256)
}

export function isValidUpiId(value: string) {
  const upi = sanitizeUpiId(value)
  return /^[a-z0-9._-]{2,256}@[a-z0-9]{2,64}$/i.test(upi)
}

export function buildUpiPaymentUri(params: {
  upiId: string
  payeeName: string
  amountInr: number
  note?: string
}) {
  const pa = sanitizeUpiId(params.upiId)
  const pn = encodeURIComponent(params.payeeName.trim().slice(0, 100) || 'Teacher')
  const am = params.amountInr.toFixed(2)
  const tn = encodeURIComponent((params.note ?? 'Yogstra teacher payout').slice(0, 100))
  return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`
}

export async function generateUpiQrDataUrl(upiUri: string) {
  const QRCode = await import('qrcode')
  return QRCode.toDataURL(upiUri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 280,
  })
}
