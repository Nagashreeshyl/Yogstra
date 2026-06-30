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

// VERIFIED: community posts — student/admin create, pin to top, admin remove
function isMissingPinnedColumn(error: { code?: string; message?: string }) {
  return error.code === 'PGRST204' || Boolean(error.message?.includes('pinned'))
}

export async function fetchPosts(limit?: number): Promise<CommunityPost[]> {
  const runQuery = (withPinSort: boolean) => {
    let query = supabase.from('posts').select(postSelect)
    if (withPinSort) {
      query = query.order('pinned', { ascending: false })
    }
    query = query.order('created_at', { ascending: false })
    if (limit) query = query.limit(limit)
    return query
  }

  let result = await runQuery(true)
  if (result.error && isMissingPinnedColumn(result.error)) {
    result = await runQuery(false)
  }

  if (result.error) throw result.error
  const mapped = (result.data ?? []).map((row) => mapPost(row))
  return sortPostsByPin(mapped)
}

function sortPostsByPin(posts: CommunityPost[]): CommunityPost[] {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return 0
  })
}

export async function createPost(params: {
  authorId: string
  content: string
  mediaFile?: File
  pinned?: boolean
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

    if (uploadError) {
      const message = uploadError.message ?? 'Could not upload media.'
      if (message.toLowerCase().includes('policy') || uploadError.message?.includes('403')) {
        throw new Error('Could not upload media. Check your connection and try again.')
      }
      throw new Error(message)
    }

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
      pinned: params.pinned ?? false,
    })
    .select(postSelect)
    .single()

  if (error) {
    const message = error.message ?? 'Could not save post.'
    if (error.code === '42501' || message.toLowerCase().includes('policy')) {
      throw new Error('You do not have permission to create this post.')
    }
    throw new Error(message)
  }
  return mapPost(data)
}

export async function updatePostPin(id: string, pinned: boolean) {
  const { error } = await supabase.from('posts').update({ pinned }).eq('id', id)
  if (error) throw error
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
