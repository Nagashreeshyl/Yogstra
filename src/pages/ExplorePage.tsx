import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { useLiveSync } from '../hooks/useLiveSync'
import { fetchPosts } from '../services/posts'
import { fetchTeachers } from '../services/teachers'
import { fetchActiveAcademies } from '../services/academyService'
import { filterTeachers } from '../utils/filterTeachers'
import { PageContainer } from '../components/shell/PageContainer'
import { ErrorState } from '../components/shell/ErrorState'
import { EmptyState } from '../components/shell/EmptyState'
import { SearchBar } from '../components/filters/SearchBar'
import { CategoryFlashCards } from '../components/categories/CategoryFlashCards'
import { CommunityFeed } from '../components/community/CommunityFeed'
import { TeacherCard, MobileFeaturedTeachers } from '../components/teachers/TeacherCard'
import { CompetitionsTeaser } from '../components/competitions/CompetitionsTeaser'
import { PostFeedSkeleton, TeacherGridSkeleton } from '../components/ui/Skeleton'
import { fetchPublicCompetitionTeaser } from '../services/publicCompetitionService'
import { PublicSection } from '../components/public/PublicSection'
import { Building2 } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function ExplorePage() {
  const { searchQuery, filters, selectedCategory } = useApp()
  const { data: teachers, loading: teachersLoading, error: teachersError, refetch: refetchTeachers } = useAsyncData(() => fetchTeachers(true))
  const { data: academies, loading: academiesLoading } = useAsyncData(() => fetchActiveAcademies(6))
  const { data: posts, loading: postsLoading, error: postsError, refetch: refetchPosts } = useAsyncData(() => fetchPosts())
  const { data: competitionTeaser, loading: competitionsLoading, error: competitionsError } = useAsyncData(() => fetchPublicCompetitionTeaser(3))

  useLiveSync(refetchTeachers, ['teachers'])
  useLiveSync(refetchPosts, ['posts'])

  const allTeachers = teachers ?? []
  const filtered = filterTeachers(allTeachers, searchQuery, filters, selectedCategory)
  const featured = filtered.filter((t) => t.verified).slice(0, 6)
  const fallbackFeatured = allTeachers.filter((t) => t.verified).slice(0, 6)
  const featuredList = featured.length > 0 ? featured : fallbackFeatured
  const trendingCoaches = allTeachers.filter((t) => t.verified).sort((a, b) => b.rating - a.rating).slice(0, 4)

  return (
    <PageContainer className="py-10 sm:py-14 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-14">
      <div className="mb-10">
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground">Discover</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Find coaches, academies, programs, and competitions — your entry point to everything on Yogstra.
        </p>
      </div>

      <div className="mb-6">
        <SearchBar placeholder="Search coaches, academies, styles…" />
      </div>
      <CategoryFlashCards />

      {/* Featured Coaches */}
      <PublicSection title="Featured Coaches" className="mt-10 !px-0">
        {teachersLoading ? (
          <TeacherGridSkeleton count={3} />
        ) : teachersError ? (
          <ErrorState message="Unable to load coaches. Please refresh." />
        ) : featuredList.length === 0 ? (
          <EmptyState title="Coaches coming soon" description="Verified coaches appear after registration and approval." action={<Link to="/auth/get-started"><Button>Get Started</Button></Link>} />
        ) : (
          <>
            <MobileFeaturedTeachers teachers={featuredList.slice(0, 6)} />
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredList.map((t) => <TeacherCard key={t.id} teacher={t} />)}
            </div>
            <div className="mt-6 text-center">
              <Link to="/teachers"><Button variant="secondary">View All Coaches</Button></Link>
            </div>
          </>
        )}
      </PublicSection>

      {/* Nearby Academies */}
      <PublicSection title="Academies" className="mt-4 !px-0">
        {academiesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-[20px] bg-muted/80" />)}
          </div>
        ) : (academies ?? []).length === 0 ? (
          <EmptyState title="Academies coming soon" description="Academies register through Yogstra to manage their operations." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(academies ?? []).slice(0, 6).map((a) => (
              <Link key={a.id} to={`/academies/${a.slug}`} className="rounded-[20px] border border-border bg-elevated p-5 hover:border-accent/30 transition-colors">
                <Building2 size={20} className="text-accent mb-3" />
                <p className="font-medium text-foreground">{a.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{[a.city, a.state].filter(Boolean).join(', ') || 'Location TBD'}</p>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-6 text-center">
          <Link to="/academies"><Button variant="secondary">Browse All Academies</Button></Link>
        </div>
      </PublicSection>

      {/* Upcoming Competitions */}
      <PublicSection title="Upcoming Competitions" className="mt-4 !px-0">
        <CompetitionsTeaser competitions={competitionTeaser ?? []} loading={competitionsLoading} error={competitionsError} />
      </PublicSection>

      {/* Trending Coaches */}
      {trendingCoaches.length > 0 && (
        <PublicSection title="Trending Coaches" className="mt-4 !px-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingCoaches.map((t) => <TeacherCard key={t.id} teacher={t} />)}
          </div>
        </PublicSection>
      )}

      {/* Community Highlights */}
      <PublicSection title="Community Highlights" className="mt-4 !px-0">
        {postsLoading ? (
          <PostFeedSkeleton count={2} />
        ) : postsError ? (
          <ErrorState message="Unable to load community posts." />
        ) : (posts ?? []).length === 0 ? (
          <EmptyState title="Community is growing" description="Posts from coaches and students will appear here." action={<Link to="/community"><Button variant="secondary">Visit Community</Button></Link>} />
        ) : (
          <>
            <CommunityFeed posts={(posts ?? []).slice(0, 4)} showTitle={false} variant="instagram" />
            <div className="mt-6 text-center">
              <Link to="/community"><Button variant="secondary">View Community</Button></Link>
            </div>
          </>
        )}
      </PublicSection>
    </PageContainer>
  )
}
