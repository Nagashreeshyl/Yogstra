import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
import { fetchPosts, createPost, createComment } from '../../services/posts'
import { CommunityFeed } from './CommunityFeed'
import { CommunitySidebar } from './CommunitySidebar'
import { CreatePostModal } from './CreatePostModal'
import { FeedPageLayout } from '../layout/FeedPageLayout'
import { EmptyState } from '../shell/EmptyState'
import { PostFeedSkeleton } from '../ui/Skeleton'

export function CommunityFeedView() {
  const { user, isLoggedIn } = useApp()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { data: posts, loading, refetch } = useAsyncData(() => fetchPosts())

  useLiveDataRefresh(refetch, ['posts'])

  const isStudent = isLoggedIn && user?.role === 'student'
  const isTeacher = isLoggedIn && user?.role === 'teacher'

  const handleCreatePost = async (data: { text: string; file?: File }) => {
    if (!user) return

    await createPost({
      authorId: user.id,
      content: data.text,
      mediaFile: data.file,
    })

    setShowCreateModal(false)
    await refetch()
  }

  return (
    <FeedPageLayout sidebar={<CommunitySidebar />}>
      {isStudent && (
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-semibold">Feed</p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            Create
          </button>
        </div>
      )}

      {loading ? (
        <PostFeedSkeleton count={3} />
      ) : (posts ?? []).length === 0 ? (
        <EmptyState
          title="No posts yet"
          description={
            isStudent ? 'Share your yoga journey with the community.' : 'Posts from students will appear here.'
          }
          action={
            isStudent ? (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="text-sm font-semibold text-primary hover:text-primary-dark cursor-pointer"
              >
                Create your first post
              </button>
            ) : undefined
          }
        />
      ) : (
        <CommunityFeed
          posts={posts ?? []}
          showTitle={false}
          variant="instagram"
          canComment={isTeacher}
          onComment={async (postId, text) => {
            await createComment(postId, text)
            await refetch()
          }}
        />
      )}

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPost={handleCreatePost}
      />
    </FeedPageLayout>
  )
}
