import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchTeacherStudents } from '../../services/students'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

export function TeacherStudentsPage() {
  const { user } = useApp()
  const { data: students, loading } = useAsyncData(
    () => (user ? fetchTeacherStudents(user.id) : Promise.resolve([])),
    [user?.id],
  )

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">My Students</h1>

      {loading ? (
        <p className="text-charcoal/50">Loading students...</p>
      ) : (students ?? []).length === 0 ? (
        <p className="text-charcoal/50">No active students yet.</p>
      ) : (
        <div className="space-y-3">
          {students!.map((s) => (
            <Card key={s.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {s.avatar && (
                  <img src={s.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                )}
                <div>
                  <p className="font-medium">{s.name}</p>
                  <Badge className="mt-1">{s.level}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">Message</Button>
                <Button size="sm">View Profile</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
