import { useRef, useState, useEffect, useCallback } from 'react'
import { Camera } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchStudentProfile, updateStudentSettings } from '../../services/students'
import { uploadProfileAvatar } from '../../services/avatars'
import { prepareImageForCrop } from '../../utils/imageCrop'
import { AvatarCropModal } from '../../components/profile/AvatarCropModal'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Toast } from '../../components/ui/Toast'
import { SettingsFormSkeleton } from '../../components/ui/Skeleton'

const MAX_FILE_SIZE = 2 * 1024 * 1024

export function StudentSettingsPage() {
  const { user, refreshUser } = useApp()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const { data: profile, loading, refetch } = useAsyncData(
    () => (user ? fetchStudentProfile(user.id) : Promise.resolve(null)),
    [user?.id],
  )

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.name)
    setPhone(profile.phone)
    setCity(profile.city)
    setState(profile.state)
    setAvatarPreview(profile.avatar || null)
  }, [profile])

  const closeCropModal = useCallback(() => {
    setCropImageSrc(null)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file', type: 'error' })
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setToast({ message: 'Image must be under 2MB', type: 'error' })
      e.target.value = ''
      return
    }

    try {
      const prepared = await prepareImageForCrop(file)
      setCropImageSrc(prepared.src)
    } catch {
      setToast({ message: 'Failed to load image.', type: 'error' })
      e.target.value = ''
    }
  }

  const handleCropConfirm = async (blob: Blob) => {
    if (!user) return

    setUploading(true)
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      const url = await uploadProfileAvatar(user.id, file)
      setAvatarPreview(url)
      await refreshUser()
      await refetch()
      closeCropModal()
      setToast({ message: 'Profile photo updated', type: 'success' })
    } catch {
      setToast({ message: 'Failed to upload photo', type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await updateStudentSettings(user.id, { fullName, phone, city, state })
      await refetch()
      await refreshUser()
      setToast({ message: 'Profile saved', type: 'success' })
    } catch {
      setToast({ message: 'Failed to save profile', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <SettingsFormSkeleton />
  }

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="mx-auto max-w-lg px-6 py-8">
        <h1 className="text-xl font-semibold mb-6">Edit profile</h1>

        <section className="flex items-center gap-6 mb-8 pb-8 border-b border-border/70">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploading}
            className="relative group cursor-pointer disabled:opacity-60 shrink-0"
            aria-label="Change profile photo"
          >
            <Avatar src={avatarPreview} name={fullName || user?.name || 'S'} size={88} />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={22} className="text-white" />
            </div>
          </button>
          <div className="min-w-0">
            <p className="text-base font-semibold truncate">{fullName || user?.name}</p>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-semibold text-teal hover:text-teal-dark mt-1 cursor-pointer disabled:opacity-60"
            >
              Change profile photo
            </button>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => void handleFileSelect(e)}
            className="hidden"
          />
        </section>

        <form className="space-y-5" onSubmit={handleSave}>
          <Input label="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input label="State" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </div>

      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          saving={uploading}
          onConfirm={handleCropConfirm}
          onCancel={closeCropModal}
        />
      )}
    </>
  )
}
