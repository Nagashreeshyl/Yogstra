export function formatSessionTimeLabel(value24: string) {
  const [hourPart, minutePart] = value24.split(':')
  const hour24 = Number(hourPart)
  const minutes = minutePart ?? '00'
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12}:${minutes} ${period}`
}

export const SESSION_TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30
  const hour24 = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const value = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  return { value, label: formatSessionTimeLabel(value) }
})

export const DEFAULT_SESSION_TIME = '00:00'
