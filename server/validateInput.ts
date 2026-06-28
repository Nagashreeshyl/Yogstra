export function sanitizeText(value: string | undefined, maxLength: number) {
  if (value == null) return ''
  return value
    .replace(/\0/g, '')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeIfsc(value: string) {
  return sanitizeText(value, 11).toUpperCase()
}

export function sanitizePan(value: string | undefined) {
  const pan = sanitizeText(value, 10).toUpperCase()
  if (!pan) return undefined
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    throw new Error('Invalid PAN format.')
  }
  return pan
}

export function sanitizeBankAccountNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 18)
  if (digits.length < 9) {
    throw new Error('Bank account number must be at least 9 digits.')
  }
  return digits
}

export function sanitizeAccountHolderName(value: string) {
  const name = sanitizeText(value, 120)
  if (name.length < 2) {
    throw new Error('Account holder name is required.')
  }
  return name
}

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024
export const MAX_POST_MEDIA_BYTES = 25 * 1024 * 1024

export function validateImageUpload(file: File, maxBytes = MAX_AVATAR_BYTES) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only JPEG, PNG, WebP, or GIF images are allowed.')
  }
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error(`Image must be smaller than ${Math.round(maxBytes / (1024 * 1024))} MB.`)
  }
}

export function validatePostMediaUpload(file: File) {
  const allowed = new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES])
  if (!allowed.has(file.type)) {
    throw new Error('Unsupported media type. Use JPEG, PNG, WebP, GIF, MP4, WebM, or MOV.')
  }
  if (file.size <= 0 || file.size > MAX_POST_MEDIA_BYTES) {
    throw new Error('Media file must be smaller than 25 MB.')
  }
}

export function safeStorageExtension(file: File) {
  switch (file.type) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    case 'video/mp4':
      return 'mp4'
    case 'video/webm':
      return 'webm'
    case 'video/quicktime':
      return 'mov'
    default:
      return 'bin'
  }
}
