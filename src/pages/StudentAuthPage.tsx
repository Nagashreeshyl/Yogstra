import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { AuthLayout } from '../components/public/AuthLayout'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Button } from '../components/ui/Button'
import { formatAuthError } from '../utils/format'
import { requestPasswordReset } from '../services/auth'
import { resolvePostLoginPath } from '../utils/workspacePreference'

export function StudentAuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn, signUpStudent } = useApp()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (mode === 'signup' && form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      if (mode === 'signup') {
        const result = await signUpStudent({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        })

        if (result.status === 'email_confirmation_required') {
          setSuccess(
            'Account created! Check your email to confirm, then log in here with the same email and password.',
          )
          setMode('login')
          return
        }

        navigate(resolvePostLoginPath(result.profile))
        return
      }

      const profile = await signIn(form.email, form.password)
      navigate(resolvePostLoginPath(profile))
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError(null)
    setSuccess(null)
    if (!form.email.trim()) {
      setError('Enter your email above, then tap Forgot Password.')
      return
    }
    setLoading(true)
    try {
      await requestPasswordReset(form.email)
      setSuccess('Password reset link sent. Check your email and follow the link to set a new password.')
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={mode === 'login' ? 'Student login' : 'Create student account'}
      description="Learn yoga, join academies, and compete on Yogstra."
    >
      <div className="flex rounded-[16px] border border-border mb-6 overflow-hidden p-1 bg-elevated">
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              className={`flex-1 py-2.5 text-sm font-medium capitalize cursor-pointer transition-colors rounded-[12px] ${
                mode === m
                  ? 'bg-sidebar text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {m === 'login' ? 'Login' : 'Sign Up'}
            </button>
          ))}
        </div>

        {success && (
          <p role="status" aria-live="polite" className="text-sm text-primary mb-4 border border-primary/20 bg-primary/10 px-3 py-2 rounded-sm">
            {success}
          </p>
        )}

        {error && (
          <p role="alert" aria-live="assertive" className="text-sm text-red-600 mb-4 border border-red-200 bg-red-50 px-3 py-2 rounded-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <Input
              label="Full Name"
              required
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            />
          )}
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          {mode === 'signup' && (
            <Input
              label="Phone"
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
          )}
          <PasswordInput
            label="Password"
            required
            value={form.password}
            onChange={(v) => setForm((p) => ({ ...p, password: v }))}
          />
          {mode === 'signup' && (
            <PasswordInput
              label="Confirm Password"
              required
              value={form.confirmPassword}
              onChange={(v) => setForm((p) => ({ ...p, confirmPassword: v }))}
            />
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleForgotPassword()}
                className="text-sm text-primary hover:underline cursor-pointer disabled:opacity-50"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </Button>
        </form>

        <Link
          to="/auth/get-started"
          className="block text-center text-sm text-muted-foreground hover:text-foreground mt-6"
        >
          ← Back to journeys
        </Link>
    </AuthLayout>
  )
}
