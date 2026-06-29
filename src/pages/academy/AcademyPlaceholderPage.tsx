import { PageHeader } from '../../components/shell/PageHeader'
import { EmptyState } from '../../components/shell/EmptyState'
import { Building2 } from 'lucide-react'

interface AcademyPlaceholderPageProps {
  title: string
  description: string
}

export function AcademyPlaceholderPage({ title, description }: AcademyPlaceholderPageProps) {
  return (
    <div className="py-8">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<Building2 size={24} />}
        title="Coming in Academy Module"
        description="This route is reserved. The academy dashboard and management tools will ship in a future module."
        className="mt-8"
      />
    </div>
  )
}
