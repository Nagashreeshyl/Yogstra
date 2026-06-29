import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { AuthLayout } from '../components/public/AuthLayout'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { formatAuthError } from '../utils/format'
import { indianStates } from '../lib/constants'
import { resolvePostLoginPath } from '../utils/workspacePreference'

const experienceLevels = ['Complete beginner', 'Some experience', 'Intermediate', 'Advanced']
const goalOptions = ['General wellness', 'Flexibility & strength', 'Competition prep', 'Teacher training', 'Stress relief']

export function StudentAuthPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: 'India',
    state: '',
    city: '',
    experience: '',
    goals: '',
    agreed: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signUpStudent } = useApp()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!form.agreed) {
      setError('Please accept the terms to continue')
      return
    }

    setLoading(true)
    try {
      const result = await signUpStudent({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      })

      if (result.status === 'email_confirmation_required') {
        setSuccess('Account created! Check your email to confirm, then log in.')
        return
      }

      navigate(await resolvePostLoginPath(result.profile))
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout title="Welcome to Yogstra!" description="Your student account has been created.">
        <div className="rounded-[20px] border border-border bg-elevated p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">{success}</p>
          <Link to="/auth/login">
            <Button>Continue to Login</Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your student account"
      description="Discover coaches, join programs, and track your yoga journey."
    >
      {error && (
        <p role="alert" className="mb-4 rounded-[12px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[20px] border border-border bg-elevated p-6 sm:p-8">
        <Input label="Full Name" required value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        <PasswordInput label="Password" required value={form.password} onChange={(v) => setForm((p) => ({ ...p, password: v }))} />
        <PasswordInput label="Confirm Password" required value={form.confirmPassword} onChange={(v) => setForm((p) => ({ ...p, confirmPassword: v }))} />
        <Input label="Phone" type="tel" required value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        <Input label="Country" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
        <Select label="State" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}>
          <option value="">Select state</option>
          {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input label="City" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
        <Select label="Yoga Experience" value={form.experience} onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}>
          <option value="">Select level</option>
          {experienceLevels.map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>
        <Select label="Your Goals" value={form.goals} onChange={(e) => setForm((p) => ({ ...p, goals: e.target.value }))}>
          <option value="">Select a goal</option>
          {goalOptions.map((g) => <option key={g} value={g}>{g}</option>)}
        </Select>

        <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={form.agreed}
            onChange={(e) => setForm((p) => ({ ...p, agreed: e.target.checked }))}
            className="mt-0.5 rounded border-border accent-accent"
          />
          <span>
            I agree to Yogstra&apos;s{' '}
            <Link to="/terms-of-service" className="text-accent hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy-policy" className="text-accent hover:underline">Privacy Policy</Link>
          </span>
        </label>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
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
