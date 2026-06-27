import type {
  Booking,
  CommunityPost,
  Payout,
  ScheduleClass,
  Student,
  Teacher,
  TeacherStatus,
} from '../types'
import type {
  BookingWithRelations,
  DbCategory,
  DbProfile,
  PayoutWithRelations,
  PostWithRelations,
  ProfileWithTeacher,
  ScheduleWithRelations,
} from '../types/database'
import {
  capitalizeBookingStatus,
  capitalizePaymentStatus,
  capitalizeStatus,
  formatRelativeDate,
  formatTime,
} from './format'

function getTeacherProfile(row: ProfileWithTeacher) {
  const tp = row.teacher_profiles
  return Array.isArray(tp) ? tp[0] : tp
}

export function mapCategory(row: DbCategory) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? 'Flower2',
  }
}

export function mapTeacher(row: ProfileWithTeacher, email = ''): Teacher {
  const tp = getTeacherProfile(row)
  const status = capitalizeStatus(tp?.status ?? 'pending') as TeacherStatus
  const expYears = parseInt(tp?.experience_years ?? '0', 10) || 0

  return {
    id: row.id,
    name: row.full_name ?? '',
    email,
    phone: row.phone ?? '',
    photo: row.avatar_url ?? '',
    coverPhoto: tp?.cover_url ?? '',
    specializations: tp?.specializations ?? [],
    rating: Number(tp?.rating ?? 0),
    experienceYears: expYears,
    monthlyFee: Number(tp?.monthly_fee ?? 0),
    city: row.city ?? '',
    state: row.state ?? '',
    teachingMode: 'Both',
    status,
    registeredDate: row.created_at.split('T')[0],
    totalStudents: tp?.total_students ?? 0,
    bio: tp?.bio ?? '',
    teachingStyle: tp?.bio ?? '',
    achievements: tp?.certifications ? [tp.certifications] : [],
    certifications: tp?.certifications ?? '',
    verified: tp?.status === 'verified',
  }
}

export function mapStudent(row: DbProfile | ProfileWithTeacher, email = '', sessions = 0, activeTeacherId?: string): Student {
  return {
    id: row.id,
    name: row.full_name ?? '',
    email,
    phone: row.phone ?? '',
    level: 'Student',
    avatar: row.avatar_url ?? '',
    joinedDate: row.created_at.split('T')[0],
    activeTeacherId,
    totalSessions: sessions,
  }
}

export function mapPost(row: PostWithRelations): CommunityPost {
  const teacherComment = row.comments?.find((c) => c.author?.role === 'teacher')

  return {
    id: row.id,
    studentId: row.author_id ?? '',
    studentName: row.author?.full_name ?? 'Unknown',
    studentAvatar: row.author?.avatar_url ?? '',
    level: row.author?.role === 'teacher' ? 'Teacher' : 'Student',
    text: row.content ?? '',
    image: row.media_type === 'image' ? row.media_url ?? undefined : undefined,
    video: row.media_type === 'video' ? row.media_url ?? undefined : undefined,
    likes: row.likes ?? 0,
    comments: row.comments?.length ?? 0,
    date: formatRelativeDate(row.created_at),
    teacherComment: teacherComment
      ? {
          teacherName: teacherComment.author?.full_name ?? 'Teacher',
          text: teacherComment.content ?? '',
        }
      : undefined,
  }
}

export function mapBooking(row: BookingWithRelations): Booking {
  return {
    id: row.id,
    studentId: row.student_id ?? '',
    studentName: row.student?.full_name ?? '',
    teacherId: row.teacher_id ?? '',
    teacherName: row.teacher?.full_name ?? '',
    startDate: row.start_date ?? '',
    monthlyFee: Number(row.monthly_fee ?? 0),
    status: capitalizeBookingStatus(row.status ?? 'active'),
    paymentStatus: capitalizePaymentStatus(row.payment_status ?? 'pending'),
  }
}

export function mapSchedule(row: ScheduleWithRelations, studentName?: string): ScheduleClass {
  const scheduledAt = row.scheduled_at ? new Date(row.scheduled_at) : new Date()
  return {
    id: row.id,
    teacherId: row.teacher_id ?? '',
    studentNames: [studentName ?? row.student?.full_name ?? 'Student'],
    time: row.scheduled_at ? formatTime(row.scheduled_at) : '',
    type: row.class_type ?? '1:1',
    date: scheduledAt.toISOString().split('T')[0],
  }
}

export function mapPayout(row: PayoutWithRelations): Payout {
  const status = (row.status ?? 'pending').toLowerCase()
  return {
    id: row.id,
    teacherId: row.teacher_id ?? '',
    teacherName: row.teacher?.full_name ?? '',
    amount: Number(row.amount ?? 0),
    period: row.period ?? '',
    status: status === 'paid' ? 'Paid' : 'Pending',
  }
}
