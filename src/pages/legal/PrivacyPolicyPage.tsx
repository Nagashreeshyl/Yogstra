import { LegalDocumentLayout } from '../../components/layout/LegalDocumentLayout'

export function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout title="Yogstra Privacy Policy" lastUpdated="June 2026">
      <LegalDocumentLayout.Section title="Introduction">
        <p>
          Yogstra (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates an online yoga coaching marketplace
          at yogstra.vercel.app. This Privacy Policy explains how we collect, use, store, and share
          your personal data when you use our platform as a student, teacher, or visitor.
        </p>
        <p>
          We comply with applicable Indian laws, including the Information Technology Act, 2000 and
          the Digital Personal Data Protection Act, 2023 (DPDP Act), to the extent they apply to our
          processing of personal data.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Data we collect">
        <ul className="list-disc pl-5 space-y-2">
          <li>Account information: name, email, phone number, password (hashed), role, profile photo</li>
          <li>Teacher information: bio, certifications, specializations, pricing, verification status, bank details for payouts</li>
          <li>Booking and payment data: class orders, schedules, transaction references from Razorpay</li>
          <li>Communications: direct messages, community posts, comments, chat reports</li>
          <li>Video session metadata: LiveKit room names, call/session status, timestamps</li>
          <li>Technical data: device/browser type, IP address, cookies, and usage logs</li>
        </ul>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="How we use it">
        <ul className="list-disc pl-5 space-y-2">
          <li>Create and manage your account and role (student, teacher, or admin)</li>
          <li>Facilitate teacher discovery, messaging, class bookings, and live video sessions</li>
          <li>Process payments and route teacher payouts through our payment partner</li>
          <li>Verify teachers, moderate community content, and respond to support requests</li>
          <li>Send transactional notifications (bookings, approvals, class reminders)</li>
          <li>Improve platform security, prevent fraud, and comply with legal obligations</li>
        </ul>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Who we share it with">
        <p>We do not sell your personal data. We share data only with trusted service providers necessary to operate Yogstra:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Razorpay</strong> — payment processing, order verification, and teacher payout routing</li>
          <li><strong>LiveKit</strong> — real-time video for live classes and direct video calls</li>
          <li><strong>Supabase</strong> — authentication, database, file storage (avatars, post media), and realtime updates</li>
          <li><strong>Cloudinary</strong> — media delivery and optimization where configured for images and video assets</li>
          <li><strong>Vercel</strong> — application hosting and serverless API routes</li>
        </ul>
        <p>
          Payments are processed by Razorpay. Video sessions are hosted via LiveKit. Profile photos,
          community media, and other uploads may be stored in Supabase Storage and/or delivered through
          Cloudinary.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="User rights">
        <p>Under applicable Indian law, you may have the right to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Access and review personal data we hold about you</li>
          <li>Correct inaccurate or incomplete information in your profile</li>
          <li>Withdraw consent where processing is consent-based</li>
          <li>Request erasure of your data, subject to legal and contractual retention requirements</li>
          <li>Lodge a grievance with our support team regarding data processing</li>
        </ul>
        <p>
          To exercise these rights, contact us at{' '}
          <a href="mailto:support@yogstra.com" className="text-primary hover:underline">support@yogstra.com</a>.
          We will respond within a reasonable timeframe as required by law.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Cookie policy">
        <p>
          Yogstra uses essential cookies and local storage to keep you signed in, remember preferences,
          and secure your session. We may use analytics cookies in the future to improve the product;
          when we do, we will update this policy and, where required, obtain consent.
        </p>
        <p>You can control cookies through your browser settings. Disabling essential cookies may prevent you from using certain features.</p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Data retention & security">
        <p>
          We retain account and transaction records as long as your account is active and as required
          for tax, payment reconciliation, and dispute resolution. We use encryption in transit (HTTPS),
          row-level security in our database, and access controls to protect your data.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Contact us">
        <p>
          For privacy questions or grievances under the DPDP Act, contact:
        </p>
        <p>
          Email:{' '}
          <a href="mailto:support@yogstra.com" className="text-primary hover:underline">support@yogstra.com</a>
          <br />
          Yogstra, Karnataka, India
        </p>
      </LegalDocumentLayout.Section>
    </LegalDocumentLayout>
  )
}
