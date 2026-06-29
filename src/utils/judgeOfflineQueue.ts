import type { PendingOfflineScore } from '../types/judgePortal'

const STORAGE_KEY = 'yogstra-judge-offline-queue'

function readQueue(): PendingOfflineScore[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PendingOfflineScore[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(queue: PendingOfflineScore[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export function getOfflineQueue(): PendingOfflineScore[] {
  return readQueue()
}

export function getOfflineQueueCount(): number {
  return readQueue().length
}

export function enqueueOfflineScore(entry: Omit<PendingOfflineScore, 'createdAt' | 'retries'>) {
  const queue = readQueue()
  queue.push({
    ...entry,
    createdAt: new Date().toISOString(),
    retries: 0,
  })
  writeQueue(queue)
}

export function removeOfflineScore(id: string) {
  writeQueue(readQueue().filter((item) => item.id !== id))
}

export function updateOfflineScoreError(id: string, lastError: string) {
  const queue = readQueue()
  writeQueue(
    queue.map((item) =>
      item.id === id ? { ...item, retries: item.retries + 1, lastError } : item,
    ),
  )
}

export function generateOfflineScoreId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
