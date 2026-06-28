import { supabase } from '../lib/supabase'
import { validateImageUpload } from '../utils/sanitize'

function avatarPath(userId: string) {
  return `${userId}/avatar.jpg`
}

function coverPath(userId: string) {
  return `${userId}/cover.jpg`
}

export async function uploadTeacherCover(userId: string, file: File): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    throw new Error('You must be signed in to upload a photo')
  }
  if (session.user.id !== userId) {
    throw new Error('Session user does not match profile')
  }

  validateImageUpload(file)

  const path = coverPath(userId)

  await supabase.storage.from('avatars').remove([path])

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '3600',
    })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
  const versionedUrl = `${publicUrl}?v=${Date.now()}`

  const { error: teacherError } = await supabase
    .from('teacher_profiles')
    .update({ cover_url: versionedUrl })
    .eq('id', userId)

  if (teacherError) throw teacherError

  return versionedUrl
}

export async function uploadTeacherAvatar(userId: string, file: File): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    throw new Error('You must be signed in to upload a photo')
  }
  if (session.user.id !== userId) {
    throw new Error('Session user does not match profile')
  }

  validateImageUpload(file)

  const path = avatarPath(userId)

  // Remove first so upsert does not rely on UPDATE policy alone
  await supabase.storage.from('avatars').remove([path])

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '3600',
    })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
  const versionedUrl = `${publicUrl}?v=${Date.now()}`

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: versionedUrl })
    .eq('id', userId)

  if (profileError) throw profileError

  return versionedUrl
}

export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
  return uploadTeacherAvatar(userId, file)
}
