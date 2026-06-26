import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchPosts, deletePost } from '../../services/posts'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Card } from '../../components/ui/Card'
import { useState } from 'react'

export function AdminCommunityPage() {
  const { data: posts, loading, refetch } = useAsyncData(() => fetchPosts())
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
        <p className="text-charcoal/50">Loading posts...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(posts ?? []).map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <img src={post.studentAvatar} alt="" className="w-8 h-8 rounded-full" />
                <div>
                  <p className="text-sm font-medium">{post.studentName}</p>
                  <p className="text-xs text-charcoal/50">{post.date}</p>
                </div>
              </div>
              <p className="text-sm text-charcoal/70 line-clamp-3 mb-3">{post.text}</p>
              {post.image && (
                <img src={post.image} alt="" className="w-full h-32 object-cover rounded-sm mb-3" />
              )}
              <Button variant="danger" size="sm" onClick={() => setConfirmRemove(post.id)}>
                Remove
              </Button>
            </Card>
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
          <Button variant="danger" className="flex-1" onClick={handleRemove}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  )
}
