import { Link } from 'react-router-dom'
import { CheckSquare } from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { EmptyState } from '../../shell/EmptyState'
import type { TeacherDashboardTask } from '../../../services/teacherDashboard'

interface TaskListProps {
  tasks: TeacherDashboardTask[]
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <DashboardCard title="Tasks" description="Actionable items for today">
      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={24} />}
          title="All caught up"
          description="No pending approvals or reviews. Check back after your next class."
          className="py-8"
        />
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link
                to={task.href}
                className="block rounded-[12px] border border-border px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <p className="text-sm font-medium text-foreground">{task.title}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}
