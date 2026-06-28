export type UserRole = 'student' | 'teacher' | 'admin' | null

export type TeachingMode = 'Online' | 'Offline' | 'Both'

export type TeacherStatus = 'Pending' | 'Verified' | 'Rejected' | 'Removed'

export interface Category {
  id: string
  name: string
  icon: string
}

export interface Teacher {
  id: string
  name: string
  email: string
  phone: string
  photo: string
  coverPhoto: string
  specializations: string[]
  rating: number
  experienceYears: number
  monthlyFee: number
  city: string
  state: string
  teachingMode: TeachingMode
  status: TeacherStatus
  registeredDate: string
  totalStudents: number
  bio: string
  teachingStyle: string
  achievements: string[]
  certifications: string
  verified: boolean
  gender?: 'male' | 'female' | null
  pricing: TeacherPricing
}

export interface TeacherPricing {
  oneOnOneWeek: number
  oneOnOneMonth: number
  groupWeek: number
  groupMonth: number
}

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  level: string
  avatar: string
  joinedDate: string
  activeTeacherId?: string
  totalSessions: number
}

export interface StudentDetail extends Student {
  city: string
  state: string
  activeTeacherName?: string
}

export interface CommunityPost {
  id: string
  studentId: string
  studentName: string
  studentAvatar: string
  level: string
  text: string
  image?: string
  video?: string
  likes: number
  comments: number
  date: string
  pinned: boolean
  teacherComment?: {
    teacherName: string
    text: string
  }
}

export interface Competition {
  id: string
  name: string
  city: string
  date: string
}

export interface Booking {
  id: string
  studentId: string
  studentName: string
  teacherId: string
  teacherName: string
  startDate: string
  monthlyFee: number
  status: 'Active' | 'Pending' | 'Cancelled'
  paymentStatus: 'Paid' | 'Pending' | 'Overdue'
}

export interface ScheduleClass {
  id: string
  teacherId: string
  studentNames: string[]
  time: string
  type: '1:1' | 'group'
  date: string
}

export interface ChatConversation {
  id: string
  participantOneName: string
  participantTwoName: string
  participantOneRole: string
  participantTwoRole: string
  lastMessage: string
  messages: AdminChatMessage[]
}

export interface ReportedChatConversation extends ChatConversation {
  reportId: string
  reportReason: string
  reportedAt: string
  reporterName: string
  reportCount: number
  reportStatus: 'open' | 'reviewed' | 'dismissed'
  reviewedAt?: string | null
  messagesSnapshot?: AdminChatMessage[] | null
}

export interface AdminChatMessage {
  id?: string
  sender: string
  senderRole: string
  text: string
  time: string
  editedAt?: string | null
  deletedAt?: string | null
  deletedBy?: string | null
  deleteScope?: string | null
}

export interface ChatMessage {
  id: string
  bookingId: string
  senderId: string
  content: string
  createdAt: string
}

export interface MessageConversation {
  bookingId: string
  participantId: string
  participantName: string
  participantVerified?: boolean
  lastMessage?: string
  lastMessageAt?: string
}

export type ChatThreadStatus = 'pending' | 'accepted' | 'rejected'

export interface MessagingUser {
  id: string
  name: string
  avatar: string
  role: 'student' | 'teacher'
  verified?: boolean
  threadId?: string
  threadStatus?: ChatThreadStatus
  requestedBy?: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount?: number
  /** Thread exists but user deleted/hid it from their inbox */
  threadHidden?: boolean
}

export interface DirectChatMessage {
  id: string
  threadId: string
  senderId: string
  content: string
  createdAt: string
  editedAt?: string | null
  editedBy?: string | null
  deletedAt?: string | null
  deletedBy?: string | null
  deleteScope?: 'self' | 'both' | null
  hiddenFor?: string[]
}

export interface Payout {
  id: string
  teacherId: string
  teacherName: string
  studentName?: string
  amount: number
  grossAmount?: number
  commissionAmount?: number
  teacherAmount?: number
  period: string
  status: 'Pending' | 'Paid'
  createdAt?: string
  teacherUpiId?: string
}

export interface FilterState {
  categories: string[]
  teachingMode: TeachingMode | ''
  priceMin: number
  priceMax: number
  experience: string
  location: string
  rating: number
}

export interface TeacherRegistrationData {
  fullName: string
  email: string
  phone: string
  city: string
  state: string
  experienceYears: string
  specializations: string[]
  teachingMode: TeachingMode
  monthlyFee: string
  bio: string
  certifications: string
  password: string
  confirmPassword: string
}

export interface ActivityItem {
  id: string
  text: string
  time: string
}
