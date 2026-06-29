import { CompetitionPlaceholderPage } from './CompetitionPlaceholderPage'
import { OrganizerDashboardPage } from './OrganizerDashboardPage'
import { JudgeDashboardPage } from '../judge/JudgeDashboardPage'

export function CompetitionHomePage() {
  return (
    <CompetitionPlaceholderPage
      title="Competitions"
      description="Browse and manage yoga competitions."
    />
  )
}

export function CompetitionDetailPage() {
  return (
    <CompetitionPlaceholderPage
      title="Competition Details"
      description="View competition information, categories, and registration."
    />
  )
}

export function JudgeHomePage() {
  return <JudgeDashboardPage />
}

export function OrganizerHomePage() {
  return <OrganizerDashboardPage />
}

export function CompetitionResultsPage() {
  return (
    <CompetitionPlaceholderPage
      title="Results"
      description="View approved competition results and medals."
    />
  )
}

export function CompetitionRankingsPage() {
  return (
    <CompetitionPlaceholderPage
      title="Rankings"
      description="Student, teacher, academy, state, and national rankings."
    />
  )
}

export function CompetitionCertificatesPage() {
  return (
    <CompetitionPlaceholderPage
      title="Certificates"
      description="Download and verify competition certificates."
    />
  )
}
