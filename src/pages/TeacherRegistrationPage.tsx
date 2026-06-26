import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { signUpTeacher } from '../services/auth'
import { indianStates } from '../lib/constants'
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
      <div className="min-h-full flex flex-col items-center justify-center p-8 bg-cream">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-2xl font-medium mb-4">Thank You!</h1>
          <p className="text-charcoal/70 leading-relaxed mb-6">
            Your registration has been submitted. We will verify your credentials and contact you within 12–24 hours on your registered phone number.
          </p>
          <Button onClick={() => navigate('/')}>Return to Yogstra</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col items-center p-8 bg-cream">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-semibold mb-1">Teacher Registration</h1>
          <p className="text-sm text-charcoal/50">Step {step} of 3</p>
          <div className="flex gap-2 mt-4 justify-center">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 w-16 rounded-full ${s <= step ? 'bg-teal' : 'bg-border'}`}
              />
            ))}
          </div>
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
                    className={`px-3 py-1.5 text-xs border rounded-sm cursor-pointer ${
                      form.specializations.includes(cat.name)
                        ? 'bg-teal-soft border-teal'
                        : 'border-border hover:border-teal/50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="monthly-fee" className="text-sm font-medium text-charcoal">
                Monthly Fee (₹)
              </label>
              <input
                id="monthly-fee"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 10,000"
                value={form.monthlyFee}
                onChange={(e) => handleMonthlyFeeChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-cream border border-border rounded-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-teal transition-colors"
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
            <div className="border border-border rounded-sm p-5 space-y-3 text-sm">
              <SummaryRow label="Name" value={form.fullName} />
              <SummaryRow label="Email" value={form.email} />
              <SummaryRow label="Phone" value={form.phone} />
              <SummaryRow label="Location" value={`${form.city}, ${form.state}`} />
              <SummaryRow label="Experience" value={`${form.experienceYears} years`} />
              <SummaryRow label="Specializations" value={form.specializations.join(', ')} />
              <SummaryRow label="Monthly Fee" value={form.monthlyFee ? `₹${form.monthlyFee}` : '—'} />
              {form.certifications && <SummaryRow label="Certifications" value={form.certifications} />}
            </div>

            <div className="bg-teal-soft border border-teal/30 rounded-sm p-4 text-sm leading-relaxed">
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

        <Link to="/auth/role" className="block text-center text-sm text-charcoal/50 hover:text-charcoal mt-6">
          ← Back
        </Link>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-charcoal/50">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
