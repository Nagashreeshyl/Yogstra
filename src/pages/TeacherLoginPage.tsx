import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { PageContainer } from '../components/shell/PageContainer'
import { PageHeader } from '../components/shell/PageHeader'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Button } from '../components/ui/Button'
import { formatAuthError } from '../utils/format'
import { getPostLoginPath } from '../utils/authRouting'

export function TeacherLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      if (profile.role !== 'teacher' && profile.role !== 'admin') {
        setError('This account is not registered as a teacher.')
        return
      }
      if (profile.role === 'teacher' && profile.teacherStatus === 'removed') {
        navigate('/auth/teacher/pending')
        return
      }
      navigate(getPostLoginPath(profile))
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background">
      <PageContainer width="narrow" className="!py-8">
        <PageHeader title="Yogstra" description="Teacher Login" className="justify-center text-center [&_h1]:text-center [&_p]:mx-auto" />

        {error && (
          <p className="text-sm text-red-600 mb-4 border border-red-200 bg-red-50 px-3 py-2 rounded-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordInput
            label="Password"
            required
            value={password}
            onChange={setPassword}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait...' : 'Login as Teacher'}
          </Button>
        </form>

        <p className="text-center text-sm mt-6">
          New teacher?{' '}
          <Link to="/auth/teacher/register" className="text-primary hover:underline">
            Register here
          </Link>
        </p>

        <Link
          to="/auth/role"
          className="block text-center text-sm text-muted-foreground hover:text-foreground mt-4"
        >
          ← Back
        </Link>
      </PageContainer>
    </div>
  )
}
