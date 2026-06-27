import { MessagesHub } from '../components/chat/MessagesHub'
import { MessagesHubSkeleton } from '../components/ui/Skeleton'
import { useApp } from '../context/AppContext'

export function StudentMessagesPage() {
  const { user, authLoading } = useApp()
  if (authLoading || !user) return <MessagesHubSkeleton />
  return <MessagesHub />
}
