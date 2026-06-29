import { Outlet } from 'react-router-dom'
import { PageContainer } from '../shell/PageContainer'

/** Minimal layout wrapper for reserved academy routes — dashboard UI ships later. */
export function AcademyRouteLayout() {
  return (
    <PageContainer width="wide">
      <Outlet />
    </PageContainer>
  )
}
