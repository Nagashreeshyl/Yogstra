import { supabase } from '../lib/supabase'

export async function fetchTeacherCompetitionOverview(teacherId: string) {
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('student_id, student:profiles!student_id(full_name)')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')

  if (bookingsError) throw bookingsError

  const studentRows = bookings ?? []
  const studentIds = studentRows.map((row) => row.student_id as string).filter(Boolean)

  if (studentIds.length === 0) {
    return { students: [], publishedResults: [] }
  }

  const participantsQuery = await supabase
    .from('competition_participants')
    .select('id, student_id, competition_id, documents_verified')
    .in('student_id', studentIds)

  if (participantsQuery.error) throw participantsQuery.error

  const participantIds = (participantsQuery.data ?? []).map((p) => p.id as string)

  const [regsResult, resultsResult] = await Promise.all([
    supabase
      .from('competition_registrations')
      .select('id, competition_id, registrant_id, status, payment_status, competition:competitions!competition_id(name)')
      .in('registrant_id', studentIds),
    participantIds.length > 0
      ? supabase
          .from('competition_results')
          .select(
            `
            id,
            rank,
            status,
            participant:competition_participants!participant_id(
              student_id,
              display_name,
              competition:competitions!competition_id(name)
            )
          `,
          )
          .eq('status', 'published')
          .in('participant_id', participantIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (regsResult.error) throw regsResult.error
  if (resultsResult.error) throw resultsResult.error

  const participantDocs = new Map<string, boolean>()
  for (const p of participantsQuery.data ?? []) {
    participantDocs.set(`${p.student_id}:${p.competition_id}`, Boolean(p.documents_verified))
  }

  const students = studentRows.map((row) => {
    const student = Array.isArray(row.student) ? row.student[0] : row.student
    const studentId = row.student_id as string
    const studentName = (student as { full_name?: string })?.full_name ?? 'Student'

    const competitions = (regsResult.data ?? [])
      .filter((reg) => reg.registrant_id === studentId)
      .map((reg) => {
        const competition = Array.isArray(reg.competition) ? reg.competition[0] : reg.competition
        const competitionId = reg.competition_id as string
        const docsKey = `${studentId}:${competitionId}`
        const published = (resultsResult.data ?? []).find((result) => {
          const participant = Array.isArray(result.participant) ? result.participant[0] : result.participant
          return (participant as { student_id?: string })?.student_id === studentId
        })
        return {
          registrationId: reg.id as string,
          competitionId,
          competitionName: (competition as { name?: string })?.name ?? 'Competition',
          status: reg.status as string,
          paymentStatus: reg.payment_status as string,
          documentsVerified: participantDocs.get(docsKey) ?? false,
          rank: published?.rank as number | undefined,
          resultStatus: published ? 'published' : undefined,
        }
      })

    return { studentId, studentName, competitions }
  })

  const publishedResults = (resultsResult.data ?? []).map((result) => {
    const participant = Array.isArray(result.participant) ? result.participant[0] : result.participant
    const competition = (participant as { competition?: { name?: string } | { name?: string }[] })?.competition
    const competitionName = Array.isArray(competition)
      ? competition[0]?.name
      : (competition as { name?: string })?.name
    return {
      id: result.id as string,
      studentName: (participant as { display_name?: string })?.display_name ?? 'Student',
      competitionName: competitionName ?? 'Competition',
      rank: result.rank as number | null,
    }
  })

  return { students, publishedResults }
}
