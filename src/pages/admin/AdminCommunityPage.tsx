import { useState } from 'react'
import { Pin, PinOff, Plus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
import { fetchPosts, deletePost, createPost, updatePostPin } from '../../services/posts'
import { CreatePostModal } from '../../components/community/CreatePostModal'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Avatar } from '../../components/ui/Avatar'
import { PostFeedSkeleton } from '../../components/ui/Skeleton'

// VERIFIED: admin community — create posts, pin to top, remove
export function AdminCommunityPage() {
  const { user } = useApp()
  const { data: posts, loading, refetch } = useAsyncData(() => fetchPosts())

  useLiveDataRefresh(() => void refetch(true), ['posts'])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinningId, setPinningId] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const handleCreatePost = async (data: { text: string; file?: File; pinned?: boolean }) => {
    if (!user) return
    setCreateError(null)
    try {
      await createPost({
        authorId: user.id,
        content: data.text,
        mediaFile: data.file,
        pinned: data.pinned,
      })
      setShowCreateModal(false)
      await refetch()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create post.')
    }
  }

  const handleTogglePin = async (postId: string, pinned: boolean) => {
    setPinError(null)
    setPinningId(postId)
    try {
      await updatePostPin(postId, pinned)
      await refetch()
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Could not update post visibility.')
    } finally {
      setPinningId(null)
    }
  }

  const handleRemove = async () => {
    if (!confirmRemove) return
    setRemoveError(null)
    try {
      await deletePost(confirmRemove)
      setConfirmRemove(null)
      await refetch()
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Could not remove post.')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-medium">Community Posts</h1>
          <p className="text-sm text-charcoal/55 mt-1">
            Create announcements and pin important posts to the top of the feed.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="shrink-0">
          <Plus size={18} className="mr-2" />
          Create Post
        </Button>
      </div>

      {createError && (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3 rounded-sm mb-6">
          {createError}
        </p>
      )}
      {pinError && (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3 rounded-sm mb-6">
          {pinError}
        </p>
      )}

      {loading ? (
        <PostFeedSkeleton count={4} />
      ) : (posts ?? []).length === 0 ? (
        <div className="border border-border rounded-sm p-10 text-center">
          <p className="text-charcoal/60 text-sm">No community posts yet.</p>
          <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
            Create first post
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(posts ?? []).map((post) => (
            <article
              key={post.id}
              className={`border rounded-sm bg-cream overflow-hidden flex flex-col ${
                post.pinned ? 'border-teal/50 ring-1 ring-teal/20' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Avatar src={post.studentAvatar} name={post.studentName} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{post.studentName}</p>
                    {post.pinned && (
                      <Badge variant="verified" className="shrink-0 text-[10px] px-1.5 py-0">
                        Pinned
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-charcoal/50">
                    {post.level} · {post.date}
                  </p>
                </div>
              </div>

              {post.text && (
                <p className="text-sm text-charcoal/80 px-4 py-3 leading-relaxed">{post.text}</p>
              )}

              {post.image && (
                <div className="w-full aspect-[4/5] max-h-[420px] overflow-hidden bg-charcoal/[0.03]">
                  <img src={post.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {post.video && (
                <video
                  src={post.video}
                  controls
                  className="w-full max-h-[420px] object-contain bg-charcoal/[0.03]"
                />
              )}

              <div className="px-4 py-3 border-t border-border mt-auto flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pinningId === post.id}
                  onClick={() => void handleTogglePin(post.id, !post.pinned)}
                >
                  {post.pinned ? (
                    <>
                      <PinOff size={14} className="mr-1.5" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin size={14} className="mr-1.5" />
                      Pin to top
                    </>
                  )}
                </Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmRemove(post.id)}>
                  Remove
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setCreateError(null)
        }}
        onPost={handleCreatePost}
        showPinOption
      />

      <Modal isOpen={!!confirmRemove} onClose={() => setConfirmRemove(null)} className="max-w-sm">
        <h2 className="font-heading text-lg font-medium mb-3">Remove Post</h2>
        <p className="text-sm text-charcoal/70 mb-6">
          Are you sure you want to remove this post?
        </p>
        {removeError && <p className="text-sm text-red-600 mb-4">{removeError}</p>}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmRemove(null)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => void handleRemove()}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  )
}
