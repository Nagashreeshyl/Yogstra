import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { acceptAcademyInvite, fetchPendingAcademyInvites } from '../../services/academyOperations'
import { DashboardCard } from '../student/dashboard/DashboardCard'
import { Button } from '../ui/Button'
import { EmptyState } from '../shell/EmptyState'

export function TeacherAcademyInvitesSection() {
  const { user } = useApp()
  const [busy, setBusy] = useState<string | null>(null)

  const { data: invites, loading, refetch } = useAsyncData(
    () => (user?.id ? fetchPendingAcademyInvites(user.id) : Promise.resolve([])),
    [user?.id],
    { enabled: Boolean(user?.id) },
  )

  if (loading || !invites?.length) return null

  async function handleAccept(memberId: string) {
    if (!user?.id) return
    setBusy(memberId)
    try {
      await acceptAcademyInvite(memberId, user.id)
      await refetch()
    } finally {
      setBusy(null)
    }
  }

  return (
    <DashboardCard title="Academy invitations" description="Pending invites to join an academy.">
      <ul className="space-y-2">
        {invites.map((invite) => (
          <li
            key={invite.memberId}
            className="flex items-center justify-between gap-2 rounded-[12px] border border-border px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 size={16} className="shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p className="font-medium truncate">{invite.academyName}</p>
                <p className="text-xs text-muted-foreground capitalize">{invite.role.replace('_', ' ')}</p>
              </div>
            </div>
            <Button
              size="sm"
              disabled={busy === invite.memberId}
              onClick={() => void handleAccept(invite.memberId)}
            >
              Accept
            </Button>
          </li>
        ))}
      </ul>
      {!invites.length && (
        <EmptyState title="No pending invites" description="Academy owners can invite you by email or user ID." className="py-4" />
      )}
    </DashboardCard>
  )
}
