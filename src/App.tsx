import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AppLayout } from './components/layout/AppLayout'
import { LoggedInRedirect } from './components/auth/LoggedInRedirect'
import { StudentDashboardLayout } from './components/layout/StudentDashboardLayout'
import { TeacherDashboardLayout } from './components/layout/TeacherDashboardLayout'
import { AdminLayout } from './components/admin/AdminLayout'
import { RequireRole, RequireVerifiedTeacher, RequireGuest } from './components/auth/ProtectedRoute'
import { RequireAcademyFoundationAccess } from './components/auth/RequireAcademyFoundationAccess'
import { RequireCompetitionFoundationAccess } from './components/auth/RequireCompetitionFoundationAccess'
import { AcademyRouteLayout } from './components/academy/AcademyRouteLayout'
import { CompetitionRouteLayout } from './components/competition/CompetitionRouteLayout'
import { RouteAwareInstallBanner } from './components/pwa/RouteAwareInstallBanner'
import { DirectVideoCallProvider } from './components/chat/DirectVideoCallProvider'
import { PageLoadingFallback } from './components/ui/PageLoadingFallback'

const LandingPage = lazy(() => import('./pages/public/LandingPage').then((m) => ({ default: m.LandingPage })))
const GetStartedPage = lazy(() => import('./pages/public/GetStartedPage').then((m) => ({ default: m.GetStartedPage })))
const LoginPage = lazy(() => import('./pages/public/LoginPage').then((m) => ({ default: m.LoginPage })))
const WorkspacePickerPage = lazy(() => import('./pages/public/WorkspacePickerPage').then((m) => ({ default: m.WorkspacePickerPage })))
const HowYogstraWorksPage = lazy(() => import('./pages/public/HowYogstraWorksPage').then((m) => ({ default: m.HowYogstraWorksPage })))
const AcademySignupPage = lazy(() =>
  import('./pages/public/TeacherWorkspaceRedirectPage').then((m) => ({
    default: m.TeacherWorkspaceRedirectPage,
  })),
)
const OrganizerSignupPage = lazy(() =>
  import('./pages/public/TeacherWorkspaceRedirectPage').then((m) => ({
    default: m.TeacherWorkspaceRedirectPage,
  })),
)
const AboutPage = lazy(() => import('./pages/public/AboutPage').then((m) => ({ default: m.AboutPage })))
const HelpCenterPage = lazy(() => import('./pages/public/HelpCenterPage').then((m) => ({ default: m.HelpCenterPage })))
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const AcademiesPage = lazy(() => import('./pages/public/AcademiesPage').then((m) => ({ default: m.AcademiesPage })))
const AcademyProfilePage = lazy(() => import('./pages/public/AcademyProfilePage').then((m) => ({ default: m.AcademyProfilePage })))
const ExplorePage = lazy(() => import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage })))
const FindTeachersPage = lazy(() => import('./pages/FindTeachersPage').then((m) => ({ default: m.FindTeachersPage })))
const TeacherProfilePage = lazy(() => import('./pages/TeacherProfilePage').then((m) => ({ default: m.TeacherProfilePage })))
const StudentProfilePage = lazy(() => import('./pages/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage })))
const CommunityPage = lazy(() => import('./pages/CommunityPage').then((m) => ({ default: m.CommunityPage })))
const CompetitionsPage = lazy(() => import('./pages/CompetitionsPage').then((m) => ({ default: m.CompetitionsPage })))
const PublicCompetitionDetailPage = lazy(() =>
  import('./pages/CompetitionsPage').then((m) => ({ default: m.PublicCompetitionDetailPage })),
)
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })))
const StudentAuthPage = lazy(() => import('./pages/StudentAuthPage').then((m) => ({ default: m.StudentAuthPage })))
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
const AdminCompetitionsPage = lazy(() => import('./pages/admin/AdminCompetitionsPage').then((m) => ({ default: m.AdminCompetitionsPage })))
const AdminAcademiesPage = lazy(() => import('./pages/admin/AdminAcademiesPage').then((m) => ({ default: m.AdminAcademiesPage })))
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })))
const AdminAuditPage = lazy(() => import('./pages/admin/AdminAuditPage').then((m) => ({ default: m.AdminAuditPage })))
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })))
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfServicePage').then((m) => ({ default: m.TermsOfServicePage })))
const RefundPolicyPage = lazy(() => import('./pages/legal/RefundPolicyPage').then((m) => ({ default: m.RefundPolicyPage })))
const AcademyHomePage = lazy(() => import('./pages/academy/academyPages').then((m) => ({ default: m.AcademyHomePage })))
const AcademyTeachersPage = lazy(() => import('./pages/academy/academyPages').then((m) => ({ default: m.AcademyTeachersPage })))
const AcademyStudentsPage = lazy(() => import('./pages/academy/academyPages').then((m) => ({ default: m.AcademyStudentsPage })))
const AcademyBatchesPage = lazy(() => import('./pages/academy/academyPages').then((m) => ({ default: m.AcademyBatchesPage })))
const AcademyFinancePage = lazy(() => import('./pages/academy/academyPages').then((m) => ({ default: m.AcademyFinancePage })))
const AcademyMembersPage = lazy(() => import('./pages/academy/academyPages').then((m) => ({ default: m.AcademyMembersPage })))
const AcademySettingsPage = lazy(() => import('./pages/academy/academyPages').then((m) => ({ default: m.AcademySettingsPage })))
const AcademyCompetitionsPage = lazy(() => import('./pages/academy/academyPages').then((m) => ({ default: m.AcademyCompetitionsPage })))
const AcademyTimetablePage = lazy(() => import('./pages/academy/academyPages').then((m) => ({ default: m.AcademyTimetablePage })))
const AcademyAttendancePage = lazy(() => import('./pages/academy/academyPages').then((m) => ({ default: m.AcademyAttendancePage })))
const TeacherCompetitionsPage = lazy(() => import('./pages/teacher/TeacherCompetitionsPage').then((m) => ({ default: m.TeacherCompetitionsPage })))
const VerifyCertificatePage = lazy(() => import('./pages/VerifyCertificatePage').then((m) => ({ default: m.VerifyCertificatePage })))
const CompetitionHomePage = lazy(() => import('./pages/competition/competitionPages').then((m) => ({ default: m.CompetitionHomePage })))
const CompetitionDetailPage = lazy(() => import('./pages/competition/competitionPages').then((m) => ({ default: m.CompetitionDetailPage })))
const JudgeHomePage = lazy(() => import('./pages/competition/competitionPages').then((m) => ({ default: m.JudgeHomePage })))
const JudgeSessionPage = lazy(() => import('./pages/judge/judgePages').then((m) => ({ default: m.JudgeSessionPage })))
const OrganizerHomePage = lazy(() => import('./pages/competition/competitionPages').then((m) => ({ default: m.OrganizerHomePage })))
const CompetitionResultsPage = lazy(() => import('./pages/competition/competitionPages').then((m) => ({ default: m.CompetitionResultsPage })))
const CompetitionRankingsPage = lazy(() => import('./pages/competition/competitionPages').then((m) => ({ default: m.CompetitionRankingsPage })))
const CompetitionCertificatesPage = lazy(() => import('./pages/competition/competitionPages').then((m) => ({ default: m.CompetitionCertificatesPage })))

