import { useCallback, useRef, useState } from 'react'
import { Trophy } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchOrganizerDashboard } from '../../services/organizerDashboard'
import { publishAllApprovedResults, publishCompetition } from '../../services/organizerOperations'
import { issueCertificate } from '../../services/certificateService'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { EmptyState } from '../../components/shell/EmptyState'
import { QuickStats } from '../../components/student/dashboard/StatCard'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { OrganizerWelcomeSection } from '../../components/organizer/dashboard/OrganizerWelcomeSection'
import { CompetitionSummaryCard } from '../../components/organizer/dashboard/CompetitionSummaryCard'
import { RegistrationTable } from '../../components/organizer/dashboard/RegistrationTable'
import { JudgeAssignmentBoard } from '../../components/organizer/dashboard/JudgeAssignmentBoard'
import { ScheduleTimeline } from '../../components/organizer/dashboard/ScheduleTimeline'
import { AnnouncementComposer } from '../../components/organizer/dashboard/AnnouncementComposer'
import { AnalyticsCards } from '../../components/organizer/dashboard/AnalyticsCards'
import { CertificateQueue } from '../../components/organizer/dashboard/CertificateQueue'
import { ResultApprovalTable } from '../../components/organizer/dashboard/ResultApprovalTable'
import { OrganizerQuickActions } from '../../components/organizer/dashboard/OrganizerQuickActions'
import { OrganizerDashboardSkeleton } from '../../components/organizer/dashboard/OrganizerDashboardSkeleton'
import { CreateCompetitionWizard } from '../../components/organizer/CreateCompetitionWizard'
import { Users, ClipboardList, Scale, IndianRupee } from 'lucide-react'

export function OrganizerDashboardPage() {
  const { user } = useApp()
  const userId = user?.id ?? ''
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const announcementRef = useRef<HTMLDivElement>(null)
  const judgesRef = useRef<HTMLDivElement>(null)

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId
        ? fetchOrganizerDashboard(userId, selectedCompetitionId)
        : Promise.reject(new Error('Not signed in')),
    [userId, selectedCompetitionId],
    { enabled: Boolean(userId) },
  )

  const handleSelectCompetition = useCallback((id: string) => {
    setSelectedCompetitionId(id)
  }, [])

  const handleCreated = useCallback(
    (competitionId: string) => {
      setSelectedCompetitionId(competitionId)
      void refetch()
    },
    [refetch],
  )

  if (!user || loading) {
    return <OrganizerDashboardSkeleton />
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Could not load organizer dashboard"
        message={error ?? 'Please try again in a moment.'}
        onRetry={() => void refetch()}
      />
    )
  }

  const competition = data.selectedCompetition
  const hasCompetitions = data.allCompetitions.length > 0

  const stats = [
    {
      label: 'Registrations',
      value: String(data.registrations.total),
      icon: Users,
      hint: `${data.registrations.pendingApprovals} pending approval`,
    },
    {
      label: 'Judges',
      value: String(data.judges.assigned),
      icon: Scale,
      hint: `${data.judges.unassignedCategories} categories open`,
    },
    {
      label: 'Revenue',
      value: `₹${data.analytics.revenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      hint: 'Collected registration fees',
    },
    {
      label: 'Results',
      value: String(data.results.published),
      icon: ClipboardList,
      hint: `${data.results.pendingApprovals} awaiting approval`,
    },
  ]

  async function handlePublishSchedule() {
    if (!competition) return
    await publishCompetition(competition.id, competition.status === 'registration_open')
    void refetch()
  }

  async function handleGenerateCertificates() {
    if (!data) return
    const drafts = data.certificates.certificates.filter((c) => c.status === 'draft')
    for (const cert of drafts) {
      await issueCertificate(cert.id, { signedAt: new Date().toISOString() })
    }
    void refetch()
  }

  async function handlePublishResults() {
    if (!competition) return
    await publishAllApprovedResults(competition.id)
    void refetch()
  }

  return (
    <div className="py-4 sm:py-6">
      <PageHeader
        title="Organizer"
        description="Create, manage, and complete competitions from one place."
        actions={
          <Button size="sm" onClick={() => setWizardOpen(true)}>
            Create competition
          </Button>
        }
      />

      <OrganizerWelcomeSection organizerName={user.name} selectedCompetition={competition} />

      {!hasCompetitions ? (
        <EmptyState
          icon={<Trophy size={24} />}
          title="No competitions yet"
          description="Create your first competition to manage registrations, judges, schedules, and results — no spreadsheets needed."
          action={
            <Button onClick={() => setWizardOpen(true)}>Create competition</Button>
          }
          className="mt-8"
        />
      ) : (
        <>
          {hasCompetitions && (
            <div className="mb-6">
              <Select
                label="Selected competition"
                value={competition?.id ?? ''}
                onChange={(e) => setSelectedCompetitionId(e.target.value || null)}
              >
                {data.allCompetitions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="mb-6 lg:mb-8">
            <QuickStats stats={stats} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="lg:col-span-2">
              <CompetitionSummaryCard
                groups={data.competitions}
                selectedId={competition?.id ?? null}
                onSelect={handleSelectCompetition}
              />
            </div>

            {competition && (
              <>
                <RegistrationTable summary={data.registrations} onUpdated={() => void refetch()} />

                <div ref={judgesRef}>
                  <JudgeAssignmentBoard
                    competitionId={competition.id}
                    summary={data.judges}
                    organizerId={userId}
                    onUpdated={() => void refetch()}
                  />
                </div>

                <ScheduleTimeline summary={data.schedule} />

                <ResultApprovalTable
                  competitionId={competition.id}
                  summary={data.results}
                  onUpdated={() => void refetch()}
                />

                <CertificateQueue summary={data.certificates} onUpdated={() => void refetch()} />

                <AnalyticsCards analytics={data.analytics} />

                <div ref={announcementRef} className="lg:col-span-2">
                  <AnnouncementComposer
                    competitionId={competition.id}
                    createdBy={userId}
                    announcements={data.announcements}
                    onUpdated={() => void refetch()}
                  />
                </div>

                <div className="lg:col-span-2">
                  <OrganizerQuickActions
                    onCreateCompetition={() => setWizardOpen(true)}
                    onPublishSchedule={() => void handlePublishSchedule()}
                    onAssignJudges={() => judgesRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    onGenerateCertificates={() => void handleGenerateCertificates()}
                    onPublishResults={() => void handlePublishResults()}
                    onSendAnnouncement={() =>
                      announcementRef.current?.scrollIntoView({ behavior: 'smooth' })
                    }
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}

      <CreateCompetitionWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        createdBy={userId}
        onCreated={handleCreated}
      />
    </div>
  )
}
