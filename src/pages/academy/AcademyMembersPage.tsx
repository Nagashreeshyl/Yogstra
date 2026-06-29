import { useMemo, useState } from 'react'
import { UserCog } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { fetchAcademyMembers } from '../../services/academyMemberService'
import {
  inviteMemberByEmail,
  updateMemberRole,
  updateMemberStatus,
} from '../../services/academyOperations'
import type { AcademyMemberRole } from '../../domain/academy/models'
import { formatAcademyMemberRole } from '../../domain/academy/permissions'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { EmptyState } from '../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { AdminTable } from '../../components/admin/AdminTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const ROLE_OPTIONS: AcademyMemberRole[] = [
  'owner',
  'manager',
  'teacher',
  'assistant_teacher',
  'receptionist',
  'finance_manager',
]

export function AcademyMembersPage() {
  const { user } = useApp()
  const { academyId, loading: contextLoading, error: contextError, refetch: refetchContext } =
    useAcademyContext()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [inviteValue, setInviteValue] = useState('')
  const [inviteRole, setInviteRole] = useState<AcademyMemberRole>('manager')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: members, loading, error, refetch } = useAsyncData(
    () => (academyId ? fetchAcademyMembers(academyId) : Promise.resolve([])),
    [academyId],
    { enabled: Boolean(academyId) },
  )

  const filtered = useMemo(() => {
    return (members ?? []).filter((m) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        (m.userName ?? '').toLowerCase().includes(q) ||
        m.userId.includes(q) ||
        m.role.includes(q)
      const matchStatus = !statusFilter || m.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [members, search, statusFilter])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academyId || !user?.id || !inviteValue.trim()) return

    setInviting(true)
    setInviteError(null)

    try {
      await inviteMemberByEmail({
        academyId,
        emailOrUserId: inviteValue.trim(),
        role: inviteRole,
        invitedBy: user.id,
      })
      setInviteValue('')
      await refetch()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Could not send invitation.')
    } finally {
      setInviting(false)
    }
  }

  const handleRoleChange = async (memberId: string, role: AcademyMemberRole) => {
    setActionError(null)
    try {
      await updateMemberRole(memberId, role)
      await refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update role.')
    }
  }

  const handleStatusChange = async (
    memberId: string,
    status: import('../../domain/academy/models').AcademyMemberStatus,
  ) => {
    setActionError(null)
    try {
      await updateMemberStatus(memberId, status)
      await refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update status.')
    }
  }

  if (contextLoading || (loading && !members)) {
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
        title="Members"
        description="Manage academy staff roles and pending invitations."
      />

      <form
        onSubmit={(e) => void handleInvite(e)}
        className="mb-8 rounded-[16px] border border-border bg-elevated p-5 space-y-4"
      >
        <h2 className="font-heading text-lg font-semibold">Invite member</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="User ID or email"
            value={inviteValue}
            onChange={(e) => setInviteValue(e.target.value)}
            placeholder="user@example.com"
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-role" className="text-sm font-medium text-charcoal">
              Role
            </label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AcademyMemberRole)}
              className="w-full px-4 py-2.5 text-sm bg-cream border border-border rounded-sm focus:outline-none focus:border-teal"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {formatAcademyMemberRole(role)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={inviting || !inviteValue.trim()}>
              {inviting ? 'Sending…' : 'Send invite'}
            </Button>
          </div>
        </div>
        {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
        {actionError && <p className="text-sm text-red-600">{actionError}</p>}
      </form>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<UserCog size={24} />}
          title="No members found"
          description="Invite staff members to help manage your academy."
        />
      ) : (
        <AdminTable
          headers={['Name', 'Role', 'Status', 'Joined', 'Actions']}
          searchPlaceholder="Search members..."
          filterOptions={[
            { label: 'Active', value: 'active' },
            { label: 'Invited', value: 'invited' },
            { label: 'Suspended', value: 'suspended' },
          ]}
          onSearch={setSearch}
          onFilter={setStatusFilter}
        >
          {filtered.map((member) => (
            <tr key={member.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{member.userName ?? member.userId}</td>
              <td className="px-4 py-3">
                <select
                  value={member.role}
                  onChange={(e) =>
                    void handleRoleChange(member.id, e.target.value as AcademyMemberRole)
                  }
                  disabled={member.role === 'owner'}
                  className="px-2 py-1 text-sm bg-cream border border-border rounded-sm focus:outline-none focus:border-teal"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {formatAcademyMemberRole(role)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <Badge variant={member.status === 'active' ? 'teal' : 'default'}>
                  {member.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-charcoal/70">
                {member.joinedAt
                  ? new Date(member.joinedAt).toLocaleDateString('en-IN')
                  : member.status === 'invited'
                    ? 'Pending'
                    : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {member.status === 'invited' && (
                    <Button size="sm" onClick={() => void handleStatusChange(member.id, 'active')}>
                      Accept
                    </Button>
                  )}
                  {member.status === 'active' && member.role !== 'owner' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleStatusChange(member.id, 'suspended')}
                    >
                      Suspend
                    </Button>
                  )}
                  {member.status === 'suspended' && (
                    <Button size="sm" onClick={() => void handleStatusChange(member.id, 'active')}>
                      Reinstate
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
