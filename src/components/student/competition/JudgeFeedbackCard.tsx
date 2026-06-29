import { MessageSquareQuote } from 'lucide-react'

interface JudgeFeedbackCardProps {
  comments: string[]
  enabled?: boolean
}

export function JudgeFeedbackCard({ comments, enabled = true }: JudgeFeedbackCardProps) {
  if (!enabled) {
    return (
      <div className="rounded-[12px] border border-dashed border-border p-4 text-sm text-muted-foreground">
        Judge comments are not available for this competition.
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        No judge comments yet.
      </div>
    )
  }

  return (
    <ul className="space-y-3" role="list">
      {comments.map((comment, index) => (
        <li
          key={`${index}-${comment.slice(0, 20)}`}
          className="flex gap-3 rounded-[12px] border border-border bg-elevated p-4"
        >
          <MessageSquareQuote className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <p className="text-sm leading-relaxed text-foreground">{comment}</p>
        </li>
      ))}
    </ul>
  )
}
