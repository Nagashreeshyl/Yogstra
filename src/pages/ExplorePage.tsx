import { useApp } from '../context/AppContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { useLiveSync } from '../hooks/useLiveSync'
import { fetchPosts } from '../services/posts'
import { fetchTeachers } from '../services/teachers'
import { filterTeachers } from '../utils/filterTeachers'
import { PageContainer } from '../components/shell/PageContainer'
import { PageHeader } from '../components/shell/PageHeader'
import { ErrorState } from '../components/shell/ErrorState'
import { EmptyState } from '../components/shell/EmptyState'
import { SearchBar } from '../components/filters/SearchBar'
import { CategoryFlashCards } from '../components/categories/CategoryFlashCards'
import { CommunityFeed } from '../components/community/CommunityFeed'
import { FeaturedTeachers, MobileFeaturedTeachers } from '../components/teachers/TeacherCard'
import { CompetitionsTeaser } from '../components/competitions/CompetitionsTeaser'
import { PostFeedSkeleton, TeacherGridSkeleton } from '../components/ui/Skeleton'
import { fetchPublicCompetitionTeaser } from '../services/publicCompetitionService'

export function ExplorePage() {
  const { searchQuery, filters, selectedCategory } = useApp()
  const { data: teachers, loading: teachersLoading, error: teachersError, refetch: refetchTeachers } = useAsyncData(() => fetchTeachers(true))
  const { data: posts, loading: postsLoading, error: postsError, refetch: refetchPosts } = useAsyncData(() => fetchPosts())
  const {
    data: competitionTeaser,
    loading: competitionsLoading,
    error: competitionsError,
  } = useAsyncData(() => fetchPublicCompetitionTeaser(3))

  useLiveSync(refetchTeachers, ['teachers'])
  useLiveSync(refetchPosts, ['posts'])

  const allTeachers = teachers ?? []
  const featured = filterTeachers(allTeachers, searchQuery, filters, selectedCategory).slice(0, 3)
  const fallbackFeatured = allTeachers.filter((t) => t.verified).slice(0, 3)
  const featuredList = featured.length > 0 ? featured : fallbackFeatured

  const sidebar = teachersLoading ? (
    <div className="space-y-4">
      <div className="h-4 w-32 animate-pulse rounded-[12px] bg-muted/80" />
      <TeacherGridSkeleton count={3} />
    </div>
  ) : teachersError ? (
    <ErrorState message="Unable to load teachers right now. Please refresh the page." />
  ) : featuredList.length === 0 ? (
    <EmptyState
      title="No verified teachers yet"
      description="Teachers appear after registration and admin approval."
    />
  ) : (
    <>
      <FeaturedTeachers teachers={featuredList} />
      <CompetitionsTeaser
        competitions={competitionTeaser ?? []}
        loading={competitionsLoading}
        error={competitionsError}
      />
    </>
  )

  return (
    <PageContainer className="py-10 sm:py-14 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-14">
      <PageHeader
        title="Explore"
        description="Discover teachers, academies, competitions, and community highlights."
        className="mb-8"
      />
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10">
          <div className="flex-1 min-w-0 space-y-5 lg:space-y-8">
            {!teachersLoading && featuredList.length > 0 && (
              <MobileFeaturedTeachers teachers={featuredList} />
            )}

            <SearchBar placeholder="Search teachers, styles..." />
            <CategoryFlashCards />

            <section className="w-full max-w-[470px] mx-auto lg:mx-0 lg:max-w-none">
              {postsLoading ? (
                <PostFeedSkeleton count={2} />
              ) : postsError ? (
                <ErrorState message="Unable to load community posts right now. Please refresh the page." />
              ) : (posts ?? []).length === 0 ? (
                <EmptyState
                  title="No community posts yet"
                  description="Posts from the community will appear here."
                />
              ) : (
                <div className="lg:max-w-[520px]">
                  <CommunityFeed posts={posts ?? []} variant="instagram" showTitle={false} />
                </div>
              )}
            </section>
          </div>

          <aside className="hidden lg:block w-[280px] shrink-0 space-y-8 sticky top-6">
            {sidebar}
          </aside>
        </div>
    </PageContainer>
  )
}
