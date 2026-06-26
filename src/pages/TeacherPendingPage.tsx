import { Link, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getPostLoginPath } from '../utils/authRouting'
import { Button } from '../components/ui/Button'

export function TeacherPendingPage() {
  const { user, authLoading, logout } = useApp()

  if (authLoading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-cream">
        <p className="text-sm text-charcoal/50">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8 bg-cream text-center">
        <p className="text-charcoal/60 mb-4">Please log in to view your account status.</p>
        <Link to="/auth/teacher">
          <Button>Teacher Login</Button>
        </Link>
      </div>
    )
  }

  if (user.role !== 'teacher') {
    return <Navigate to={getPostLoginPath(user)} replace />
  }

  if (user.teacherStatus === 'verified') {
    return <Navigate to="/dashboard/teacher" replace />
  }

  const isRejected = user.teacherStatus === 'rejected'

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 bg-cream">
      <div className="max-w-md text-center border border-border rounded-sm p-8 bg-cream">
        <h1 className="font-heading text-2xl font-medium mb-4">
          {isRejected ? 'Application Not Approved' : 'Account Under Verification'}
        </h1>
        <p className="text-charcoal/70 leading-relaxed mb-6">
          {isRejected
            ? 'Your teacher application was not approved. Please contact Yogstra support if you believe this is an error.'
            : 'Your teacher account is under verification. We will verify your credentials and contact you within 12–24 hours on your registered phone number. You will receive full dashboard access once verified.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="secondary">Browse Yogstra</Button>
          </Link>
          <Button onClick={() => logout()}>Logout</Button>
        </div>
      </div>
    </div>
  )
}
