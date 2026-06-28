import { useState } from 'react'
import { Heart, MessageCircle, Share2, BadgeCheck, MoreHorizontal } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { CommunityPost } from '../../types'

interface CommunityFeedProps {
  posts: CommunityPost[]
  showTitle?: boolean
  variant?: 'default' | 'instagram'
  canComment?: boolean
  onComment?: (postId: string, text: string) => Promise<void>
}

export function CommunityFeed({
  posts,
  showTitle = true,
  variant = 'default',
  canComment = false,
  onComment,
}: CommunityFeedProps) {
  const { requireAuth } = useApp()
  const isInstagram = variant === 'instagram'

  const handleInteraction = () => {
    requireAuth()
  }

  return (
    <div className={isInstagram ? 'space-y-5' : 'space-y-4'}>
      {showTitle && (
        <h2 className="text-base font-semibold">Community Feed</h2>
      )}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onInteract={handleInteraction}
          variant={variant}
          canComment={canComment && !post.teacherComment}
          onComment={onComment}
        />
      ))}
    </div>
  )
}

function PostCard({
  post,
  onInteract,
  variant,
  canComment,
  onComment,
}: {
  post: CommunityPost
  onInteract: () => void
  variant: 'default' | 'instagram'
  canComment?: boolean
  onComment?: (postId: string, text: string) => Promise<void>
}) {
  const isInstagram = variant === 'instagram'
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  const handleCommentClick = () => {
    if (canComment && onComment) {
      setShowCommentForm((v) => !v)
      return
    }
    onInteract()
  }

  const handleSubmitComment = async () => {
    if (!onComment || !commentDraft.trim() || commentSubmitting) return
    setCommentSubmitting(true)
    setCommentError(null)
    try {
      await onComment(post.id, commentDraft)
      setCommentDraft('')
      setShowCommentForm(false)
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Could not post comment.')
    } finally {
      setCommentSubmitting(false)
    }
  }

  if (isInstagram) {
    return (
      <article className="border border-border/70 rounded-sm bg-cream overflow-hidden">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Avatar src={post.studentAvatar} name={post.studentName} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight truncate">{post.studentName}</p>
            {post.level && (
              <p className="text-[11px] text-charcoal/45 leading-tight mt-0.5">{post.level}</p>
            )}
          </div>
          <button
            type="button"
            className="text-charcoal/40 hover:text-charcoal/60 p-1 cursor-pointer"
            aria-label="Post options"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {post.video && (
          <video
            src={post.video}
            controls
            className="w-full max-h-[585px] object-contain bg-charcoal/[0.03]"
          />
        )}
        {post.image && !post.video && (
          <div className="w-full aspect-[4/5] max-h-[585px] overflow-hidden bg-charcoal/[0.03]">
            <img
              src={post.image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="px-3 pt-2.5 pb-1">
          <div className="flex items-center gap-4 mb-2">
            <button
              type="button"
              onClick={onInteract}
              className="text-charcoal hover:text-charcoal/70 cursor-pointer"
              aria-label="Like"
            >
              <Heart size={24} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={handleCommentClick}
              className="text-charcoal hover:text-charcoal/70 cursor-pointer"
              aria-label="Comment"
            >
              <MessageCircle size={24} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={onInteract}
              className="text-charcoal hover:text-charcoal/70 cursor-pointer"
              aria-label="Share"
            >
              <Share2 size={24} strokeWidth={1.5} />
            </button>
          </div>

          {post.likes > 0 && (
            <p className="text-sm font-semibold mb-1.5">
              {post.likes.toLocaleString()} {post.likes === 1 ? 'like' : 'likes'}
            </p>
          )}

          {post.text && (
            <p className="text-sm leading-snug">
              <span className="font-semibold mr-1.5">{post.studentName}</span>
              <span className="text-charcoal/85">{post.text}</span>
            </p>
          )}

          {post.comments > 0 && !post.teacherComment && (
            <button
              type="button"
              onClick={onInteract}
              className="text-sm text-charcoal/45 mt-1.5 cursor-pointer hover:text-charcoal/60"
            >
              View all {post.comments} comments
            </button>
          )}

          {showCommentForm && canComment && (
            <div className="mt-3 space-y-2">
              <textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Write teacher feedback…"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-sm bg-cream focus:outline-none focus:border-teal resize-none"
              />
              {commentError && <p className="text-xs text-red-600">{commentError}</p>}
              <Button size="sm" onClick={() => void handleSubmitComment()} disabled={commentSubmitting}>
                {commentSubmitting ? 'Posting…' : 'Post comment'}
              </Button>
            </div>
          )}

          <p className="text-[10px] text-charcoal/40 uppercase tracking-wide mt-2">
            {post.date}
          </p>

          {post.teacherComment && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <div className="flex items-center gap-1.5 mb-1">
                <BadgeCheck size={14} className="text-teal" />
                <span className="text-xs font-semibold">{post.teacherComment.teacherName}</span>
                <Badge variant="verified">Teacher</Badge>
              </div>
              <p className="text-sm text-charcoal/75">{post.teacherComment.text}</p>
            </div>
          )}
        </div>
      </article>
    )
  }

  return (
    <article className="bg-cream border border-border rounded-sm p-5">
      <div className="flex items-start gap-3 mb-3">
        <Avatar src={post.studentAvatar} name={post.studentName} size={40} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{post.studentName}</span>
            <Badge>{post.level}</Badge>
          </div>
          <span className="text-xs text-charcoal/50">{post.date}</span>
        </div>
      </div>

      {post.text && (
        <p className="text-sm leading-relaxed text-charcoal/80 mb-3">{post.text}</p>
      )}

      {post.video && (
        <video
          src={post.video}
          controls
          className="w-full rounded-sm mb-3 max-h-80 object-contain bg-cream-dark"
        />
      )}
      {post.image && !post.video && (
        <div className="w-full aspect-video max-h-[350px] overflow-hidden rounded-sm mb-3 bg-cream-dark">
          <img
            src={post.image}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {post.teacherComment && (
        <div className="bg-cream-dark border border-border rounded-sm p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <BadgeCheck size={14} className="text-teal" />
            <span className="text-xs font-semibold">{post.teacherComment.teacherName}</span>
            <Badge variant="verified">Verified Teacher</Badge>
          </div>
          <p className="text-sm text-charcoal/70">{post.teacherComment.text}</p>
        </div>
      )}

      {showCommentForm && canComment && (
        <div className="mb-3 space-y-2">
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="Write teacher feedback…"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-border rounded-sm bg-cream focus:outline-none focus:border-teal resize-none"
          />
          {commentError && <p className="text-xs text-red-600">{commentError}</p>}
          <Button size="sm" onClick={() => void handleSubmitComment()} disabled={commentSubmitting}>
            {commentSubmitting ? 'Posting…' : 'Post comment'}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-6 pt-2 border-t border-border">
        <button type="button" onClick={onInteract} className="flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-charcoal cursor-pointer">
          <Heart size={16} /> {post.likes}
        </button>
        <button type="button" onClick={handleCommentClick} className="flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-charcoal cursor-pointer">
          <MessageCircle size={16} /> {post.comments}
        </button>
        <button type="button" onClick={onInteract} className="flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-charcoal cursor-pointer">
          <Share2 size={16} /> Share
        </button>
      </div>
    </article>
  )
}
