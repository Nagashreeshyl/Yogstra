import { useApp } from '../context/AppContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { fetchPosts } from '../services/posts'
import { fetchTeachers } from '../services/teachers'
import { filterTeachers } from '../utils/filterTeachers'
import { SearchBar } from '../components/filters/SearchBar'
import { CategoryFlashCards } from '../components/categories/CategoryFlashCards'
import { CommunityFeed } from '../components/community/CommunityFeed'
import { FeaturedTeachers } from '../components/teachers/TeacherCard'
import { CompetitionsTeaser } from '../components/competitions/CompetitionsTeaser'
import { competitions } from '../lib/constants'

export function ExplorePage() {
  const { searchQuery, filters, selectedCategory } = useApp()
  const { data: teachers, loading: teachersLoading, error: teachersError } = useAsyncData(() => fetchTeachers(true))
  const { data: posts, loading: postsLoading, error: postsError } = useAsyncData(() => fetchPosts())

  const allTeachers = teachers ?? []
  const featured = filterTeachers(allTeachers, searchQuery, filters, selectedCategory).slice(0, 3)
  const fallbackFeatured = allTeachers.filter((t) => t.verified).slice(0, 3)

  return (
    <div className="p-8">
      <div className="flex gap-8">
        <div className="flex-[3] min-w-0 space-y-8">
          <SearchBar />
          <CategoryFlashCards />
          {postsLoading ? (
            <p className="text-charcoal/50 text-sm">Loading feed...</p>
          ) : postsError ? (
            <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3 rounded-sm">
              Could not load posts: {postsError}
            </p>
          ) : (posts ?? []).length === 0 ? (
            <div className="border border-border rounded-sm p-8 text-center">
              <p className="text-charcoal/60 text-sm">No community posts yet.</p>
              <p className="text-charcoal/40 text-xs mt-1">Posts from Supabase will appear here.</p>
            </div>
          ) : (
            <CommunityFeed posts={posts ?? []} />
          )}
        </div>

        <aside className="flex-[1] min-w-[260px] max-w-[300px] shrink-0 hidden lg:block">
          {teachersLoading ? (
            <p className="text-charcoal/50 text-sm">Loading teachers...</p>
          ) : teachersError ? (
            <p className="text-sm text-red-600">Could not load teachers: {teachersError}</p>
          ) : (featured.length > 0 ? featured : fallbackFeatured).length === 0 ? (
            <div className="border border-border rounded-sm p-6 text-center">
              <p className="text-charcoal/60 text-sm">No verified teachers yet.</p>
              <p className="text-charcoal/40 text-xs mt-1">Teachers appear after registration and admin approval.</p>
            </div>
          ) : (
            <>
              <FeaturedTeachers teachers={featured.length > 0 ? featured : fallbackFeatured} />
              <CompetitionsTeaser competitions={competitions} />
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
