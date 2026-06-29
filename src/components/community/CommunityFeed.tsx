import { useState } from 'react'
import { Heart, MessageCircle, Share2, BadgeCheck, MoreHorizontal, Pin } from 'lucide-react'
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
      <article className={`rounded-[16px] border border-border bg-elevated overflow-hidden ${post.pinned ? 'border-primary/40' : 'border-border/70'}`}>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Avatar src={post.studentAvatar} name={post.studentName} size={32} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold leading-tight truncate">{post.studentName}</p>
              {post.pinned && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary shrink-0">
                  <Pin size={10} />
                  Pinned
                </span>
              )}
            </div>
            {post.level && (
              <p className="text-[11px] text-muted-foreground/70 leading-tight mt-0.5">{post.level}</p>
            )}
          </div>
          <button
            type="button"
            className="text-muted-foreground/70 hover:text-muted-foreground p-1 cursor-pointer"
            aria-label="Post options"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {post.video && (
          <video
            src={post.video}
            controls
            className="w-full max-h-[585px] object-contain bg-sidebar/[0.03]"
          />
        )}
        {post.image && !post.video && (
          <div className="w-full aspect-[4/5] max-h-[585px] overflow-hidden bg-sidebar/[0.03]">
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
              className="text-foreground hover:text-muted-foreground cursor-pointer"
              aria-label="Like"
            >
              <Heart size={24} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={handleCommentClick}
              className="text-foreground hover:text-muted-foreground cursor-pointer"
              aria-label="Comment"
            >
              <MessageCircle size={24} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={onInteract}
              className="text-foreground hover:text-muted-foreground cursor-pointer"
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
              <span className="text-foreground/85">{post.text}</span>
            </p>
          )}

          {post.comments > 0 && !post.teacherComment && (
            <button
              type="button"
              onClick={onInteract}
              className="text-sm text-muted-foreground/70 mt-1.5 cursor-pointer hover:text-muted-foreground"
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
                className="w-full px-3 py-2 text-sm rounded-[16px] border border-border bg-elevated focus:outline-none focus:border-primary resize-none"
              />
              {commentError && <p className="text-xs text-red-600">{commentError}</p>}
              <Button size="sm" onClick={() => void handleSubmitComment()} disabled={commentSubmitting}>
                {commentSubmitting ? 'Posting…' : 'Post comment'}
              </Button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide mt-2">
            {post.date}
          </p>

          {post.teacherComment && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <div className="flex items-center gap-1.5 mb-1">
                <BadgeCheck size={14} className="text-primary" />
                <span className="text-xs font-semibold">{post.teacherComment.teacherName}</span>
                <Badge variant="verified">Teacher</Badge>
              </div>
              <p className="text-sm text-foreground/75">{post.teacherComment.text}</p>
            </div>
          )}
        </div>
      </article>
    )
  }

  return (
    <article className="bg-elevated rounded-[16px] border border-border p-5">
      <div className="flex items-start gap-3 mb-3">
        <Avatar src={post.studentAvatar} name={post.studentName} size={40} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{post.studentName}</span>
            <Badge>{post.level}</Badge>
            {post.pinned && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary">
                <Pin size={10} />
                Pinned
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{post.date}</span>
        </div>
      </div>

      {post.text && (
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">{post.text}</p>
      )}

      {post.video && (
        <video
          src={post.video}
          controls
          className="w-full rounded-[12px] mb-3 max-h-80 object-contain bg-muted"
        />
      )}
      {post.image && !post.video && (
        <div className="w-full aspect-video max-h-[350px] overflow-hidden rounded-[12px] mb-3 bg-muted">
          <img
            src={post.image}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {post.teacherComment && (
        <div className="bg-muted rounded-[16px] border border-border p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <BadgeCheck size={14} className="text-primary" />
            <span className="text-xs font-semibold">{post.teacherComment.teacherName}</span>
            <Badge variant="verified">Verified Teacher</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{post.teacherComment.text}</p>
        </div>
      )}

      {showCommentForm && canComment && (
        <div className="mb-3 space-y-2">
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="Write teacher feedback…"
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-[16px] border border-border bg-elevated focus:outline-none focus:border-primary resize-none"
          />
          {commentError && <p className="text-xs text-red-600">{commentError}</p>}
          <Button size="sm" onClick={() => void handleSubmitComment()} disabled={commentSubmitting}>
            {commentSubmitting ? 'Posting…' : 'Post comment'}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-6 pt-2 border-t border-border">
        <button type="button" onClick={onInteract} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <Heart size={16} /> {post.likes}
        </button>
        <button type="button" onClick={handleCommentClick} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <MessageCircle size={16} /> {post.comments}
        </button>
        <button type="button" onClick={onInteract} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <Share2 size={16} /> Share
        </button>
      </div>
    </article>
  )
}
