import { useApp } from '../context/AppContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { useLiveSync } from '../hooks/useLiveSync'
import { fetchPosts } from '../services/posts'
import { fetchTeachers } from '../services/teachers'
import { filterTeachers } from '../utils/filterTeachers'
import { SearchBar } from '../components/filters/SearchBar'
import { CategoryFlashCards } from '../components/categories/CategoryFlashCards'
import { CommunityFeed } from '../components/community/CommunityFeed'
import { FeaturedTeachers, MobileFeaturedTeachers } from '../components/teachers/TeacherCard'
import { CompetitionsTeaser } from '../components/competitions/CompetitionsTeaser'
import { FeedPageLayout } from '../components/layout/FeedPageLayout'
import { PostFeedSkeleton, TeacherGridSkeleton } from '../components/ui/Skeleton'
import { competitions } from '../lib/constants'

export function ExplorePage() {
  const { searchQuery, filters, selectedCategory } = useApp()
  const { data: teachers, loading: teachersLoading, error: teachersError, refetch: refetchTeachers } = useAsyncData(() => fetchTeachers(true))
  const { data: posts, loading: postsLoading, error: postsError, refetch: refetchPosts } = useAsyncData(() => fetchPosts())

  useLiveSync(refetchTeachers, ['teachers'])
  useLiveSync(refetchPosts, ['posts'])

  const allTeachers = teachers ?? []
  const featured = filterTeachers(allTeachers, searchQuery, filters, selectedCategory).slice(0, 3)
  const fallbackFeatured = allTeachers.filter((t) => t.verified).slice(0, 3)
  const featuredList = featured.length > 0 ? featured : fallbackFeatured

  const sidebar = teachersLoading ? (
    <div className="space-y-4">
      <div className="h-4 w-32 animate-pulse rounded-sm bg-surface-inset/80" />
      <TeacherGridSkeleton count={3} />
    </div>
  ) : teachersError ? (
    <p className="text-sm text-red-600">Could not load teachers: {teachersError}</p>
  ) : featuredList.length === 0 ? (
    <div className="border border-border rounded-sm p-6 text-center">
      <p className="text-charcoal/60 text-sm">No verified teachers yet.</p>
      <p className="text-charcoal/40 text-xs mt-1">Teachers appear after registration and admin approval.</p>
    </div>
  ) : (
    <>
      <FeaturedTeachers teachers={featuredList} />
      <CompetitionsTeaser competitions={competitions} />
    </>
  )

  return (
    <FeedPageLayout sidebar={sidebar}>
      <div className="space-y-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {!teachersLoading && featuredList.length > 0 && (
          <MobileFeaturedTeachers teachers={featuredList} />
        )}

        <SearchBar placeholder="Search teachers, styles..." />
        <CategoryFlashCards />

        <section>
          {postsLoading ? (
            <PostFeedSkeleton count={2} />
          ) : postsError ? (
            <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3 rounded-sm">
              Could not load posts: {postsError}
            </p>
          ) : (posts ?? []).length === 0 ? (
            <div className="border border-border rounded-sm p-8 text-center">
              <p className="text-charcoal/60 text-sm">No community posts yet.</p>
              <p className="text-charcoal/40 text-xs mt-1">Posts from the community will appear here.</p>
            </div>
          ) : (
            <CommunityFeed posts={posts ?? []} variant="instagram" showTitle={false} />
          )}
        </section>
      </div>
    </FeedPageLayout>
  )
}
