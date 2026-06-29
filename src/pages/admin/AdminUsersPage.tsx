import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchAllTeachersAdmin } from '../../services/teachers'
import { fetchStudents } from '../../services/students'
import { AdminTable, AdminPagination } from '../../components/admin/AdminTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'

const PAGE_SIZE = 10

type UserRow = {
  id: string
  name: string
  email: string
  phone: string
  role: 'teacher' | 'student'
  status: string
  city: string
  registeredDate: string
}

export function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data: teachers, loading: teachersLoading, error: teachersError } = useAsyncData(() =>
    fetchAllTeachersAdmin(),
  )
  const { data: students, loading: studentsLoading, error: studentsError } = useAsyncData(() =>
    fetchStudents(),
  )

  const loading = teachersLoading || studentsLoading
  const error = teachersError || studentsError

  const users = useMemo<UserRow[]>(() => {
    const teacherRows: UserRow[] = (teachers ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      role: 'teacher',
      status: t.status,
      city: t.city,
      registeredDate: t.registeredDate,
    }))
    const studentRows: UserRow[] = (students ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      role: 'student',
      status: 'Active',
      city: '—',
      registeredDate: s.joinedDate ?? '—',
    }))
    return [...teacherRows, ...studentRows].sort((a, b) => a.name.localeCompare(b.name))
  }, [teachers, students])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.phone.includes(search)
      const matchRole = !roleFilter || u.role === roleFilter
      return matchSearch && matchRole
    })
  }, [users, search, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Users</h1>

      {loading ? (
        <TeacherTableSkeleton rows={6} />
      ) : error ? (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3 rounded-sm">
          Unable to load users. Please refresh the page.
        </p>
      ) : (
        <>
          <AdminTable
            headers={['Name', 'Role', 'Email', 'Phone', 'City', 'Status', 'Registered', 'Actions']}
            searchPlaceholder="Search users..."
            filterOptions={[
              { label: 'Teachers', value: 'teacher' },
              { label: 'Students', value: 'student' },
            ]}
            onSearch={(q) => {
              setSearch(q)
              setPage(1)
            }}
            onFilter={(value) => {
              setRoleFilter(value)
              setPage(1)
            }}
          >
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-3 text-sm text-charcoal/50">
                  No users found.
                </td>
              </tr>
            ) : (
              paginated.map((u) => (
                <tr key={`${u.role}-${u.id}`} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 capitalize">
                    <Badge variant={u.role === 'teacher' ? 'teal' : 'verified'}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{u.email || '—'}</td>
                  <td className="px-4 py-3">{u.phone || '—'}</td>
                  <td className="px-4 py-3">{u.city}</td>
                  <td className="px-4 py-3">{u.status}</td>
                  <td className="px-4 py-3 text-charcoal/70">{u.registeredDate}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={u.role === 'teacher' ? `/teachers/${u.id}` : `/students/${u.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </AdminTable>

          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
