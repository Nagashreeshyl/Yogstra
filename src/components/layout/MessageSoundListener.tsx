import { useApp } from '../../context/AppContext'
import { useIncomingMessageSound } from '../../hooks/useIncomingMessageSound'

export function MessageSoundListener() {
  const { user } = useApp()
  useIncomingMessageSound(user?.id)
  return null
}
