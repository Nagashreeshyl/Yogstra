import { LegalDocumentLayout } from '../../components/layout/LegalDocumentLayout'

export function TermsOfServicePage() {
  return (
    <LegalDocumentLayout title="Terms of Service" lastUpdated="June 2026">
      <LegalDocumentLayout.Section title="Agreement">
        <p>
          By accessing or using Yogstra, you agree to these Terms of Service. If you do not agree,
          please do not use the platform. Yogstra connects students with verified yoga teachers for
          online coaching, messaging, community interaction, and live video classes.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Platform usage">
        <ul className="list-disc pl-5 space-y-2">
          <li>You must provide accurate registration information and keep your account secure.</li>
          <li>You may not impersonate others, scrape the platform, or attempt unauthorized access.</li>
          <li>Students must be at least 18 years old, or use the platform with a parent or guardian&apos;s consent.</li>
          <li>Teachers must provide truthful credentials and maintain professional conduct with students.</li>
          <li>Yogstra may suspend or terminate accounts that violate these terms.</li>
        </ul>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Teacher verification">
        <p>
          Teachers register with Yogstra and enter a pending verification state. Our admin team reviews
          applications and may approve, reject, or remove teacher accounts. Only verified teachers receive
          full dashboard access and appear in public teacher listings. Yogstra does not guarantee approval
          timelines but typically reviews applications within 12–24 hours.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Payments & commission">
        <p>
          Class fees are collected through Razorpay at the time of booking. Yogstra retains a platform
          commission on each successful payment (the current percentage is shown at checkout and in
          admin settings). The remaining amount is allocated to the teacher as earnings and paid out
          according to our payout process.
        </p>
        <p>
          By booking a class, you authorize Yogstra and Razorpay to charge the displayed amount. All
          prices are in Indian Rupees (INR) unless stated otherwise.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Refund policy">
        <p>
          Refunds are governed by our separate{' '}
          <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a>.
          In summary: classes not attended may qualify for a refund within 7 days; attended classes are
          not refundable except where required by law or at Yogstra&apos;s discretion for technical failures.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Content policy (community)">
        <ul className="list-disc pl-5 space-y-2">
          <li>Students may share posts related to yoga practice, progress, and community engagement.</li>
          <li>Prohibited content includes harassment, hate speech, nudity, spam, medical misinformation, and illegal material.</li>
          <li>Teachers may provide constructive feedback via comments on student posts.</li>
          <li>Yogstra admins may remove posts or comments that violate this policy without notice.</li>
          <li>You retain ownership of content you post but grant Yogstra a license to display it on the platform.</li>
        </ul>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Live classes & video calls">
        <p>
          Live sessions use third-party video infrastructure (LiveKit). You agree not to record, redistribute,
          or misuse session content without consent. Yogstra is not liable for interruptions caused by
          your internet connection or device limitations.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Account termination">
        <p>
          You may stop using Yogstra at any time. We may suspend or terminate accounts for fraud,
          abuse, repeated policy violations, or legal requirements. Upon termination, access to
          dashboards and messaging ends; certain records may be retained as described in our Privacy Policy.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Disclaimer & liability">
        <p>
          Yogstra is a marketplace platform. Teachers are independent providers, not employees of Yogstra.
          We do not guarantee specific health outcomes. To the maximum extent permitted by law, Yogstra
          is not liable for indirect or consequential damages arising from use of the platform.
        </p>
      </LegalDocumentLayout.Section>

      <LegalDocumentLayout.Section title="Governing law">
        <p>
          These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive
          jurisdiction of the courts in Karnataka, India.
        </p>
        <p>
          Questions:{' '}
          <a href="mailto:support@yogstra.com" className="text-primary hover:underline">support@yogstra.com</a>
        </p>
      </LegalDocumentLayout.Section>
    </LegalDocumentLayout>
  )
}
