import type { Teacher } from '../types'

export type TeacherProfileCompletion = {
  photo: boolean
  cover: boolean
  name: boolean
  phone: boolean
  location: boolean
  bio: boolean
  certifications: boolean
  gender: boolean
  specializations: boolean
  pricing: boolean
}

export const TEACHER_PROFILE_CHECKLIST: {
  key: keyof TeacherProfileCompletion
  label: string
}[] = [
  { key: 'photo', label: 'Profile photo' },
  { key: 'cover', label: 'Teacher card photo' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'City & state' },
  { key: 'bio', label: 'Bio (20+ characters)' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'gender', label: 'Title for student messages' },
  { key: 'specializations', label: 'Specializations' },
  { key: 'pricing', label: 'Class pricing (all 4 fees)' },
]

export function getTeacherProfileCompletion(input: {
  name?: string
  phone?: string
  city?: string
  state?: string
  bio?: string
  certifications?: string
  gender?: 'male' | 'female' | null | ''
  specializations?: string[]
  photo?: string | null
  coverPhoto?: string | null
  pricing?: {
    oneOnOneWeek?: number
    oneOnOneMonth?: number
    groupWeek?: number
    groupMonth?: number
  }
}): TeacherProfileCompletion {
  return {
    photo: Boolean(input.photo?.trim()),
    cover: Boolean(input.coverPhoto?.trim()),
    name: Boolean(input.name?.trim()),
    phone: Boolean(input.phone?.trim()),
    location: Boolean(input.city?.trim() && input.state?.trim()),
    bio: (input.bio?.trim().length ?? 0) >= 20,
    certifications: Boolean(input.certifications?.trim()),
    gender: input.gender === 'male' || input.gender === 'female',
    specializations: (input.specializations?.length ?? 0) > 0,
    pricing:
      (input.pricing?.oneOnOneWeek ?? 0) > 0 &&
      (input.pricing?.oneOnOneMonth ?? 0) > 0 &&
      (input.pricing?.groupWeek ?? 0) > 0 &&
      (input.pricing?.groupMonth ?? 0) > 0,
  }
}

export function profileCompletionPercent(completion: TeacherProfileCompletion): number {
  const values = Object.values(completion)
  return Math.round((values.filter(Boolean).length / values.length) * 100)
}

export function isTeacherProfileComplete(teacher: Teacher): boolean {
  const completion = getTeacherProfileCompletion({
    name: teacher.name,
    phone: teacher.phone,
    city: teacher.city,
    state: teacher.state,
    bio: teacher.bio,
    certifications: teacher.certifications,
    gender: teacher.gender,
    specializations: teacher.specializations,
    photo: teacher.photo,
    coverPhoto: teacher.coverPhoto,
    pricing: teacher.pricing,
  })
  return profileCompletionPercent(completion) === 100
}

export function missingProfileFields(completion: TeacherProfileCompletion): string[] {
  return TEACHER_PROFILE_CHECKLIST.filter((item) => !completion[item.key]).map(
    (item) => item.label,
  )
}
