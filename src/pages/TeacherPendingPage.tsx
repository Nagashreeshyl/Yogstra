import { Link, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getPostLoginPath } from '../utils/authRouting'
import { reapplyAsTeacher } from '../services/teachers'
import { PageContainer } from '../components/shell/PageContainer'
import { PageHeader } from '../components/shell/PageHeader'
import { ErrorState } from '../components/shell/ErrorState'
import { Button } from '../components/ui/Button'
import { SimplePageSkeleton } from '../components/ui/Skeleton'
import { PublicFooter } from '../components/layout/PublicFooter'

// VERIFIED: teacher pending page polls status; auto-redirect when admin approves
export function TeacherPendingPage() {
  const { user, authLoading, logout, refreshUser } = useApp()
  const [reapplying, setReapplying] = useState(false)
  const [reapplyError, setReapplyError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'teacher' || user.teacherStatus === 'verified') return

    const interval = setInterval(() => {
      void refreshUser()
    }, 10000)

    return () => clearInterval(interval)
  }, [user, refreshUser])

  if (authLoading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-elevated">
        <SimplePageSkeleton />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-background">
        <PageContainer width="narrow" className="text-center !py-8">
          <PageHeader title="Account status" description="Please log in to view your account status." />
          <Link to="/auth/teacher">
            <Button>Teacher Login</Button>
          </Link>
        </PageContainer>
      </div>
    )
  }

  if (user.role !== 'teacher') {
    return <Navigate to={getPostLoginPath(user)} replace />
  }

  if (user.teacherStatus === 'verified') {
    window.location.href = '/dashboard/teacher'
    return null
  }

  const isRemoved = user.teacherStatus === 'removed'
  const isRejected = user.teacherStatus === 'rejected'

  const handleReapply = async () => {
    if (!user) return
    setReapplying(true)
    setReapplyError(null)
    try {
      await reapplyAsTeacher(user.id)
      await refreshUser()
    } catch {
      setReapplyError('Could not submit your request. Please try again or contact support.')
    } finally {
      setReapplying(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col bg-elevated">
      <div className="flex-1 flex flex-col items-center justify-center">
        <PageContainer width="narrow" className="!py-8">
          <div className="rounded-[16px] border border-border p-8 bg-elevated text-center space-y-6">
            <PageHeader
              title={
                isRemoved
                  ? 'Teacher Account Removed'
                  : isRejected
                    ? 'Application Not Approved'
                    : 'Account Under Verification'
              }
              description={
                isRemoved
                  ? 'Your teacher account was removed by an admin. You no longer have dashboard access. You can request verification again to rejoin Yogstra as a teacher.'
                  : isRejected
                    ? 'Your teacher application was not approved. Please contact Yogstra support if you believe this is an error.'
                    : 'Your teacher account is under verification. We will verify your credentials and contact you within 12–24 hours on your registered phone number. You will receive full dashboard access once verified.'
              }
              className="justify-center [&_h1]:text-center [&_p]:mx-auto"
            />
            {reapplyError && <ErrorState message={reapplyError} />}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isRemoved && (
            <Button onClick={() => void handleReapply()} disabled={reapplying}>
              {reapplying ? 'Submitting...' : 'Request Again'}
            </Button>
          )}
          <Link to="/">
            <Button variant="secondary">Browse Yogstra</Button>
          </Link>
          <Button onClick={() => logout()}>Logout</Button>
            </div>
          </div>
        </PageContainer>
      </div>
      <PublicFooter />
    </div>
  )
}
