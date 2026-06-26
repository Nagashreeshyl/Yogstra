export type UserRole = 'student' | 'teacher' | 'admin' | null

export type TeachingMode = 'Online' | 'Offline' | 'Both'

export type TeacherStatus = 'Pending' | 'Verified' | 'Rejected'

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
  teacherName: string
  studentName: string
  lastMessage: string
  messages: { sender: string; text: string; time: string }[]
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

export interface Payout {
  id: string
  teacherId: string
  teacherName: string
  amount: number
  period: string
  status: 'Pending' | 'Paid'
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
