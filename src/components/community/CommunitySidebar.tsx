import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { studentProfilePath } from '../../utils/chatRoutes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveSync } from '../../hooks/useLiveSync'
import { fetchStudentList } from '../../services/students'
import { fetchTeachers } from '../../services/teachers'
import { Avatar } from '../ui/Avatar'

export function CommunitySidebar() {
  const { user, isLoggedIn } = useApp()
  const isTeacher = isLoggedIn && user?.role === 'teacher'

  const { data: students, loading: studentsLoading, refetch: refetchStudents } = useAsyncData(
    () => (isTeacher ? fetchStudentList() : Promise.resolve([])),
    [isTeacher],
  )

  const { data: teachers, refetch: refetchTeachers } = useAsyncData(
    () => (!isTeacher ? fetchTeachers(true) : Promise.resolve([])),
    [isTeacher],
  )

  useLiveSync(refetchStudents, ['bookings'], isTeacher)
  useLiveSync(refetchTeachers, ['teachers'], !isTeacher)

  const suggested = (teachers ?? [])
    .filter((t) => t.id !== user?.id)
    .slice(0, 5)

  const settingsPath = user?.role === 'teacher' ? '/dashboard/teacher/settings' : null

  return (
    <div className="space-y-6">
      {isLoggedIn && user && (
        <div className="flex items-center gap-3">
          <Avatar src={user.avatar} name={user.name} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-charcoal/50 capitalize">{user.role}</p>
          </div>
          {settingsPath && (
            <Link
              to={settingsPath}
              className="text-xs font-semibold text-teal hover:text-teal-dark shrink-0"
            >
              Edit
            </Link>
          )}
        </div>
      )}

      {isTeacher && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-charcoal/70">Students</p>
            <Link
              to="/dashboard/teacher/students"
              className="text-xs font-semibold text-charcoal/60 hover:text-charcoal"
            >
              My students
            </Link>
          </div>

          {studentsLoading ? (
            <p className="text-xs text-charcoal/45">Loading...</p>
          ) : (students ?? []).length === 0 ? (
            <p className="text-xs text-charcoal/45 leading-relaxed">
              No students registered yet.
            </p>
          ) : (
            <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {(students ?? []).map((student) => (
                <li key={student.id}>
                  <Link
                    to={studentProfilePath(student.id, 'teacher')}
                    className="flex items-center gap-3 group"
                  >
                    <Avatar src={student.avatar} name={student.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate group-hover:text-teal transition-colors">
                        {student.name}
                      </p>
                      {student.phone && (
                        <p className="text-xs text-charcoal/45 truncate">{student.phone}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!isTeacher && suggested.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-charcoal/70">Suggested for you</p>
            <Link to="/teachers" className="text-xs font-semibold text-charcoal/60 hover:text-charcoal">
              See all
            </Link>
          </div>
          <ul className="space-y-3">
            {suggested.map((teacher) => (
              <li key={teacher.id}>
                <Link
                  to={`/teachers/${teacher.id}`}
                  className="flex items-center gap-3 group"
                >
                  <Avatar src={teacher.photo} name={teacher.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate group-hover:text-charcoal/80">
                      {teacher.name}
                    </p>
                    <p className="text-xs text-charcoal/45 truncate">
                      {[teacher.city, teacher.specializations[0]].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
