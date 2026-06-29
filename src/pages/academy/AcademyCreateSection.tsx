import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { createAcademy } from '../../services/academyService'
import { indianStates } from '../../lib/constants'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { EmptyState } from '../../components/shell/EmptyState'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

export function AcademyCreateForm({ onCreated }: { onCreated: (academyId: string) => void }) {
  const { user } = useApp()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id || !name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const academy = await createAcademy(
        { name: name.trim(), city: city.trim() || undefined, state: state || undefined },
        user.id,
      )
      onCreated(academy.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create academy.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="max-w-md space-y-4">
      <Input label="Academy name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
      <Select label="State" value={state} onChange={(e) => setState(e.target.value)}>
        <option value="">Select state</option>
        {indianStates.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy || !name.trim()}>
        {busy ? 'Creating…' : 'Create academy'}
      </Button>
    </form>
  )
}

export function AcademyCreateSection() {
  const { refetch, setAcademyId } = useAcademyContext()

  return (
    <PageContainer width="wide">
      <PageHeader title="Create academy" description="Set up your academy to manage teachers, batches, and students." />
      <EmptyState
        icon={<Building2 size={24} />}
        title="No academy linked"
        description="Create a new academy or accept an invitation from an existing owner."
        action={
          <AcademyCreateForm
            onCreated={(id) => {
              setAcademyId(id)
              void refetch()
            }}
          />
        }
      />
    </PageContainer>
  )
}
