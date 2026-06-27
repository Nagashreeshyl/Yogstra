declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
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

export async function openRazorpayCheckout(params: {
  amountInr: number
  studentName: string
  teacherName: string
  classType: string
  onSuccess: (paymentId: string) => void
  onDismiss?: () => void
}) {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined
  if (!key) {
    throw new Error(
      'Payment gateway is not configured. Add VITE_RAZORPAY_KEY_ID to your .env file.',
    )
  }

  await loadRazorpayScript()

  const amountPaise = Math.round(params.amountInr * 100)

  return new Promise<void>((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key,
      amount: amountPaise,
      currency: 'INR',
      name: 'Yogstra',
      description: `${params.classType} class with ${params.teacherName}`,
      prefill: { name: params.studentName },
      theme: { color: '#5BB8C4' },
      handler(response: { razorpay_payment_id: string }) {
        params.onSuccess(response.razorpay_payment_id)
        resolve()
      },
      modal: {
        ondismiss() {
          params.onDismiss?.()
          reject(new Error('Payment cancelled.'))
        },
      },
    })
    rzp.open()
  })
}
