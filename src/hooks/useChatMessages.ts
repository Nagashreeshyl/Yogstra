import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../types'
import { fetchMessages, sendMessage, subscribeToMessages } from '../services/messages'

export function useChatMessages(bookingId: string | null, userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!bookingId) {
      setMessages([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    fetchMessages(bookingId)
      .then((data) => {
        if (active) setMessages(data)
      })
      .catch(() => {
        if (active) setError('Could not load messages.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const unsubscribe = subscribeToMessages(bookingId, (message) => {
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      )
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [bookingId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, bookingId])

  const handleSend = useCallback(
    async (content: string) => {
      if (!bookingId || !userId) return
      setSending(true)
      setError(null)
      try {
        await sendMessage(bookingId, userId, content)
      } catch {
        setError('Failed to send message.')
      } finally {
        setSending(false)
      }
    },
    [bookingId, userId],
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
