export type EnrollmentCompleteDetail = {
  studentId: string
  teacherId: string
  orderId?: string
}

type Listener = (detail: EnrollmentCompleteDetail) => void

const listeners = new Set<Listener>()

/** Dispatched after server-verified payment fulfillment succeeds. */
export function dispatchEnrollmentComplete(detail: EnrollmentCompleteDetail) {
  listeners.forEach((listener) => listener(detail))
}

export function onEnrollmentComplete(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
