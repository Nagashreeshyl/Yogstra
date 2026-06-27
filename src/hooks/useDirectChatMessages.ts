import { useCallback, useEffect, useRef, useState } from 'react'
import type { DirectChatMessage } from '../types'
import {
  fetchDirectMessages,
  sendDirectMessage,
  subscribeToDirectMessages,
} from '../services/directChat'

export function useDirectChatMessages(threadId: string | null, userId: string | undefined) {
  const [messages, setMessages] = useState<DirectChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!threadId) {
      setMessages([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    fetchDirectMessages(threadId)
      .then((data) => {
        if (active) setMessages(data)
      })
      .catch(() => {
        if (active) setError('Could not load messages.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const unsubscribe = subscribeToDirectMessages(threadId, (message) => {
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      )
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [threadId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, threadId])

  const handleSend = useCallback(
    async (content: string) => {
      if (!threadId || !userId) return
      setSending(true)
      setError(null)
      try {
        await sendDirectMessage(threadId, userId, content)
      } catch {
        setError('Failed to send message.')
      } finally {
        setSending(false)
      }
    },
    [threadId, userId],
  )

  return {
    messages,
    loading,
    sending,
    error,
    bottomRef,
    send: handleSend,
  }
}
