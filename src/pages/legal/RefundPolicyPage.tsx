import { LegalDocumentLayout } from '../../components/layout/LegalDocumentLayout'

export function RefundPolicyPage() {
  return (
    <LegalDocumentLayout title="Refund Policy" lastUpdated="June 2026">
      <LegalDocumentLayout.Section title="Overview">
        <p>
          Yogstra wants fair outcomes for students and teachers. This Refund Policy applies to online
          class bookings paid through the platform. By completing a purchase, you agree to the terms below.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Class not attended">
        <p>
          If you have <strong>not attended</strong> a scheduled class and cancel within{' '}
          <strong>7 days</strong> of payment, you are eligible for a <strong>full refund</strong> of the
          class fee paid (excluding payment gateway charges retained by the payment processor, if any).
        </p>
        <p>
          To request a refund, email{' '}
          <a href="mailto:support@yogstra.com" className="text-primary hover:underline">support@yogstra.com</a>{' '}
          with your registered email, teacher name, booking date, and payment reference.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Class attended">
        <p>
          If you <strong>attended</strong> a class — including joining a live session or completing a
          scheduled 1-on-1 or group session — <strong>no refund</strong> will be issued. This includes
          partial attendance where the session was delivered as booked.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Technical issues">
        <p>
          If a class could not be delivered due to a verified platform or video infrastructure failure
          on Yogstra&apos;s side, we may issue a full or partial refund at our discretion. Issues caused
          by a user&apos;s device, internet connection, or third-party network are generally not eligible.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Processing time">
        <p>
          Approved refunds are processed back to the original payment method within 5–10
          business days, depending on your bank or card issuer.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Contact">
        <p>
          Refund requests and questions:{' '}
          <a href="mailto:support@yogstra.com" className="text-primary hover:underline">support@yogstra.com</a>
        </p>
      </LegalDocumentLayout.Section>
    </LegalDocumentLayout>
  )
}
