import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchTeacherById, updateTeacherSettings } from '../../services/teachers'
import { indianStates } from '../../lib/constants'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { formatIndianNumber, parseIndianNumber } from '../../utils/format'

export function TeacherSettingsPage() {
  const { user, categories, refreshUser } = useApp()
  const { data: teacher, loading, refetch } = useAsyncData(
    () => (user ? fetchTeacherById(user.id) : Promise.resolve(null)),
    [user?.id],
  )

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [bio, setBio] = useState('')
  const [certifications, setCertifications] = useState('')
  const [specializations, setSpecializations] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!teacher) return
    setFullName(teacher.name)
    setPhone(teacher.phone)
    setCity(teacher.city)
    setState(teacher.state)
    setMonthlyFee(teacher.monthlyFee ? formatIndianNumber(teacher.monthlyFee) : '')
    setBio(teacher.bio)
    setCertifications(teacher.certifications)
    setSpecializations(teacher.specializations)
  }, [teacher])

  const toggleSpec = (name: string) => {
    setSpecializations((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      await updateTeacherSettings(user.id, {
        fullName,
        phone,
        city,
        state,
        bio,
        certifications,
        monthlyFee: parseIndianNumber(monthlyFee),
        specializations,
      })
      await refetch()
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-2xl">
        <p className="text-charcoal/50 text-sm">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-heading text-3xl font-medium mb-8">Profile Settings</h1>

      {error && (
        <p className="text-sm text-red-600 mb-4 border border-red-200 bg-red-50 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <Input
          label="Full Name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input label="Email" type="email" value={user?.email ?? ''} readOnly />
        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Select label="State" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Select state</option>
            {indianStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
        <Input
          label="Monthly Fee (₹)"
          type="text"
          inputMode="numeric"
          value={monthlyFee}
          onChange={(e) => setMonthlyFee(formatIndianNumber(e.target.value))}
        />
        <div>
          <p className="text-sm font-medium mb-2">Specializations</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleSpec(cat.name)}
                className={`px-3 py-1.5 text-xs border rounded-sm cursor-pointer ${
                  specializations.includes(cat.name)
                    ? 'bg-teal-soft border-teal'
                    : 'border-border hover:border-teal/50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
        <Input
          label="Certifications"
          value={certifications}
          onChange={(e) => setCertifications(e.target.value)}
        />

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          {saved && <span className="text-sm text-teal">Saved successfully</span>}
        </div>
      </form>
    </div>
  )
}
