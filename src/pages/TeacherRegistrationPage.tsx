import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { signUpTeacher } from '../services/auth'
import { indianStates } from '../lib/constants'
import { AuthLayout } from '../components/public/AuthLayout'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { formatAuthError } from '../utils/format'
import { TERMS } from '../constants/terminology'
import { InstructionPanel } from '../components/ui/InstructionPanel'
import { HelpTooltip } from '../components/ui/HelpTooltip'
import type { TeacherRegistrationData } from '../types'

const emptyForm: TeacherRegistrationData = {
  fullName: '', email: '', phone: '', city: '', state: '',
  experienceYears: '', specializations: [],
  monthlyFee: '', bio: '', certifications: '',
  password: '', confirmPassword: '',
  teachingMode: 'Online',
}

export function TeacherRegistrationPage() {
  const location = useLocation()
  const workspaceMessage = (location.state as { message?: string } | null)?.message
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<TeacherRegistrationData>(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { categories, setTeacherRegistration } = useApp()

  const update = (fields: Partial<TeacherRegistrationData>) =>
    setForm((p) => ({ ...p, ...fields }))

  const toggleSpec = (name: string) => {
    setForm((p) => ({
      ...p,
      specializations: p.specializations.includes(name)
        ? p.specializations.filter((s) => s !== name)
        : [...p.specializations, name],
    }))
  }

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await signUpTeacher(form)

      if (result.status === 'email_confirmation_required') {
        setTeacherRegistration(form)
        setSubmitted(true)
        return
      }

      setTeacherRegistration(form)
      setSubmitted(true)
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <AuthLayout title="Application submitted" description="Thank you for applying to coach on Yogstra.">
        <div className="rounded-[20px] border border-border bg-elevated p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your coach application has been submitted. We will review your profile and contact you within 48 hours.
            Certification verification happens after approval.
          </p>
          <Link to="/auth/login"><Button>Continue to Login</Button></Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={TERMS.applyAsTeacher}
      description="One teacher account unlocks Coach, Academy, Competition, and Judge workspaces after verification."
    >
      {workspaceMessage && (
        <p className="mb-4 text-sm text-muted-foreground rounded-[12px] border border-border bg-muted/30 px-4 py-3">
          {workspaceMessage}
        </p>
      )}

      <InstructionPanel
        storageKey="teacher-registration"
        title="Getting started as a teacher"
        steps={[
          { label: 'Apply and get verified' },
          { label: 'Set up your Coach workspace' },
          { label: 'Create an Academy or Competition when ready' },
        ]}
        className="mb-6"
      />
      <div className="flex gap-2 mb-6 justify-center">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 w-16 rounded-full ${s <= step ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive mb-4 border border-destructive/30 bg-destructive/10 px-3 py-2 rounded-[12px]">
          {error}
        </p>
      )}

      <div className="rounded-[20px] border border-border bg-elevated p-6 sm:p-8">
        {step === 1 && (
          <div className="space-y-4">
            <Input label="Full Name" required value={form.fullName} onChange={(e) => update({ fullName: e.target.value })} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => update({ email: e.target.value })} />
            <Input label="Phone Number" type="tel" required value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
            <PasswordInput label="Password" required value={form.password} onChange={(v) => update({ password: v })} />
            <PasswordInput label="Confirm Password" required value={form.confirmPassword} onChange={(v) => update({ confirmPassword: v })} />
            <Input label="City" value={form.city} onChange={(e) => update({ city: e.target.value })} />
            <Select label="State" value={form.state} onChange={(e) => update({ state: e.target.value })}>
              <option value="">Select state</option>
              {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Button className="w-full" onClick={() => setStep(2)}>Continue</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Select label="Years of Experience" value={form.experienceYears} onChange={(e) => update({ experienceYears: e.target.value })}>
              <option value="">Select</option>
              {['1-3', '3-5', '5-10', '10-15', '15+'].map((y) => (
                <option key={y} value={y}>{y} years</option>
              ))}
            </Select>

            <div>
              <p className="text-sm font-medium mb-2">Teaching Styles</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleSpec(cat.name)}
                    className={`px-3 py-1.5 text-xs rounded-[16px] border cursor-pointer ${
                      form.specializations.includes(cat.name)
                        ? 'bg-accent/10 border-accent text-foreground'
                        : 'border-border hover:border-accent/40'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <label htmlFor="teacher-bio" className="text-sm font-medium text-foreground">
                  Bio
                </label>
                <HelpTooltip
                  label="Professional bio"
                  description="A short introduction shown on your public coach profile."
                  example="Certified Hatha instructor with 10 years of experience."
                  bestPractice="Highlight your style, experience, and who you teach best."
                />
              </div>
              <Textarea
                id="teacher-bio"
                placeholder="Tell students about your teaching philosophy and experience"
                value={form.bio}
                onChange={(e) => update({ bio: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-[16px] border border-border p-5 space-y-3 text-sm">
              <SummaryRow label="Name" value={form.fullName} />
              <SummaryRow label="Email" value={form.email} />
              <SummaryRow label="Phone" value={form.phone} />
              <SummaryRow label="Location" value={`${form.city}${form.state ? `, ${form.state}` : ''}`} />
              <SummaryRow label="Experience" value={form.experienceYears ? `${form.experienceYears} years` : '—'} />
              <SummaryRow label="Teaching Styles" value={form.specializations.join(', ') || '—'} />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Your application will be reviewed by our team. Certification verification happens after approval.
            </p>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Application'}
              </Button>
            </div>
          </div>
        )}
      </div>

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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
