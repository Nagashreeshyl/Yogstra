export type ProfileGender = 'male' | 'female' | null | undefined

export function teacherHonorific(gender?: ProfileGender | string | null): string {
  if (gender === 'female') return 'Ma\'am'
  if (gender === 'male') return 'Sir'
  return 'Sir/Ma\'am'
}

export function buildTeacherRequestMessage(
  studentName: string,
  teacherGender?: ProfileGender | string | null,
): string {
  const honorific = teacherHonorific(teacherGender)
  const studentFirst = studentName.trim().split(/\s+/)[0] || 'A student'
  return (
    `Hello ${honorific}, I'm ${studentFirst}. I'm interested in learning yoga with you ` +
    `and would love to discuss your classes. Looking forward to connecting with you!`
  )
}
