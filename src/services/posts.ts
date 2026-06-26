import { supabase } from '../lib/supabase'
import type { CommunityPost } from '../types'
import { mapPost } from '../utils/mappers'

const postSelect = `
  *,
  author:profiles!author_id (*),
  comments (
    *,
    author:profiles!author_id (*)
  )
`

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
  let mediaUrl: string | undefined
  let mediaType: 'image' | 'video' | undefined

  if (params.mediaFile) {
    const ext = params.mediaFile.name.split('.').pop() ?? 'bin'
    const path = `${params.authorId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(path, params.mediaFile)

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path)
    mediaUrl = urlData.publicUrl
    mediaType = params.mediaFile.type.startsWith('video/') ? 'video' : 'image'
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: params.authorId,
      content: params.content,
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
