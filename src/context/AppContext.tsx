import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import type { Category, FilterState, TeacherRegistrationData, UserRole } from '../types'
import {
  ensureProfile,
  fetchProfile,
  getSession,
  signIn,
  signOut,
  signUpStudent,
  type AuthUser,
  type SignUpResult,
} from '../services/auth'
import {
  fetchCategories,
  createCategory,
  updateCategory as updateCategoryDb,
  deleteCategory as deleteCategoryDb,
} from '../services/categories'
import { subscribeToOwnProfile } from '../services/liveSync'

interface AppContextValue {
  role: UserRole
  user: AuthUser | null
  isLoggedIn: boolean
  authLoading: boolean
  categories: Category[]
  categoriesLoading: boolean
  filters: FilterState
  selectedCategory: string | null
  showRoleModal: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  setShowRoleModal: (show: boolean) => void
  setSelectedCategory: (cat: string | null) => void
  setFilters: (filters: FilterState) => void
  resetFilters: () => void
  signIn: (email: string, password: string) => Promise<AuthUser>
  signUpStudent: (params: {
    fullName: string
    email: string
    phone: string
    password: string
  }) => Promise<SignUpResult>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  requireAuth: () => boolean
  refreshCategories: () => Promise<void>
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  teacherRegistration: TeacherRegistrationData | null
  setTeacherRegistration: (data: TeacherRegistrationData | null) => void
}

const defaultFilters: FilterState = {
  categories: [],
  teachingMode: '',
  priceMin: 0,
  priceMax: 10000,
  experience: 'Any',
  location: '',
  rating: 0,
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [teacherRegistration, setTeacherRegistration] = useState<TeacherRegistrationData | null>(null)

  const isLoggedIn = user !== null

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const data = await fetchCategories()
      setCategories(data)
    } catch {
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    getSession().then((profile) => {
      if (profile) {
        setUser(profile)
        setRole(profile.role)
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await ensureProfile(session.user)
        if (profile) {
          setUser(profile)
          setRole(profile.role)
        }
      } else {
        setUser(null)
        setRole(null)
      }
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const teacherUserId = user?.role === 'teacher' ? user.id : null

  useEffect(() => {
    if (!teacherUserId) return

    const channelName = `teacher_status:${teacherUserId}`
    const existing = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`)
    if (existing) void supabase.removeChannel(existing)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teacher_profiles',
          filter: `id=eq.${teacherUserId}`,
        },
        async () => {
          const profile = await fetchProfile(teacherUserId)
          if (!profile) return

          setUser(profile)
          setRole(profile.role)

          if (profile.teacherStatus === 'verified') {
            window.location.href = '/dashboard/teacher'
            return
          }
          if (profile.teacherStatus === 'removed' && window.location.pathname.startsWith('/dashboard/teacher')) {
            window.location.href = '/auth/teacher/pending'
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [teacherUserId])

  const requireAuth = useCallback(() => {
    if (!isLoggedIn) {
      setShowRoleModal(true)
      return false
    }
    return true
  }, [isLoggedIn])

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const profile = await signIn(email, password)
    setUser(profile)
    setRole(profile.role)
    return profile
  }, [])

  const handleSignUpStudent = useCallback(async (params: {
    fullName: string
    email: string
    phone: string
    password: string
  }) => {
    const result = await signUpStudent(params)
    if (result.status === 'email_confirmation_required') {
      return result
    }
    setUser(result.profile)
    setRole(result.profile.role)
    return result
  }, [])

  const logout = useCallback(async () => {
    await signOut()
    setUser(null)
    setRole(null)
    window.location.href = '/'
  }, [])

  const refreshUser = useCallback(async () => {
    const profile = await getSession()
    if (profile) {
      setUser(profile)
      setRole(profile.role)
    }
  }, [])

  const userId = user?.id ?? null

  useEffect(() => {
    if (!userId) return

    return subscribeToOwnProfile(userId, () => {
      void refreshUser()
    })
  }, [userId, refreshUser])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
    setSelectedCategory(null)
  }, [])

  const addCategory = useCallback(async (cat: Omit<Category, 'id'>) => {
    await createCategory(cat)
    await loadCategories()
  }, [loadCategories])

  const updateCategory = useCallback(async (id: string, cat: Partial<Category>) => {
    await updateCategoryDb(id, cat)
    await loadCategories()
  }, [loadCategories])

  const deleteCategory = useCallback(async (id: string) => {
    await deleteCategoryDb(id)
    await loadCategories()
  }, [loadCategories])

  return (
    <AppContext.Provider
      value={{
        role,
        user,
        isLoggedIn,
        authLoading,
        categories,
        categoriesLoading,
        filters,
        selectedCategory,
        showRoleModal,
        searchQuery,
        setSearchQuery,
        setShowRoleModal,
        setSelectedCategory,
        setFilters,
        resetFilters,
        signIn: handleSignIn,
        signUpStudent: handleSignUpStudent,
        logout,
        refreshUser,
        requireAuth,
        refreshCategories: loadCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        teacherRegistration,
        setTeacherRegistration,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export { defaultFilters }
export type { AuthUser }
