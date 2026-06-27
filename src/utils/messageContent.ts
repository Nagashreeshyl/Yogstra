/** Embed a clickable profile link in chat/notification text. */
export function profileLinkToken(userId: string, displayName: string): string {
  return `{{profile:${userId}|${displayName}}}`
}

/** Strip profile tokens for plain-text copy. */
export function stripProfileTokens(text: string): string {
  return text.replace(/\{\{profile:[^|]+\|([^}]+)\}\}/g, '$1')
}

export const PROFILE_LINK_REGEX = /\{\{profile:([a-f0-9-]+)\|([^}]+)\}\}/g
