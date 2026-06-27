import { useEffect } from 'react'
import { subscribeToIncomingMessages } from '../services/directChat'
import { playMessageReceivedSound } from '../utils/notificationSounds'

export function useIncomingMessageSound(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return
    return subscribeToIncomingMessages(
      userId,
      () => {
        playMessageReceivedSound()
      },
      'sound',
    )
  }, [userId])
}
