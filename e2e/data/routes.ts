/** All Yogstra routes for automated crawling and auth-guard checks. */

export type RouteSpec = {
  path: string
  name: string
  auth?: 'public' | 'student' | 'teacher' | 'admin' | 'academy' | 'competition'
  dynamic?: boolean
}

export const PUBLIC_ROUTES: RouteSpec[] = [
  { path: '/', name: 'Landing' },
  { path: '/discover', name: 'Discover' },
  { path: '/teachers', name: 'Find Teachers' },
  { path: '/academies', name: 'Academies' },
  { path: '/community', name: 'Community' },
  { path: '/competitions', name: 'Competitions' },
  { path: '/how-it-works', name: 'How It Works' },
  { path: '/about', name: 'About' },
  { path: '/help', name: 'Help Center' },
  { path: '/privacy-policy', name: 'Privacy Policy' },
  { path: '/terms-of-service', name: 'Terms of Service' },
  { path: '/refund-policy', name: 'Refund Policy' },
  { path: '/auth/login', name: 'Login' },
  { path: '/auth/student', name: 'Student Signup' },
  { path: '/auth/teacher/register', name: 'Teacher Register' },
  { path: '/auth/get-started', name: 'Get Started' },
]

export const STUDENT_ROUTES: RouteSpec[] = [
  { path: '/dashboard/student', name: 'Student Dashboard', auth: 'student' },
  { path: '/dashboard/student/explore', name: 'Student Explore', auth: 'student' },
  { path: '/dashboard/student/teachers', name: 'Student Teachers', auth: 'student' },
  { path: '/dashboard/student/community', name: 'Student Community', auth: 'student' },
  { path: '/dashboard/student/competitions', name: 'Student Competitions', auth: 'student' },
  { path: '/dashboard/student/competitions/my', name: 'My Competitions', auth: 'student' },
  { path: '/dashboard/student/results', name: 'Student Results', auth: 'student' },
  { path: '/dashboard/student/certificates', name: 'Student Certificates', auth: 'student' },
  { path: '/dashboard/student/rankings', name: 'Student Rankings', auth: 'student' },
  { path: '/dashboard/student/classes', name: 'Student Classes', auth: 'student' },
  { path: '/dashboard/student/messages', name: 'Student Messages', auth: 'student' },
  { path: '/dashboard/student/settings', name: 'Student Settings', auth: 'student' },
]

export const TEACHER_ROUTES: RouteSpec[] = [
  { path: '/dashboard/teacher', name: 'Teacher Dashboard', auth: 'teacher' },
  { path: '/dashboard/teacher/students', name: 'Teacher Students', auth: 'teacher' },
  { path: '/dashboard/teacher/schedule', name: 'Teacher Schedule', auth: 'teacher' },
  { path: '/dashboard/teacher/classes', name: 'Teacher Classes', auth: 'teacher' },
  { path: '/dashboard/teacher/community', name: 'Teacher Community', auth: 'teacher' },
  { path: '/dashboard/teacher/messages', name: 'Teacher Messages', auth: 'teacher' },
  { path: '/dashboard/teacher/notifications', name: 'Teacher Notifications', auth: 'teacher' },
  { path: '/dashboard/teacher/coupons', name: 'Teacher Coupons', auth: 'teacher' },
  { path: '/dashboard/teacher/earnings', name: 'Teacher Earnings', auth: 'teacher' },
  { path: '/dashboard/teacher/competitions', name: 'Teacher Competitions', auth: 'teacher' },
  { path: '/dashboard/teacher/settings', name: 'Teacher Settings', auth: 'teacher' },
]

export const ACADEMY_ROUTES: RouteSpec[] = [
  { path: '/dashboard/academy', name: 'Academy Dashboard', auth: 'academy' },
  { path: '/dashboard/academy/teachers', name: 'Academy Teachers', auth: 'academy' },
  { path: '/dashboard/academy/students', name: 'Academy Students', auth: 'academy' },
  { path: '/dashboard/academy/batches', name: 'Academy Batches', auth: 'academy' },
  { path: '/dashboard/academy/finance', name: 'Academy Finance', auth: 'academy' },
  { path: '/dashboard/academy/timetable', name: 'Academy Timetable', auth: 'academy' },
  { path: '/dashboard/academy/attendance', name: 'Academy Attendance', auth: 'academy' },
  { path: '/dashboard/academy/competitions', name: 'Academy Competitions', auth: 'academy' },
  { path: '/dashboard/academy/members', name: 'Academy Members', auth: 'academy' },
  { path: '/dashboard/academy/settings', name: 'Academy Settings', auth: 'academy' },
]

export const COMPETITION_ROUTES: RouteSpec[] = [
  { path: '/dashboard/competitions', name: 'Competition Home', auth: 'competition' },
  { path: '/dashboard/organizer', name: 'Organizer Home', auth: 'competition' },
  { path: '/dashboard/judge', name: 'Judge Home', auth: 'competition' },
  { path: '/dashboard/results', name: 'Competition Results', auth: 'competition' },
  { path: '/dashboard/rankings', name: 'Competition Rankings', auth: 'competition' },
  { path: '/dashboard/certificates', name: 'Competition Certificates', auth: 'competition' },
]

export const ADMIN_ROUTES: RouteSpec[] = [
  { path: '/admin', name: 'Admin Dashboard', auth: 'admin' },
  { path: '/admin/teachers', name: 'Admin Teachers', auth: 'admin' },
  { path: '/admin/students', name: 'Admin Students', auth: 'admin' },
  { path: '/admin/community', name: 'Admin Community', auth: 'admin' },
  { path: '/admin/bookings', name: 'Admin Bookings', auth: 'admin' },
  { path: '/admin/schedules', name: 'Admin Schedules', auth: 'admin' },
  { path: '/admin/chats', name: 'Admin Chats', auth: 'admin' },
  { path: '/admin/payouts', name: 'Admin Payouts', auth: 'admin' },
  { path: '/admin/categories', name: 'Admin Categories', auth: 'admin' },
  { path: '/admin/competitions', name: 'Admin Competitions', auth: 'admin' },
  { path: '/admin/academies', name: 'Admin Academies', auth: 'admin' },
  { path: '/admin/reports', name: 'Admin Reports', auth: 'admin' },
  { path: '/admin/users', name: 'Admin Users', auth: 'admin' },
  { path: '/admin/audit', name: 'Admin Audit', auth: 'admin' },
  { path: '/admin/system', name: 'Admin System', auth: 'admin' },
  { path: '/admin/feedback', name: 'Admin Feedback', auth: 'admin' },
  { path: '/admin/settings', name: 'Admin Settings', auth: 'admin' },
]

export const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
] as const
