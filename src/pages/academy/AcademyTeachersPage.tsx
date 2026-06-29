import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import {
  fetchAcademyMembership,
  fetchAcademyTeachers,
  linkTeacherToAcademy,
} from '../../services/academyMemberService'
import { inviteMemberByEmail, updateMemberStatus } from '../../services/academyOperations'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { EmptyState } from '../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { AdminTable } from '../../components/admin/AdminTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function AcademyTeachersPage() {
  const { user } = useApp()
  const { academyId, loading: contextLoading, error: contextError, refetch: refetchContext } =
    useAcademyContext()
  const [search, setSearch] = useState('')
  const [inviteValue, setInviteValue] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const { data: teachers, loading, error, refetch } = useAsyncData(
    () => (academyId ? fetchAcademyTeachers(academyId) : Promise.resolve([])),
    [academyId],
    { enabled: Boolean(academyId) },
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return (teachers ?? []).filter(
      (t) => !q || (t.teacherName ?? '').toLowerCase().includes(q) || t.teacherId.includes(q),
    )
  }, [teachers, search])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academyId || !user?.id || !inviteValue.trim()) return

    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)

    try {
      const member = await inviteMemberByEmail({
        academyId,
        emailOrUserId: inviteValue.trim(),
        role: 'teacher',
        invitedBy: user.id,
      })
      await linkTeacherToAcademy({ academyId, teacherId: member.userId })
      setInviteSuccess('Teacher invited successfully.')
      setInviteValue('')
      await refetch()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Could not invite teacher.')
    } finally {
      setInviting(false)
    }
  }

  const handleActivate = async (teacherId: string) => {
    if (!academyId) return
    const membership = await fetchAcademyMembership(academyId, teacherId)
    if (membership) {
      await updateMemberStatus(membership.id, 'active')
      await refetch()
    }
  }

  if (contextLoading || (loading && !teachers)) {
    return <LoadingSkeleton />
  }

  if (contextError || !academyId) {
    return (
      <PageContainer width="wide">
        <ErrorState
          message={contextError ?? 'No academy selected.'}
          onRetry={() => void refetchContext()}
        />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer width="wide">
        <ErrorState message={error} onRetry={() => void refetch()} />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Teachers"
        description="Invite, approve, and manage academy teachers."
      />

      <form
        onSubmit={(e) => void handleInvite(e)}
        className="mb-8 rounded-[16px] border border-border bg-elevated p-5 space-y-4"
      >
        <h2 className="font-heading text-lg font-semibold">Invite teacher</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            label="User ID or email"
            value={inviteValue}
            onChange={(e) => setInviteValue(e.target.value)}
            placeholder="teacher@example.com or UUID"
            className="flex-1"
          />
          <div className="flex items-end">
            <Button type="submit" disabled={inviting || !inviteValue.trim()}>
              {inviting ? 'Inviting…' : 'Send invite'}
            </Button>
          </div>
        </div>
        {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
        {inviteSuccess && <p className="text-sm text-primary">{inviteSuccess}</p>}
      </form>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No teachers yet"
          description="Invite teachers by email or user ID to link them to your academy."
        />
      ) : (
        <AdminTable
          headers={['Name', 'Employment', 'Primary', 'Status', 'Started', 'Actions']}
          searchPlaceholder="Search teachers..."
          onSearch={setSearch}
        >
          {filtered.map((teacher) => (
            <tr key={teacher.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{teacher.teacherName ?? 'Teacher'}</td>
              <td className="px-4 py-3 capitalize">{teacher.employmentType.replace('_', ' ')}</td>
              <td className="px-4 py-3">{teacher.isPrimary ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3">
                <Badge variant={teacher.status === 'active' ? 'primary' : 'default'}>
                  {teacher.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {teacher.startedAt
                  ? new Date(teacher.startedAt).toLocaleDateString('en-IN')
                  : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <Link to={`/teachers/${teacher.teacherId}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost">
                      Profile
                    </Button>
                  </Link>
                  {teacher.status === 'invited' && (
                    <Button size="sm" onClick={() => void handleActivate(teacher.teacherId)}>
                      Activate
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </PageContainer>
  )
}
