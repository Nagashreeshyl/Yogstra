import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useApp } from '../context/AppContext'
import { useAsyncData } from './useAsyncData'
import type { Academy, AcademyMemberRole } from '../domain/academy/models'
import { fetchAcademiesForUser } from '../services/academyService'
import { getUserAcademyRole } from '../services/academyMemberService'

const STORAGE_KEY = 'yogstra_academy_id'

type AcademyContextValue = {
  academyId: string | null
  academy: Academy | null
  academies: Academy[]
  role: AcademyMemberRole | null
  loading: boolean
  error: string | null
  setAcademyId: (id: string) => void
  refetch: () => Promise<void>
}

const AcademyContext = createContext<AcademyContextValue | null>(null)

export function AcademyContextProvider({ children }: { children: ReactNode }) {
  const { user } = useApp()
  const userId = user?.id ?? ''

  const {
    data: academies,
    loading: academiesLoading,
    error: academiesError,
    refetch: refetchAcademies,
  } = useAsyncData(
    () => (userId ? fetchAcademiesForUser(userId) : Promise.resolve([])),
    [userId],
    { enabled: Boolean(userId) },
  )

  const [academyId, setAcademyIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  )

  useEffect(() => {
    if (!academies?.length) return

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && academies.some((a) => a.id === stored)) {
      setAcademyIdState(stored)
      return
    }

    const firstId = academies[0].id
    setAcademyIdState(firstId)
    localStorage.setItem(STORAGE_KEY, firstId)
  }, [academies])

  const academy = useMemo(
    () => academies?.find((a) => a.id === academyId) ?? null,
    [academies, academyId],
  )

  const {
    data: role,
    loading: roleLoading,
    refetch: refetchRole,
  } = useAsyncData(
    () =>
      academyId && userId
        ? getUserAcademyRole(academyId, userId)
        : Promise.resolve(null),
    [academyId, userId],
    { enabled: Boolean(academyId && userId) },
  )

  const setAcademyId = useCallback((id: string) => {
    setAcademyIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  const refetch = useCallback(async () => {
    await refetchAcademies()
    await refetchRole(true)
  }, [refetchAcademies, refetchRole])

  const value: AcademyContextValue = {
    academyId,
    academy,
    academies: academies ?? [],
    role: role ?? null,
    loading: academiesLoading || roleLoading,
    error: academiesError,
    setAcademyId,
    refetch,
  }

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>
}

export function useAcademyContext(): AcademyContextValue {
  const ctx = useContext(AcademyContext)
  if (!ctx) {
    throw new Error('useAcademyContext must be used within AcademyContextProvider')
  }
  return ctx
}
