import { PageHeader } from '../../components/shell/PageHeader'
import { EmptyState } from '../../components/shell/EmptyState'
import { Trophy } from 'lucide-react'

interface CompetitionPlaceholderPageProps {
  title: string
  description: string
}

export function CompetitionPlaceholderPage({ title, description }: CompetitionPlaceholderPageProps) {
  return (
    <div className="py-8">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<Trophy size={24} />}
        title="Coming in Competition Module"
        description="This route is reserved. Competition management tools will ship in a future module."
        className="mt-8"
      />
    </div>
  )
}
