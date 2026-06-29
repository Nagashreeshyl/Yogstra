import { Outlet } from 'react-router-dom'
import { PageContainer } from '../shell/PageContainer'

/** Minimal layout wrapper for reserved competition routes — dashboard UI ships later. */
export function CompetitionRouteLayout() {
  return (
    <PageContainer width="wide">
      <Outlet />
    </PageContainer>
  )
}
