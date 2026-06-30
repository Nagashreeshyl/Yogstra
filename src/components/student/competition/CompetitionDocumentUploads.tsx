import { useRef, useState } from 'react'
import { Check, FileUp, Loader2 } from 'lucide-react'
import {
  uploadCompetitionDocument,
  type CompetitionDocumentType,
} from '../../../services/competitionDocuments'
import { formatUserFacingError } from '../../../utils/format'

const DOC_LABELS: Record<CompetitionDocumentType, string> = {
  identity: 'Government ID',
  medical: 'Medical fitness certificate',
  photo: 'Passport-size photo',
  ageProof: 'Age proof',
}

interface CompetitionDocumentUploadsProps {
  competitionId: string
  userId: string
  documents: Record<CompetitionDocumentType, boolean>
  documentFiles: Partial<Record<CompetitionDocumentType, string>>
  onChange: (
    documents: Record<CompetitionDocumentType, boolean>,
    documentFiles: Partial<Record<CompetitionDocumentType, string>>,
  ) => void
}

export function CompetitionDocumentUploads({
  competitionId,
  userId,
  documents,
  documentFiles,
  onChange,
}: CompetitionDocumentUploadsProps) {
  const [uploading, setUploading] = useState<CompetitionDocumentType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRefs = useRef<Partial<Record<CompetitionDocumentType, HTMLInputElement | null>>>({})

  async function handleFile(docType: CompetitionDocumentType, file: File | undefined) {
    if (!file) return
    setUploading(docType)
    setError(null)
    try {
      const url = await uploadCompetitionDocument(userId, competitionId, docType, file)
      onChange(
        { ...documents, [docType]: true },
        { ...documentFiles, [docType]: url },
      )
    } catch (err) {
      setError(formatUserFacingError(err, 'Upload failed. Please try again.'))
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="space-y-3">
      {(Object.keys(DOC_LABELS) as CompetitionDocumentType[]).map((docType) => {
        const uploaded = Boolean(documentFiles[docType])
        const checked = documents[docType] || uploaded
        return (
          <div
            key={docType}
            className="rounded-lg border border-border bg-muted/20 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <label className="flex min-h-[44px] flex-1 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!uploaded}
                  onChange={(e) =>
                    onChange(
                      { ...documents, [docType]: e.target.checked && uploaded },
                      documentFiles,
                    )
                  }
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span className="text-sm">
                  <span className="font-medium">{DOC_LABELS[docType]}</span>
                  {uploaded && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-primary">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      Uploaded
                    </span>
                  )}
                </span>
              </label>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <input
                  ref={(el) => {
                    inputRefs.current[docType] = el
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="sr-only"
                  onChange={(e) => void handleFile(docType, e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={uploading === docType}
                  onClick={() => inputRefs.current[docType]?.click()}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-border bg-elevated px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-60"
                >
                  {uploading === docType ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <FileUp className="h-4 w-4" aria-hidden />
                  )}
                  {uploaded ? 'Replace file' : 'Upload file'}
                </button>
              </div>
            </div>
          </div>
        )
      })}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
