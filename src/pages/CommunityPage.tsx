import { useApp } from '../context/AppContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { fetchPosts, createPost } from '../services/posts'
import { CommunityFeed } from '../components/community/CommunityFeed'
import { CreatePostModal } from '../components/community/CreatePostModal'
import { Button } from '../components/ui/Button'
import { Plus } from 'lucide-react'
import { useState } from 'react'

export function CommunityPage() {
  const { user, isLoggedIn } = useApp()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { data: posts, loading, refetch } = useAsyncData(() => fetchPosts())

  const isStudent = isLoggedIn && user?.role === 'student'

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
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-medium">Community Feed</h1>
        {isStudent && (
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus size={18} />
            Create Post
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-charcoal/50">Loading posts...</p>
      ) : (
        <CommunityFeed posts={posts ?? []} />
      )}

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPost={handleCreatePost}
      />
    </div>
  )
}
