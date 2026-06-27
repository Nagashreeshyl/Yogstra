import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { ResponsiveShell } from '../layout/ResponsiveShell'

export function AdminLayout() {
  return (
    <ResponsiveShell
      sidebar={<AdminSidebar />}
      title="Yogstra Admin"
      mainClassName="bg-cream"
    >
      <Outlet />
    </ResponsiveShell>
  )
}
