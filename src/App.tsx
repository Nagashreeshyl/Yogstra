import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AppLayout } from './components/layout/AppLayout'
import { LoggedInRedirect } from './components/auth/LoggedInRedirect'
import { StudentDashboardLayout } from './components/layout/StudentDashboardLayout'
import { TeacherDashboardLayout } from './components/layout/TeacherDashboardLayout'
import { AdminLayout } from './components/admin/AdminLayout'
import { RequireRole, RequireVerifiedTeacher, RequireGuest } from './components/auth/ProtectedRoute'
import { ExplorePage } from './pages/ExplorePage'
import { FindTeachersPage } from './pages/FindTeachersPage'
import { TeacherProfilePage } from './pages/TeacherProfilePage'
import { StudentProfilePage } from './pages/StudentProfilePage'
import { CommunityPage } from './pages/CommunityPage'
import { CompetitionsPage } from './pages/CompetitionsPage'
import { ShopPage } from './pages/ShopPage'
import { RoleSelectionPage } from './pages/RoleSelectionPage'
import { StudentAuthPage } from './pages/StudentAuthPage'
import { TeacherLoginPage } from './pages/TeacherLoginPage'
import { TeacherRegistrationPage } from './pages/TeacherRegistrationPage'
import { TeacherPendingPage } from './pages/TeacherPendingPage'
import { StudentMessagesPage } from './pages/StudentMessagesPage'
import { StudentSettingsPage } from './pages/student/StudentSettingsPage'
import { TeacherDashboardPage } from './pages/TeacherDashboardPage'
import { TeacherStudentsPage } from './pages/teacher/TeacherStudentsPage'
import { TeacherSchedulePage } from './pages/teacher/TeacherSchedulePage'
import { TeacherEarningsPage } from './pages/teacher/TeacherEarningsPage'
import { TeacherSettingsPage } from './pages/teacher/TeacherSettingsPage'
import { TeacherCommunityPage } from './pages/teacher/TeacherCommunityPage'
import { TeacherMessagesPage } from './pages/teacher/TeacherMessagesPage'
import { TeacherNotificationsPage } from './pages/teacher/TeacherNotificationsPage'
import { TeacherCouponsPage } from './pages/teacher/TeacherCouponsPage'
import { TeacherClassesPage } from './pages/teacher/TeacherClassesPage'
import { StudentClassesPage } from './pages/student/StudentClassesPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminTeachersPage } from './pages/admin/AdminTeachersPage'
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage'
import { AdminCommunityPage } from './pages/admin/AdminCommunityPage'
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage'
import { AdminSchedulesPage } from './pages/admin/AdminSchedulesPage'
import { AdminChatsPage } from './pages/admin/AdminChatsPage'
import { AdminPayoutsPage } from './pages/admin/AdminPayoutsPage'
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import { InstallAppPrompt } from './components/pwa/InstallAppPrompt'
import { DirectVideoCallProvider } from './components/chat/DirectVideoCallProvider'

export default function App() {
  return (
    <AppProvider>
      <DirectVideoCallProvider>
      <BrowserRouter>
        <InstallAppPrompt variant="banner" />
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
              <Route index element={<Navigate to="explore" replace />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="teachers" element={<FindTeachersPage />} />
              <Route path="teachers/:id" element={<TeacherProfilePage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="competitions" element={<CompetitionsPage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="messages" element={<StudentMessagesPage />} />
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
      </BrowserRouter>
      </DirectVideoCallProvider>
    </AppProvider>
  )
}
