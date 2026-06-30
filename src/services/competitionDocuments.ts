import { supabase } from '../lib/supabase'

const BUCKET = 'competition-documents'

export type CompetitionDocumentType = 'identity' | 'medical' | 'photo' | 'ageProof'

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

function documentPath(userId: string, competitionId: string, docType: CompetitionDocumentType, file: File) {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
  return `${userId}/${competitionId}/${docType}.${ext}`
}

export async function uploadCompetitionDocument(
  userId: string,
  competitionId: string,
  docType: CompetitionDocumentType,
  file: File,
): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user || session.user.id !== userId) {
    throw new Error('You must be signed in to upload documents')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('File must be 8 MB or smaller')
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Use JPG, PNG, WebP, or PDF files')
  }

  const path = documentPath(userId, competitionId, docType, file)

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
    cacheControl: '3600',
  })

  if (uploadError) throw uploadError

  return path
}

export async function getCompetitionDocumentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
