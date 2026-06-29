import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { AuthLayout } from '../../components/public/AuthLayout'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { Button } from '../../components/ui/Button'
import { formatAuthError } from '../../utils/format'
import { requestPasswordReset } from '../../services/auth'
import { resolvePostLoginPath } from '../../utils/workspacePreference'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useApp()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const profile = await signIn(email, password)
      if (remember) {
        localStorage.setItem('yogstra_remember_email', email)
      }
      if (profile.role === 'teacher' && (profile.teacherStatus === 'pending' || profile.teacherStatus === 'removed')) {
        navigate('/auth/teacher/pending')
        return
      }
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
    if (!email.trim()) {
      setError('Enter your email above, then tap Forgot Password.')
      return
    }
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSuccess('Password reset link sent. Check your email.')
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" description="Sign in to your Yogstra account">
      {success && (
        <p role="status" className="mb-4 rounded-[12px] border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
          {success}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 rounded-[12px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[20px] border border-border bg-elevated p-6 sm:p-8">
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <PasswordInput label="Password" required value={password} onChange={setPassword} />

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-border accent-accent"
            />
            Remember me
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleForgotPassword()}
            className="text-sm text-accent hover:underline cursor-pointer disabled:opacity-50"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Continue'}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <p>
          New to Yogstra?{' '}
          <Link to="/auth/get-started" className="text-accent hover:underline font-medium">
            Get started
          </Link>
        </p>
        <Link to="/" className="hover:text-foreground transition-colors">
          ← Back to Home
        </Link>
      </div>
    </AuthLayout>
  )
}
