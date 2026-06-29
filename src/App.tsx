import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AppLayout } from './components/layout/AppLayout'
import { LoggedInRedirect } from './components/auth/LoggedInRedirect'
import { StudentDashboardLayout } from './components/layout/StudentDashboardLayout'
import { TeacherDashboardLayout } from './components/layout/TeacherDashboardLayout'
import { AdminLayout } from './components/admin/AdminLayout'
import { RequireRole, RequireVerifiedTeacher, RequireGuest } from './components/auth/ProtectedRoute'
import { RouteAwareInstallBanner } from './components/pwa/RouteAwareInstallBanner'
import { DirectVideoCallProvider } from './components/chat/DirectVideoCallProvider'
import { PageLoadingFallback } from './components/ui/PageLoadingFallback'

const ExplorePage = lazy(() => import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage })))
const FindTeachersPage = lazy(() => import('./pages/FindTeachersPage').then((m) => ({ default: m.FindTeachersPage })))
const TeacherProfilePage = lazy(() => import('./pages/TeacherProfilePage').then((m) => ({ default: m.TeacherProfilePage })))
const StudentProfilePage = lazy(() => import('./pages/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage })))
const CommunityPage = lazy(() => import('./pages/CommunityPage').then((m) => ({ default: m.CommunityPage })))
const CompetitionsPage = lazy(() => import('./pages/CompetitionsPage').then((m) => ({ default: m.CompetitionsPage })))
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })))
const RoleSelectionPage = lazy(() => import('./pages/RoleSelectionPage').then((m) => ({ default: m.RoleSelectionPage })))
const StudentAuthPage = lazy(() => import('./pages/StudentAuthPage').then((m) => ({ default: m.StudentAuthPage })))
const TeacherLoginPage = lazy(() => import('./pages/TeacherLoginPage').then((m) => ({ default: m.TeacherLoginPage })))
const TeacherRegistrationPage = lazy(() => import('./pages/TeacherRegistrationPage').then((m) => ({ default: m.TeacherRegistrationPage })))
const TeacherPendingPage = lazy(() => import('./pages/TeacherPendingPage').then((m) => ({ default: m.TeacherPendingPage })))
const StudentMessagesPage = lazy(() => import('./pages/StudentMessagesPage').then((m) => ({ default: m.StudentMessagesPage })))
const StudentSettingsPage = lazy(() => import('./pages/student/StudentSettingsPage').then((m) => ({ default: m.StudentSettingsPage })))
const TeacherDashboardPage = lazy(() => import('./pages/TeacherDashboardPage').then((m) => ({ default: m.TeacherDashboardPage })))
const TeacherStudentsPage = lazy(() => import('./pages/teacher/TeacherStudentsPage').then((m) => ({ default: m.TeacherStudentsPage })))
const TeacherSchedulePage = lazy(() => import('./pages/teacher/TeacherSchedulePage').then((m) => ({ default: m.TeacherSchedulePage })))
const TeacherEarningsPage = lazy(() => import('./pages/teacher/TeacherEarningsPage').then((m) => ({ default: m.TeacherEarningsPage })))
const TeacherSettingsPage = lazy(() => import('./pages/teacher/TeacherSettingsPage').then((m) => ({ default: m.TeacherSettingsPage })))
const TeacherCommunityPage = lazy(() => import('./pages/teacher/TeacherCommunityPage').then((m) => ({ default: m.TeacherCommunityPage })))
const TeacherMessagesPage = lazy(() => import('./pages/teacher/TeacherMessagesPage').then((m) => ({ default: m.TeacherMessagesPage })))
const TeacherNotificationsPage = lazy(() => import('./pages/teacher/TeacherNotificationsPage').then((m) => ({ default: m.TeacherNotificationsPage })))
const TeacherCouponsPage = lazy(() => import('./pages/teacher/TeacherCouponsPage').then((m) => ({ default: m.TeacherCouponsPage })))
const TeacherClassesPage = lazy(() => import('./pages/teacher/TeacherClassesPage').then((m) => ({ default: m.TeacherClassesPage })))
const StudentDashboardPage = lazy(() => import('./pages/student/StudentDashboardPage').then((m) => ({ default: m.StudentDashboardPage })))
const StudentClassesPage = lazy(() => import('./pages/student/StudentClassesPage').then((m) => ({ default: m.StudentClassesPage })))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })))
const AdminTeachersPage = lazy(() => import('./pages/admin/AdminTeachersPage').then((m) => ({ default: m.AdminTeachersPage })))
const AdminStudentsPage = lazy(() => import('./pages/admin/AdminStudentsPage').then((m) => ({ default: m.AdminStudentsPage })))
const AdminCommunityPage = lazy(() => import('./pages/admin/AdminCommunityPage').then((m) => ({ default: m.AdminCommunityPage })))
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage').then((m) => ({ default: m.AdminBookingsPage })))
const AdminSchedulesPage = lazy(() => import('./pages/admin/AdminSchedulesPage').then((m) => ({ default: m.AdminSchedulesPage })))
const AdminChatsPage = lazy(() => import('./pages/admin/AdminChatsPage').then((m) => ({ default: m.AdminChatsPage })))
const AdminPayoutsPage = lazy(() => import('./pages/admin/AdminPayoutsPage').then((m) => ({ default: m.AdminPayoutsPage })))
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })))
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })))
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfServicePage').then((m) => ({ default: m.TermsOfServicePage })))
const RefundPolicyPage = lazy(() => import('./pages/legal/RefundPolicyPage').then((m) => ({ default: m.RefundPolicyPage })))

