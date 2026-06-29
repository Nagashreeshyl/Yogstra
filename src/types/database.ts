export interface DbProfile {
  id: string
  role: 'student' | 'teacher' | 'admin' | null
  full_name: string | null
  phone: string | null
  city: string | null
  state: string | null
  avatar_url: string | null
  gender?: 'male' | 'female' | null
  created_at: string
}

export interface DbTeacherProfile {
  id: string
  bio: string | null
  experience_years: string | null
  monthly_fee: number | null
  fee_group?: number | null
  fee_1v1_week?: number | null
  fee_1v1_month?: number | null
  fee_group_week?: number | null
  fee_group_month?: number | null
  certifications: string | null
  rating: number | null
  total_students: number | null
  status: 'pending' | 'verified' | 'rejected' | 'removed' | null
  specializations: string[] | null
  cover_url: string | null
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
  pinned?: boolean | null
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
  academy_id?: string | null
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
  batch_id?: string | null
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
  student_id?: string | null
  amount: number | null
  gross_amount?: number | null
  commission_amount?: number | null
  teacher_amount?: number | null
  period: string | null
  status: string | null
  class_order_id?: string | null
  razorpay_payment_id?: string | null
  razorpay_transfer_id?: string | null
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
  student?: DbProfile | null
}

export interface DbAcademy {
  id: string
  parent_academy_id: string | null
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  city: string | null
  state: string | null
  status: 'active' | 'inactive' | 'archived'
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DbAcademySettings {
  academy_id: string
  timezone: string
  currency: string
  settings: Record<string, unknown>
  updated_at: string
}

export interface DbAcademyMember {
  id: string
  academy_id: string
  user_id: string
  role: 'owner' | 'manager' | 'teacher' | 'assistant_teacher' | 'receptionist' | 'finance_manager'
  status: 'active' | 'invited' | 'suspended' | 'removed'
  invited_by: string | null
  joined_at: string | null
  created_at: string
  updated_at: string
}

export interface DbTeacherAcademy {
  id: string
  academy_id: string
  teacher_id: string
  employment_type: 'employed' | 'affiliated' | 'visiting'
  is_primary: boolean
  status: 'active' | 'invited' | 'suspended' | 'removed'
  started_at: string | null
  created_at: string
  updated_at: string
}

export interface DbBatch {
  id: string
  academy_id: string
  branch_id: string | null
  teacher_id: string | null
  name: string
  description: string | null
  capacity: number | null
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  age_group: string | null
  language: string | null
  status: 'draft' | 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface DbBatchStudent {
  id: string
  batch_id: string
  student_id: string
  enrollment_type: 'academy' | 'independent'
  status: 'active' | 'transferred' | 'graduated' | 'removed'
  enrolled_at: string
  created_at: string
  updated_at: string
}
