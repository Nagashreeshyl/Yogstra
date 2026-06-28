import { supabase } from '../lib/supabase'
import type { CommunityPost } from '../types'
import { mapPost } from '../utils/mappers'
import {
  safeStorageExtension,
  sanitizeText,
  validatePostMediaUpload,
} from '../utils/sanitize'

const postSelect = `
  *,
  author:profiles!author_id (*),
  comments (
    *,
    author:profiles!author_id (*)
  )
`

// VERIFIED: community posts — student create with media, realtime feed, admin remove
export async function fetchPosts(limit?: number): Promise<CommunityPost[]> {
  let query = supabase
    .from('posts')
    .select(postSelect)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return (data ?? []).map((row) => mapPost(row))
}

export async function createPost(params: {
  authorId: string
  content: string
  mediaFile?: File
}) {
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user.id
  if (!userId) {
    throw new Error('You must be signed in to post.')
  }
  if (userId !== params.authorId) {
    throw new Error('You can only post as yourself.')
  }

  const content = sanitizeText(params.content, 5000)
  if (!content && !params.mediaFile) {
    throw new Error('Post content or media is required.')
  }

  let mediaUrl: string | undefined
  let mediaType: 'image' | 'video' | undefined

  if (params.mediaFile) {
    validatePostMediaUpload(params.mediaFile)
    const ext = safeStorageExtension(params.mediaFile)
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(path, params.mediaFile, {
        contentType: params.mediaFile.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path)
    mediaUrl = urlData.publicUrl
    mediaType = params.mediaFile.type.startsWith('video/') ? 'video' : 'image'
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: userId,
      content,
      media_url: mediaUrl,
      media_type: mediaType,
    })
    .select(postSelect)
    .single()

  if (error) throw error
  return mapPost(data)
}

export async function deletePost(id: string) {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
}

// VERIFIED: community teacher comments on student posts
export async function createComment(postId: string, content: string) {
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user.id
  if (!userId) throw new Error('You must be signed in to comment.')

  const text = sanitizeText(content, 2000)
  if (!text) throw new Error('Comment cannot be empty.')

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    author_id: userId,
    content: text,
  })

  if (error) throw error
}