export default function App() {
  return (
    <AppProvider>
      <DirectVideoCallProvider>
        <BrowserRouter>
          <RouteAwareInstallBanner />
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route
                element={
                  <LoggedInRedirect>
                    <AppLayout />
                  </LoggedInRedirect>
                }
              >
                <Route index element={<ExplorePage />} />
                <Route path="teachers" element={<FindTeachersPage />} />
                <Route path="teachers/:id" element={<TeacherProfilePage />} />
                <Route path="students/:id" element={<StudentProfilePage />} />
                <Route path="community" element={<CommunityPage />} />
                <Route path="competitions" element={<CompetitionsPage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="terms-of-service" element={<TermsOfServicePage />} />
                <Route path="refund-policy" element={<RefundPolicyPage />} />
              </Route>

              <Route
                path="auth/role"
                element={
                  <LoggedInRedirect>
                    <RoleSelectionPage />
                  </LoggedInRedirect>
                }
              />

              <Route element={<RequireGuest />}>
                <Route path="auth/student" element={<StudentAuthPage />} />
                <Route path="auth/teacher" element={<TeacherLoginPage />} />
                <Route path="auth/teacher/register" element={<TeacherRegistrationPage />} />
              </Route>

              <Route path="auth/teacher/pending" element={<TeacherPendingPage />} />

              <Route element={<RequireRole roles={['student']} />}>
                <Route path="dashboard/student" element={<StudentDashboardLayout />}>
                  <Route index element={<StudentDashboardPage />} />
                  <Route path="explore" element={<ExplorePage />} />
                  <Route path="teachers" element={<FindTeachersPage />} />
                  <Route path="teachers/:id" element={<TeacherProfilePage />} />
                  <Route path="community" element={<CommunityPage />} />
                  <Route path="competitions" element={<CompetitionsPage />} />
                  <Route path="shop" element={<ShopPage />} />
                  <Route path="messages" element={<StudentMessagesPage />} />
                  <Route path="students/:id" element={<StudentProfilePage />} />
                  <Route path="classes" element={<StudentClassesPage />} />
                  <Route path="classes/room/:sessionId" element={<StudentClassesPage />} />
                  <Route path="settings" element={<StudentSettingsPage />} />
                </Route>
                <Route path="student/messages" element={<Navigate to="/dashboard/student/messages" replace />} />
              </Route>

              <Route element={<RequireVerifiedTeacher />}>
                <Route path="dashboard/teacher" element={<TeacherDashboardLayout />}>
                  <Route index element={<TeacherDashboardPage />} />
                  <Route path="students" element={<TeacherStudentsPage />} />
                  <Route path="students/:id" element={<StudentProfilePage />} />
                  <Route path="schedule" element={<TeacherSchedulePage />} />
                  <Route path="classes" element={<TeacherClassesPage />} />
                  <Route path="classes/room/:sessionId" element={<TeacherClassesPage />} />
                  <Route path="community" element={<TeacherCommunityPage />} />
                  <Route path="messages" element={<TeacherMessagesPage />} />
                  <Route path="notifications" element={<TeacherNotificationsPage />} />
                  <Route path="coupons" element={<TeacherCouponsPage />} />
                  <Route path="earnings" element={<TeacherEarningsPage />} />
                  <Route path="settings" element={<TeacherSettingsPage />} />
                </Route>
                <Route path="teacher/messages" element={<Navigate to="/dashboard/teacher/messages" replace />} />
              </Route>

              <Route element={<RequireRole roles={['admin']} />}>
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="teachers" element={<AdminTeachersPage />} />
                  <Route path="students" element={<AdminStudentsPage />} />
                  <Route path="community" element={<AdminCommunityPage />} />
                  <Route path="bookings" element={<AdminBookingsPage />} />
                  <Route path="schedules" element={<AdminSchedulesPage />} />
                  <Route path="chats" element={<AdminChatsPage />} />
                  <Route path="payouts" element={<AdminPayoutsPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </DirectVideoCallProvider>
    </AppProvider>
  )
}
