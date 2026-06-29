import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { AuthLayout } from '../../components/public/AuthLayout'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { formatAuthError } from '../../utils/format'
import { signUpTeacher } from '../../services/auth'
import { createAcademy } from '../../services/academyService'
import { indianStates } from '../../lib/constants'

export function AcademySignupPage() {
  const [form, setForm] = useState({
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    academyName: '',
    city: '',
    state: '',
    website: '',
    description: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()
  const { signIn } = useApp()

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
      const result = await signUpTeacher({
        fullName: form.ownerName,
        email: form.email,
        phone: form.phone,
        city: form.city,
        state: form.state,
        experienceYears: '5-10',
        specializations: [],
        monthlyFee: '',
        bio: form.description || `Owner of ${form.academyName}`,
        certifications: '',
        password: form.password,
        confirmPassword: form.confirmPassword,
        teachingMode: 'Both',
      })

      if (result.status === 'email_confirmation_required') {
        setDone(true)
        return
      }

      await createAcademy(
        {
          name: form.academyName.trim(),
          city: form.city.trim() || undefined,
          state: form.state || undefined,
          description: form.description.trim() || undefined,
        },
        result.profile.id,
      )

      navigate('/dashboard/academy')
    } catch (err) {
      try {
        const profile = await signIn(form.email, form.password)
        await createAcademy(
          {
            name: form.academyName.trim(),
            city: form.city.trim() || undefined,
            state: form.state || undefined,
            description: form.description.trim() || undefined,
          },
          profile.id,
        )
        navigate('/dashboard/academy')
      } catch {
        setError(formatAuthError(err))
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthLayout title="Academy registered!" description="Check your email to confirm your account, then log in.">
        <div className="rounded-[20px] border border-border bg-elevated p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Your academy account has been created. Confirm your email, then log in to access your academy dashboard.
          </p>
          <Link to="/auth/login"><Button>Continue to Login</Button></Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Register your academy"
      description="Set up your academy on Yogstra to manage teachers, students, and programs."
    >
      {error && (
        <p role="alert" className="mb-4 rounded-[12px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[20px] border border-border bg-elevated p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Owner details</p>
        <Input label="Owner Name" required value={form.ownerName} onChange={(e) => update({ ownerName: e.target.value })} />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => update({ email: e.target.value })} />
        <PasswordInput label="Password" required value={form.password} onChange={(v) => update({ password: v })} />
        <PasswordInput label="Confirm Password" required value={form.confirmPassword} onChange={(v) => update({ confirmPassword: v })} />
        <Input label="Phone" type="tel" required value={form.phone} onChange={(e) => update({ phone: e.target.value })} />

        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground pt-2">Academy details</p>
        <Input label="Academy Name" required value={form.academyName} onChange={(e) => update({ academyName: e.target.value })} />
        <Input label="City" value={form.city} onChange={(e) => update({ city: e.target.value })} />
        <Select label="State" value={form.state} onChange={(e) => update({ state: e.target.value })}>
          <option value="">Select state</option>
          {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input label="Website (optional)" type="url" value={form.website} onChange={(e) => update({ website: e.target.value })} />
        <Textarea label="Description" value={form.description} onChange={(e) => update({ description: e.target.value })} rows={3} />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating academy…' : 'Create Academy'}
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
