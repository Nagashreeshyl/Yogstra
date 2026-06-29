import { IndianRupee, TrendingUp, Wallet } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { fetchAcademyFinanceSummary } from '../../services/financeService'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { EmptyState } from '../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { formatRelativeDate } from '../../utils/format'

export function AcademyFinancePage() {
  const { academyId, loading: contextLoading, error: contextError, refetch: refetchContext } =
    useAcademyContext()

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      academyId
        ? fetchAcademyFinanceSummary(academyId)
        : Promise.reject(new Error('No academy selected')),
    [academyId],
    { enabled: Boolean(academyId) },
  )

  if (contextLoading || (loading && !data)) {
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

  if (error || !data) {
    return (
      <PageContainer width="wide">
        <ErrorState
          title="Could not load finance data"
          message={error ?? 'Please try again.'}
          onRetry={() => void refetch()}
        />
      </PageContainer>
    )
  }

  const hasActivity = data.transactions.length > 0 || data.totalCollected > 0

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Finance"
        description="Fees, collections, and academy revenue from linked teachers."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <IndianRupee size={16} className="text-primary" />
            <span className="text-xs">Total collected</span>
          </div>
          <p className="font-heading text-2xl font-medium">
            ₹{data.totalCollected.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">Paid class orders</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-xs">Pending collections</span>
          </div>
          <p className="font-heading text-2xl font-medium">
            ₹{data.pendingCollections.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">Unpaid class orders</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Wallet size={16} className="text-primary" />
            <span className="text-xs">Teacher payouts</span>
          </div>
          <p className="font-heading text-2xl font-medium">
            ₹{data.teacherPayouts.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">Completed payouts to teachers</p>
        </Card>
      </div>

      <h2 className="font-heading text-lg font-medium mb-4">Recent transactions</h2>

      {!hasActivity ? (
        <EmptyState
          title="No financial activity yet"
          description="Class payments from academy teachers will appear here once students purchase coaching."
        />
      ) : (
        <div className="rounded-[16px] border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-muted border-b border-border">
                {['Date', 'Description', 'Teacher', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">{formatRelativeDate(tx.createdAt)}</td>
                  <td className="px-4 py-3">{tx.description}</td>
                  <td className="px-4 py-3">{tx.counterpartyName ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">₹{tx.amountInr.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <Badge variant={tx.status === 'paid' ? 'primary' : 'default'}>{tx.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  )
}
