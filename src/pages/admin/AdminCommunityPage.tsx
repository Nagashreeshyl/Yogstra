import { useAsyncData } from '../../hooks/useAsyncData'
import { useAppIntervalRefresh } from '../../hooks/useIntervalRefresh'
import { fetchPosts, deletePost } from '../../services/posts'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Avatar } from '../../components/ui/Avatar'
import { PostFeedSkeleton } from '../../components/ui/Skeleton'
import { useState } from 'react'

export function AdminCommunityPage() {
  const { data: posts, loading, refetch } = useAsyncData(() => fetchPosts())

  useAppIntervalRefresh(() => {
    void refetch(true)
  })

  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const handleRemove = async () => {
    if (confirmRemove) {
      await deletePost(confirmRemove)
      setConfirmRemove(null)
      await refetch()
    }
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Community Posts</h1>

      {loading ? (
        <PostFeedSkeleton count={4} />
      ) : (posts ?? []).length === 0 ? (
        <p className="text-charcoal/50">No community posts yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(posts ?? []).map((post) => (
            <article
              key={post.id}
              className="border border-border rounded-sm bg-cream overflow-hidden flex flex-col"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Avatar src={post.studentAvatar} name={post.studentName} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{post.studentName}</p>
                  <p className="text-xs text-charcoal/50">{post.date}</p>
                </div>
              </div>

              {post.text && (
                <p className="text-sm text-charcoal/80 px-4 py-3 leading-relaxed">{post.text}</p>
              )}

              {post.image && (
                <div className="w-full aspect-[4/5] max-h-[420px] overflow-hidden bg-charcoal/[0.03]">
                  <img
                    src={post.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {post.video && (
                <video
                  src={post.video}
                  controls
                  className="w-full max-h-[420px] object-contain bg-charcoal/[0.03]"
                />
              )}

              <div className="px-4 py-3 border-t border-border mt-auto">
                <Button variant="danger" size="sm" onClick={() => setConfirmRemove(post.id)}>
                  Remove
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={!!confirmRemove} onClose={() => setConfirmRemove(null)} className="max-w-sm">
        <h2 className="font-heading text-lg font-medium mb-3">Remove Post</h2>
        <p className="text-sm text-charcoal/70 mb-6">
          Are you sure you want to remove this post?
        </p>
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
