import { useCallback, useEffect, useRef, useState } from 'react'
import type { DirectChatMessage } from '../types'
import {
  fetchDirectMessages,
  formatChatError,
  sendDirectMessage,
  subscribeToDirectMessages,
} from '../services/directChat'

function createOptimisticMessage(
  threadId: string,
  userId: string,
  content: string,
): DirectChatMessage {
  return {
    id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    threadId,
    senderId: userId,
    content,
    createdAt: new Date().toISOString(),
  }
}

function mergeFetchedWithPending(
  fetched: DirectChatMessage[],
  pending: DirectChatMessage[],
): DirectChatMessage[] {
  const merged = [...fetched]
  for (const msg of pending) {
    const duplicate = merged.some(
      (m) =>
        m.id === msg.id ||
        (m.senderId === msg.senderId &&
          m.content === msg.content &&
          Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5000),
    )
    if (!duplicate) merged.push(msg)
  }
  return merged.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

export function useDirectChatMessages(
  threadId: string | null,
  userId: string | undefined,
) {
  const [messages, setMessages] = useState<DirectChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef<DirectChatMessage[]>([])

  const reload = useCallback(async () => {
    if (!threadId || !userId) return
    const data = await fetchDirectMessages(threadId, userId)
    setMessages(mergeFetchedWithPending(data, pendingRef.current))
  }, [threadId, userId])

  const handleSendInternal = useCallback(
    async (content: string) => {
      if (!threadId || !userId) return

      const trimmed = content.trim()
      if (!trimmed) return

      const optimisticMessage = createOptimisticMessage(threadId, userId, trimmed)
      pendingRef.current = [...pendingRef.current, optimisticMessage]
      setMessages((prev) => [...prev, optimisticMessage])
      setError(null)

      try {
        const saved = await sendDirectMessage(threadId, userId, trimmed)
        pendingRef.current = pendingRef.current.filter((m) => m.id !== optimisticMessage.id)

        if (saved) {
          setMessages((prev) => {
            const withoutTemp = prev.filter((m) => m.id !== optimisticMessage.id)
            if (withoutTemp.some((m) => m.id === saved.id)) return withoutTemp
            return [...withoutTemp, saved]
          })
        } else {
          await reload()
        }
      } catch (err) {
        pendingRef.current = pendingRef.current.filter((m) => m.id !== optimisticMessage.id)
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
        setError(formatChatError(err))
      }
    },
    [threadId, userId, reload],
  )

  useEffect(() => {
    if (!threadId || !userId) {
      setMessages([])
      pendingRef.current = []
      setLoading(false)
      return
    }

    let active = true
    pendingRef.current = []
    setLoading(true)
    setError(null)

    fetchDirectMessages(threadId, userId)
      .then((data) => {
        if (!active) return
        setMessages(mergeFetchedWithPending(data, pendingRef.current))
      })
      .catch((err) => {
        if (active) setError(formatChatError(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const unsubscribe = subscribeToDirectMessages(threadId, (message) => {
      pendingRef.current = pendingRef.current.filter(
        (m) =>
          m.senderId !== message.senderId ||
          m.content !== message.content ||
          !m.id.startsWith('optimistic-'),
      )
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
      })
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [threadId, userId])

  const handleSend = useCallback(
    async (content: string) => {
      if (!threadId || !userId || sending) return
      setSending(true)
      try {
        await handleSendInternal(content)
      } finally {
        setSending(false)
      }
    },
    [threadId, userId, sending, handleSendInternal],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messages.length, threadId])

  return {
    messages,
    loading,
    sending,
    error,
    bottomRef,
    send: handleSend,
    reload,
  }
}
