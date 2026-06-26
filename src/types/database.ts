export interface DbProfile {
  id: string
  role: 'student' | 'teacher' | 'admin' | null
  full_name: string | null
  phone: string | null
  city: string | null
  state: string | null
  avatar_url: string | null
  created_at: string
}

export interface DbTeacherProfile {
  id: string
  bio: string | null
  experience_years: string | null
  monthly_fee: number | null
  certifications: string | null
  rating: number | null
  total_students: number | null
  status: 'pending' | 'verified' | 'rejected' | null
  specializations: string[] | null
}

export interface DbCategory {
  id: string
  name: string
  icon: string | null
  created_at: string
}

export interface DbPost {
  id: string
  author_id: string | null
  content: string | null
  media_url: string | null
  media_type: 'image' | 'video' | null
  likes: number | null
  created_at: string
}

export interface DbComment {
  id: string
  post_id: string | null
  author_id: string | null
  content: string | null
  created_at: string
}

export interface DbBooking {
  id: string
  student_id: string | null
  teacher_id: string | null
  status: string | null
  payment_status: string | null
  monthly_fee: number | null
  start_date: string | null
  created_at: string
}

export interface DbSchedule {
  id: string
  teacher_id: string | null
  student_id: string | null
  class_type: '1:1' | 'group' | null
  scheduled_at: string | null
  duration_minutes: number | null
  created_at: string
}

export interface DbMessage {
  id: string
  booking_id: string | null
  sender_id: string | null
  content: string | null
  created_at: string
}

export interface DbPayout {
  id: string
  teacher_id: string | null
  amount: number | null
  period: string | null
  status: string | null
  created_at: string
}

export type ProfileWithTeacher = DbProfile & {
  teacher_profiles: DbTeacherProfile | DbTeacherProfile[] | null
}

export type PostWithRelations = DbPost & {
  author: DbProfile | null
  comments: (DbComment & { author: DbProfile | null })[]
}

export type BookingWithRelations = DbBooking & {
  student: DbProfile | null
  teacher: DbProfile | null
}

export type ScheduleWithRelations = DbSchedule & {
  student: DbProfile | null
}

export type MessageWithRelations = DbMessage & {
  sender: DbProfile | null
  booking: (DbBooking & {
    student: DbProfile | null
    teacher: DbProfile | null
  }) | null
}

export type PayoutWithRelations = DbPayout & {
  teacher: DbProfile | null
}