const StudentCompetitionLayout = lazy(() =>
  import('./components/student/competition/StudentCompetitionLayout').then((m) => ({
    default: m.StudentCompetitionLayout,
  })),
)
const StudentCompetitionHomePage = lazy(() =>
  import('./pages/student/competition/StudentCompetitionHomePage').then((m) => ({
    default: m.StudentCompetitionHomePage,
  })),
)
const StudentMyCompetitionsPage = lazy(() =>
  import('./pages/student/competition/StudentCompetitionHomePage').then((m) => ({
    default: m.StudentMyCompetitionsPage,
  })),
)
const StudentCompetitionDetailPage = lazy(() =>
  import('./pages/student/competition/StudentCompetitionDetailPage').then((m) => ({
    default: m.StudentCompetitionDetailPage,
  })),
)
const StudentRegistrationWizardPage = lazy(() =>
  import('./pages/student/competition/StudentRegistrationWizardPage').then((m) => ({
    default: m.StudentRegistrationWizardPage,
  })),
)
const StudentPreparationPage = lazy(() =>
  import('./pages/student/competition/StudentPreparationPage').then((m) => ({
    default: m.StudentPreparationPage,
  })),
)
const StudentLiveStatusPage = lazy(() =>
  import('./pages/student/competition/StudentLiveStatusPage').then((m) => ({
    default: m.StudentLiveStatusPage,
  })),
)
const StudentResultsHubPage = lazy(() =>
  import('./pages/student/competition/StudentResultsHubPage').then((m) => ({
    default: m.StudentResultsHubPage,
  })),
)
const StudentCertificatesPage = lazy(() =>
  import('./pages/student/competition/StudentCertificatesPage').then((m) => ({
    default: m.StudentCertificatesPage,
  })),
)
const StudentRankingsPage = lazy(() =>
  import('./pages/student/competition/StudentRankingsPage').then((m) => ({
    default: m.StudentRankingsPage,
  })),
)

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
                <Route index element={<LandingPage />} />
                <Route path="discover" element={<ExplorePage />} />
                <Route path="explore" element={<Navigate to="/discover" replace />} />
                <Route path="teachers" element={<FindTeachersPage />} />
                <Route path="teachers/:id" element={<TeacherProfilePage />} />
                <Route path="academies" element={<AcademiesPage />} />
                <Route path="academies/:slug" element={<AcademyProfilePage />} />
                <Route path="students/:id" element={<StudentProfilePage />} />
                <Route path="community" element={<CommunityPage />} />
                <Route path="competitions" element={<CompetitionsPage />} />
                <Route path="competitions/:slug" element={<PublicCompetitionDetailPage />} />
                <Route path="how-it-works" element={<HowYogstraWorksPage />} />
                <Route path="pricing" element={<Navigate to="/how-it-works" replace />} />
                <Route path="contact" element={<Navigate to="/help" replace />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="help" element={<HelpCenterPage />} />
                <Route path="shop" element={<Navigate to="/discover" replace />} />
                <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="terms-of-service" element={<TermsOfServicePage />} />
                <Route path="refund-policy" element={<RefundPolicyPage />} />
                <Route path="verify/certificate/:token" element={<VerifyCertificatePage />} />
              </Route>

              <Route
                path="auth/role"
                element={<Navigate to="/auth/get-started" replace />}
              />

              <Route
                path="auth/get-started"
                element={
                  <LoggedInRedirect>
                    <GetStartedPage />
                  </LoggedInRedirect>
                }
              />

              <Route
                path="auth/login"
                element={
                  <LoggedInRedirect>
                    <LoginPage />
                  </LoggedInRedirect>
                }
              />

              <Route path="auth/workspace" element={<WorkspacePickerPage />} />

              <Route element={<RequireGuest />}>
                <Route path="auth/student" element={<StudentAuthPage />} />
                <Route path="auth/academy" element={<AcademySignupPage intent="academy" />} />
                <Route path="auth/organizer" element={<OrganizerSignupPage intent="competition" />} />
                <Route path="auth/teacher" element={<Navigate to="/auth/login" replace />} />
                <Route path="auth/teacher/register" element={<TeacherRegistrationPage />} />
              </Route>

              <Route path="auth/teacher/pending" element={<TeacherPendingPage />} />

              <Route element={<RequireRole roles={['student', 'admin']} />}>
                <Route path="dashboard/student" element={<StudentDashboardLayout />}>
                  <Route index element={<StudentDashboardPage />} />
                  <Route path="explore" element={<ExplorePage />} />
                  <Route path="teachers" element={<FindTeachersPage />} />
                  <Route path="teachers/:id" element={<TeacherProfilePage />} />
                  <Route path="community" element={<CommunityPage />} />
                  <Route path="competitions" element={<StudentCompetitionLayout />}>
                    <Route index element={<StudentCompetitionHomePage />} />
                    <Route path="my" element={<StudentMyCompetitionsPage />} />
                    <Route path="register/:competitionId" element={<StudentRegistrationWizardPage />} />
                    <Route path=":competitionId/preparation" element={<StudentPreparationPage />} />
                    <Route path=":competitionId/live" element={<StudentLiveStatusPage />} />
                    <Route path=":competitionId" element={<StudentCompetitionDetailPage />} />
                  </Route>
                  <Route path="results" element={<StudentResultsHubPage />} />
                  <Route path="certificates" element={<StudentCertificatesPage />} />
                  <Route path="rankings" element={<StudentRankingsPage />} />
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
                  <Route path="competitions" element={<TeacherCompetitionsPage />} />
                  <Route path="settings" element={<TeacherSettingsPage />} />
                </Route>
                <Route path="teacher/messages" element={<Navigate to="/dashboard/teacher/messages" replace />} />
              </Route>

              <Route element={<RequireAcademyFoundationAccess />}>
                <Route path="dashboard/academy" element={<AcademyRouteLayout />}>
                  <Route index element={<AcademyHomePage />} />
                  <Route path="teachers" element={<AcademyTeachersPage />} />
                  <Route path="students" element={<AcademyStudentsPage />} />
                  <Route path="batches" element={<AcademyBatchesPage />} />
                  <Route path="finance" element={<AcademyFinancePage />} />
                  <Route path="timetable" element={<AcademyTimetablePage />} />
                  <Route path="attendance" element={<AcademyAttendancePage />} />
                  <Route path="competitions" element={<AcademyCompetitionsPage />} />
                  <Route path="members" element={<AcademyMembersPage />} />
                  <Route path="settings" element={<AcademySettingsPage />} />
                </Route>
              </Route>

              <Route element={<RequireCompetitionFoundationAccess />}>
                <Route path="dashboard/competitions" element={<CompetitionRouteLayout />}>
                  <Route index element={<CompetitionHomePage />} />
                  <Route path=":id" element={<CompetitionDetailPage />} />
                </Route>
                <Route path="dashboard/judge" element={<CompetitionRouteLayout />}>
                  <Route index element={<JudgeHomePage />} />
                  <Route path="session/:competitionId/:categoryId" element={<JudgeSessionPage />} />
                </Route>
                <Route path="dashboard/organizer" element={<CompetitionRouteLayout />}>
                  <Route index element={<OrganizerHomePage />} />
                </Route>
                <Route path="dashboard/results" element={<CompetitionRouteLayout />}>
                  <Route index element={<CompetitionResultsPage />} />
                </Route>
                <Route path="dashboard/rankings" element={<CompetitionRouteLayout />}>
                  <Route index element={<CompetitionRankingsPage />} />
                </Route>
                <Route path="dashboard/certificates" element={<CompetitionRouteLayout />}>
                  <Route index element={<CompetitionCertificatesPage />} />
                </Route>
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
                  <Route path="competitions" element={<AdminCompetitionsPage />} />
                  <Route path="academies" element={<AdminAcademiesPage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="audit" element={<AdminAuditPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </DirectVideoCallProvider>
    </AppProvider>
  )
}
