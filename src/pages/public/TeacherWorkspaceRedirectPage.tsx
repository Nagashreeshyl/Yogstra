import { Navigate, useLocation } from 'react-router-dom'
import { TERMS } from '../../constants/terminology'

type Intent = 'academy' | 'competition'

const intentCopy: Record<Intent, { title: string; description: string }> = {
  academy: {
    title: TERMS.createAcademy,
    description: 'Sign up as a teacher first, then enable your Academy workspace from the dashboard.',
  },
  competition: {
    title: TERMS.createCompetitions,
    description: 'Sign up as a teacher first, then create competitions from your Competition workspace.',
  },
}

/** Legacy signup URLs redirect to unified teacher registration. */
export function TeacherWorkspaceRedirectPage({ intent }: { intent: Intent }) {
  const location = useLocation()
  const copy = intentCopy[intent]

  return (
    <Navigate
      to="/auth/teacher/register"
      replace
      state={{
        workspaceIntent: intent,
        message: copy.description,
        from: location.pathname,
      }}
    />
  )
}
