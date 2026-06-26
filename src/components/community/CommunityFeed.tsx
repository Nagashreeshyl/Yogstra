import { Heart, MessageCircle, Share2, BadgeCheck } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import type { CommunityPost } from '../../types'

interface CommunityFeedProps {
  posts: CommunityPost[]
}

export function CommunityFeed({ posts }: CommunityFeedProps) {
  const { requireAuth } = useApp()

  const handleInteraction = () => {
    requireAuth()
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-medium">Community Feed</h2>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onInteract={handleInteraction} />
      ))}
    </div>
  )
}

function PostCard({ post, onInteract }: { post: CommunityPost; onInteract: () => void }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <img src={post.studentAvatar} alt={post.studentName} className="w-10 h-10 rounded-full object-cover" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{post.studentName}</span>
            <Badge>{post.level}</Badge>
          </div>
          <span className="text-xs text-charcoal/50">{post.date}</span>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-charcoal/80 mb-3">{post.text}</p>

      {post.video && (
        <video
          src={post.video}
          controls
          className="w-full rounded-sm mb-3 max-h-80 object-contain bg-cream-dark"
        />
      )}
      {post.image && !post.video && (
        <img src={post.image} alt="" className="w-full rounded-sm mb-3 max-h-64 object-cover" />
      )}

      {post.teacherComment && (
        <div className="bg-cream-dark border border-border rounded-sm p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <BadgeCheck size={14} className="text-teal" />
            <span className="text-xs font-medium">{post.teacherComment.teacherName}</span>
            <Badge variant="verified">Verified Teacher</Badge>
          </div>
          <p className="text-sm text-charcoal/70">{post.teacherComment.text}</p>
        </div>
      )}

      <div className="flex items-center gap-6 pt-2 border-t border-border">
        <button onClick={onInteract} className="flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-charcoal cursor-pointer">
          <Heart size={16} /> {post.likes}
        </button>
        <button onClick={onInteract} className="flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-charcoal cursor-pointer">
          <MessageCircle size={16} /> {post.comments}
        </button>
        <button onClick={onInteract} className="flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-charcoal cursor-pointer">
          <Share2 size={16} /> Share
        </button>
      </div>
    </Card>
  )
}

