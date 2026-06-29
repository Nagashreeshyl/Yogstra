import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../../components/public/AuthLayout'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { formatAuthError } from '../../utils/format'
import { signUpTeacher } from '../../services/auth'

const orgTypes = ['Sports Federation', 'Yoga Association', 'Educational Institution', 'Private Organization', 'Other']

export function OrganizerSignupPage() {
  const [form, setForm] = useState({
    organizationName: '',
    contactPerson: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    organizationType: '',
    website: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const update = (fields: Partial<typeof form>) => setForm((p) => ({ ...p, ...fields }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await signUpTeacher({
        fullName: form.contactPerson,
        email: form.email,
        phone: form.phone,
        city: '',
        state: '',
        experienceYears: '5-10',
        specializations: [],
        monthlyFee: '',
        bio: `Organizer: ${form.organizationName} (${form.organizationType})`,
        certifications: '',
        password: form.password,
        confirmPassword: form.confirmPassword,
        teachingMode: 'Both',
      })
      setSubmitted(true)
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <AuthLayout title="Application submitted" description="Thank you for registering as a competition organizer.">
        <div className="rounded-[20px] border border-border bg-elevated p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your organizer application for <strong className="text-foreground">{form.organizationName}</strong> has been
            submitted. Our team will review your application and contact you within 48 hours.
          </p>
          <Link to="/auth/login"><Button>Continue to Login</Button></Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Register as competition organizer"
      description="Host yoga competitions, manage registrations, assign judges, and publish results."
    >
      {error && (
        <p role="alert" className="mb-4 rounded-[12px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[20px] border border-border bg-elevated p-6 sm:p-8">
        <Input label="Organization Name" required value={form.organizationName} onChange={(e) => update({ organizationName: e.target.value })} />
        <Input label="Contact Person" required value={form.contactPerson} onChange={(e) => update({ contactPerson: e.target.value })} />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => update({ email: e.target.value })} />
        <PasswordInput label="Password" required value={form.password} onChange={(v) => update({ password: v })} />
        <PasswordInput label="Confirm Password" required value={form.confirmPassword} onChange={(v) => update({ confirmPassword: v })} />
        <Input label="Phone" type="tel" required value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
        <Select label="Organization Type" value={form.organizationType} onChange={(e) => update({ organizationType: e.target.value })}>
          <option value="">Select type</option>
          {orgTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Input label="Website (optional)" type="url" value={form.website} onChange={(e) => update({ website: e.target.value })} />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Application'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-accent hover:underline font-medium">Log in</Link>
      </p>
      <Link to="/auth/get-started" className="block text-center text-sm text-muted-foreground hover:text-foreground mt-3">
        ← Back to Get Started
      </Link>
    </AuthLayout>
  )
}
