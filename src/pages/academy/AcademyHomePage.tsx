import { Link } from 'react-router-dom'
import { Layers, IndianRupee, Users, GraduationCap } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { fetchAcademyDashboard } from '../../services/academyDashboard'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { EmptyState } from '../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { QuickStats } from '../../components/student/dashboard/StatCard'
import { DashboardCard } from '../../components/student/dashboard/DashboardCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { AcademyCreateSection } from './AcademyCreateSection'

export function AcademyHomePage() {
  const { academyId, academy, academies, loading: contextLoading, error: contextError, refetch: refetchContext } =
    useAcademyContext()

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      academyId
        ? fetchAcademyDashboard(academyId)
        : Promise.reject(new Error('No academy selected')),
    [academyId],
    { enabled: Boolean(academyId) },
  )

  if (contextLoading || (loading && !data)) {
    return <LoadingSkeleton />
  }

  if (contextError) {
    return (
      <PageContainer width="wide">
        <ErrorState message={contextError} onRetry={() => void refetchContext()} />
      </PageContainer>
    )
  }

  if (!academies.length) {
    return <AcademyCreateSection />
  }

  if (error || !data) {
    return (
      <PageContainer width="wide">
        <ErrorState
          title="Could not load academy dashboard"
          message={error ?? 'Please try again.'}
          onRetry={() => void refetch()}
        />
      </PageContainer>
    )
  }

  const currency = data.settings?.currency ?? 'INR'
  const stats = [
    {
      label: 'Members',
      value: String(data.memberCount),
      icon: Users,
      hint: 'Active staff & owners',
    },
    {
      label: 'Teachers',
      value: String(data.teacherCount),
      icon: Users,
      hint: 'Linked academy teachers',
    },
    {
      label: 'Students',
      value: String(data.studentCount),
      icon: GraduationCap,
      hint: 'Enrolled across batches',
    },
    {
      label: 'Batches',
      value: String(data.batchCount),
      icon: Layers,
      hint: 'Training groups',
    },
  ]

  return (
    <PageContainer width="wide">
      <PageHeader
        title={academy?.name ?? data.academy.name}
        description={data.academy.description ?? 'Daily command center for academy owners and managers.'}
        actions={
          <Badge variant="teal">{data.academy.status}</Badge>
        }
      />

      <div className="mb-6 lg:mb-8">
        <QuickStats stats={stats} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <DashboardCard
          title="Recent batches"
          description="Latest training groups in your academy"
          action={
            <Link to="/dashboard/academy/batches">
              <Button size="sm" variant="ghost">
                View all
              </Button>
            </Link>
          }
        >
          {data.recentBatches.length === 0 ? (
            <EmptyState
              title="No batches yet"
              description="Create your first batch to start enrolling students."
              action={
                <Link to="/dashboard/academy/batches">
                  <Button size="sm">Create batch</Button>
                </Link>
              }
              className="py-8"
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentBatches.map((batch) => (
                <li key={batch.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-foreground">{batch.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {batch.teacherName ? `Teacher: ${batch.teacherName}` : 'No teacher assigned'}
                    </p>
                  </div>
                  <Badge variant={batch.status === 'active' ? 'teal' : 'default'}>{batch.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard title="Academy settings" description="Regional preferences">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Timezone</dt>
              <dd className="font-medium">{data.settings?.timezone ?? 'Asia/Kolkata'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Currency</dt>
              <dd className="font-medium">{currency}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Location</dt>
              <dd className="font-medium">
                {[data.academy.city, data.academy.state].filter(Boolean).join(', ') || '—'}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/dashboard/academy/settings">
              <Button size="sm" variant="secondary">
                Edit settings
              </Button>
            </Link>
            <Link to="/dashboard/academy/finance">
              <Button size="sm" variant="ghost">
                <IndianRupee size={14} className="mr-1 inline" />
                Finance
              </Button>
            </Link>
          </div>
        </DashboardCard>
      </div>
    </PageContainer>
  )
}
