import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { createAcademy } from '../../services/academyService'
import { indianStates } from '../../lib/constants'
import { formatUserFacingError } from '../../utils/format'
import { PageContainer } from '../../components/shell/PageContainer'
import { EmptyState } from '../../components/shell/EmptyState'
import { DashboardWorkspaceHeader } from '../../components/shell/DashboardWorkspaceHeader'
import { InstructionPanel } from '../../components/ui/InstructionPanel'
import { LabelWithHelp } from '../../components/ui/HelpTooltip'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { TERMS } from '../../constants/terminology'

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
      setError(formatUserFacingError(err, 'Could not create academy.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="max-w-md w-full space-y-4 text-left">
      <div className="flex flex-col gap-1.5">
        <LabelWithHelp
          htmlFor="new-academy-name"
          help={{
            label: 'Academy name',
            description: 'The public name for your academy on Yogstra.',
            example: 'Shanti Yoga Academy',
            validationHint: 'Required to create your academy.',
          }}
        >
          Academy name
        </LabelWithHelp>
        <Input id="new-academy-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
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
      <Button type="submit" disabled={busy || !name.trim()} className="w-full">
        {busy ? 'Creating…' : TERMS.createAcademy}
      </Button>
    </form>
  )
}

export function AcademyCreateSection() {
  const { user } = useApp()
  const { refetch, setAcademyId } = useAcademyContext()

  return (
    <PageContainer width="wide">
      <DashboardWorkspaceHeader
        workspaceTitle={TERMS.academyWorkspace}
        description="Set up your academy to manage teachers, training batches, and students."
        userName={user?.name ?? 'Teacher'}
      />

      <InstructionPanel
        storageKey="academy-create"
        title="Create your academy"
        steps={[
          { label: 'Create academy' },
          { label: 'Invite teachers' },
          { label: 'Create batches' },
          { label: 'Enroll students' },
        ]}
        className="mb-8"
      />

      <EmptyState
        icon={<Building2 size={24} />}
        title="No academy yet"
        description="Create an academy to manage teachers, training batches, schedules, and student enrollments."
        outcome="After creation, your Academy workspace opens automatically on your next login."
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
