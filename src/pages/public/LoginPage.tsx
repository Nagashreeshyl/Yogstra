import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { AuthLayout } from '../../components/public/AuthLayout'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { Button } from '../../components/ui/Button'
import { formatAuthError } from '../../utils/format'
import { resolvePostLoginPath } from '../../utils/workspacePreference'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useApp()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
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
      navigate(await resolvePostLoginPath(profile))
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" description="Sign in to your Yogstra account">
      {error && (
        <p role="alert" className="mb-4 rounded-[12px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[20px] border border-border bg-elevated p-6 sm:p-8">
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <PasswordInput label="Password" required value={password} onChange={setPassword} />

        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="rounded border-border accent-accent"
          />
          Remember me
        </label>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Login'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/auth/get-started" className="text-accent hover:underline font-medium">
          Get Started
        </Link>
      </p>
    </AuthLayout>
  )
}
