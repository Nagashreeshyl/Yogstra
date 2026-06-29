import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { signUpTeacher } from '../services/auth'
import { indianStates } from '../lib/constants'
import { PageContainer } from '../components/shell/PageContainer'
import { PageHeader } from '../components/shell/PageHeader'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { formatAuthError, formatIndianNumber } from '../utils/format'
import type { TeacherRegistrationData } from '../types'

const emptyForm: TeacherRegistrationData = {
  fullName: '', email: '', phone: '', city: '', state: '',
  experienceYears: '', specializations: [],
  monthlyFee: '', bio: '', certifications: '',
  password: '', confirmPassword: '',
  teachingMode: 'Online',
}

export function TeacherRegistrationPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<TeacherRegistrationData>(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { categories, setTeacherRegistration } = useApp()
  const navigate = useNavigate()

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

  const handleMonthlyFeeChange = (raw: string) => {
    update({ monthlyFee: formatIndianNumber(raw) })
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
      <div className="min-h-full flex flex-col items-center justify-center bg-background">
        <PageContainer width="narrow" className="text-center !py-8">
          <PageHeader title="Thank You!" description="Your registration has been submitted. We will verify your credentials and contact you within 12–24 hours on your registered phone number." />
          <Button onClick={() => navigate('/')}>Return to Yogstra</Button>
        </PageContainer>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col items-center bg-elevated">
      <PageContainer width="narrow" className="!py-8">
        <PageHeader
          title="Teacher Registration"
          description={`Step ${step} of 3`}
          className="text-center [&_h1]:text-center [&_p]:mx-auto"
        />
        <div className="flex gap-2 mb-8 justify-center">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 w-16 rounded-full ${s <= step ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-4 border border-red-200 bg-red-50 px-3 py-2 rounded-sm">
            {error}
          </p>
        )}

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
            <Button className="w-full" onClick={() => setStep(2)}>Next</Button>
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
              <p className="text-sm font-medium mb-2">Yoga Specializations</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleSpec(cat.name)}
                    className={`px-3 py-1.5 text-xs rounded-[16px] border border-border cursor-pointer ${
                      form.specializations.includes(cat.name)
                        ? 'bg-primary/10 border-primary'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="monthly-fee" className="text-sm font-medium text-foreground">
                Monthly Fee (₹)
              </label>
              <input
                id="monthly-fee"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 10,000"
                value={form.monthlyFee}
                onChange={(e) => handleMonthlyFeeChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-elevated rounded-[16px] border border-border text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <Textarea label="Bio" placeholder="Tell students about yourself" value={form.bio} onChange={(e) => update({ bio: e.target.value })} />
            <Input label="Certifications (optional)" value={form.certifications} onChange={(e) => update({ certifications: e.target.value })} />

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-[16px] border border-border p-5 space-y-3 text-sm">
              <SummaryRow label="Name" value={form.fullName} />
              <SummaryRow label="Email" value={form.email} />
              <SummaryRow label="Phone" value={form.phone} />
              <SummaryRow label="Location" value={`${form.city}, ${form.state}`} />
              <SummaryRow label="Experience" value={`${form.experienceYears} years`} />
              <SummaryRow label="Specializations" value={form.specializations.join(', ')} />
              <SummaryRow label="Monthly Fee" value={form.monthlyFee ? `₹${form.monthlyFee}` : '—'} />
              {form.certifications && <SummaryRow label="Certifications" value={form.certifications} />}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-[16px] p-4 text-sm leading-relaxed">
              Your profile is under review. We will verify your credentials and contact you within 12–24 hours on your registered phone number. You will receive login access once verified.
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit for Verification'}
              </Button>
            </div>
          </div>
        )}

        <Link to="/auth/role" className="block text-center text-sm text-muted-foreground hover:text-foreground mt-6">
          ← Back
        </Link>
      </PageContainer>
    </div>
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
