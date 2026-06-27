import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Camera, ImageIcon } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchTeacherById, updateTeacherSettings } from '../../services/teachers'
import { uploadTeacherAvatar, uploadTeacherCover } from '../../services/avatars'
import { prepareImageForCrop } from '../../utils/imageCrop'
import { TEACHER_CARD_CROP, TEACHER_CARD_PREVIEW } from '../../utils/panZoomCrop'
import { AvatarCropModal } from '../../components/profile/AvatarCropModal'
import { PanZoomCropModal } from '../../components/profile/PanZoomCropModal'
import { SettingsSidebar } from '../../components/profile/SettingsSidebar'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Toast } from '../../components/ui/Toast'
import { SettingsPageLayout } from '../../components/layout/FeedPageLayout'

const MAX_FILE_SIZE = 2 * 1024 * 1024

type CropMode = 'avatar' | 'cover' | null

export function TeacherSettingsPage() {
  const { user, refreshUser } = useApp()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const { data: teacher, loading, refetch } = useAsyncData(
    () => (user ? fetchTeacherById(user.id) : Promise.resolve(null)),
    [user?.id],
  )

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [bio, setBio] = useState('')
  const [certifications, setCertifications] = useState('')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [specializations, setSpecializations] = useState<string[]>([])
  const [specInput, setSpecInput] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [cropMode, setCropMode] = useState<CropMode>(null)

  useEffect(() => {
    if (!teacher) return
    setFullName(teacher.name)
    setPhone(teacher.phone)
    setCity(teacher.city)
    setState(teacher.state)
    setBio(teacher.bio)
    setCertifications(teacher.certifications)
    setMonthlyFee(String(teacher.monthlyFee))
    setSpecializations(teacher.specializations)
    setAvatarPreview(teacher.photo || null)
    setCoverPreview(teacher.coverPhoto || null)
  }, [teacher])

  const completion = useMemo(
    () => ({
      photo: Boolean(avatarPreview),
      cover: Boolean(coverPreview),
      bio: bio.trim().length >= 20,
      specializations: specializations.length > 0,
      location: Boolean(city.trim() && state.trim()),
      fee: Number(monthlyFee) > 0,
    }),
    [avatarPreview, coverPreview, bio, specializations, city, state, monthlyFee],
  )

  const closeCropModal = useCallback(() => {
    setCropImageSrc(null)
    setCropMode(null)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
    if (coverInputRef.current) coverInputRef.current.value = ''
  }, [])

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'avatar' | 'cover',
  ) => {
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
      setCropMode(mode)
      setCropImageSrc(prepared.src)
    } catch {
      setToast({ message: 'Failed to load image. Please try another file.', type: 'error' })
      e.target.value = ''
    }
  }

  const handleCropConfirm = async (blob: Blob) => {
    if (!user || !cropMode) return

    setUploading(true)
    try {
      const file = new File(
        [blob],
        cropMode === 'avatar' ? 'avatar.jpg' : 'cover.jpg',
        { type: 'image/jpeg' },
      )

      if (cropMode === 'avatar') {
        const url = await uploadTeacherAvatar(user.id, file)
        setAvatarPreview(url)
        setToast({ message: 'Profile photo updated', type: 'success' })
      } else {
        const url = await uploadTeacherCover(user.id, file)
        setCoverPreview(url)
        setToast({ message: 'Card photo updated', type: 'success' })
      }

      await refreshUser()
      await refetch()
      closeCropModal()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save photo. Please try again.'
      setToast({ message, type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const addSpec = () => {
    const trimmed = specInput.trim()
    if (trimmed && !specializations.includes(trimmed)) {
      setSpecializations([...specializations, trimmed])
      setSpecInput('')
    }
  }

  const removeSpec = (spec: string) => {
    setSpecializations(specializations.filter((s) => s !== spec))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateTeacherSettings(user.id, {
        fullName,
        phone,
        city,
        state,
        bio,
        certifications,
        monthlyFee: Number(monthlyFee) || 0,
        specializations,
      })
      await refetch()
      await refreshUser()
      setToast({ message: 'Profile saved', type: 'success' })
    } catch {
      setToast({ message: 'Failed to save profile. Please try again.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-charcoal/50 text-sm">Loading settings...</div>
  }

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <SettingsPageLayout
        sidebar={
          <SettingsSidebar
            name={fullName || user?.name || ''}
            avatarPreview={avatarPreview}
            coverPreview={coverPreview}
            completion={completion}
          />
        }
      >
        <h1 className="text-xl font-semibold mb-6">Edit profile</h1>

        {/* Profile photo row — Instagram-style */}
        <section className="flex items-center gap-6 mb-8 pb-8 border-b border-border/70">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploading}
            className="relative group cursor-pointer disabled:opacity-60 shrink-0"
            aria-label="Change profile photo"
          >
            <Avatar src={avatarPreview} name={fullName || user?.name || 'T'} size={88} />
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
            <p className="text-xs text-charcoal/45 mt-1">Used in sidebar, messages &amp; comments</p>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => void handleFileSelect(e, 'avatar')}
            className="hidden"
          />
        </section>

        {/* Teacher card photo */}
        <section className="mb-8 pb-8 border-b border-border/70">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-semibold">Teacher card photo</p>
              <p className="text-xs text-charcoal/45 mt-0.5">Shown on Find Teachers</p>
            </div>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-semibold text-teal hover:text-teal-dark shrink-0 cursor-pointer disabled:opacity-60"
            >
              Change
            </button>
          </div>
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading}
            className="relative group cursor-pointer disabled:opacity-60"
            aria-label="Change card photo"
            style={{
              width: TEACHER_CARD_PREVIEW.width,
              height: TEACHER_CARD_PREVIEW.height,
            }}
          >
            <div
              className="w-full h-full overflow-hidden relative"
              style={{
                borderRadius: `${TEACHER_CARD_PREVIEW.borderRadius}px`,
                border: coverPreview ? undefined : '2px dashed #E8DCC8',
                backgroundColor: coverPreview ? undefined : '#5BB8C4',
              }}
            >
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Card"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white gap-2">
                  <ImageIcon size={28} />
                  <span className="text-xs font-medium">Add card photo</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" />
              </div>
            </div>
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => void handleFileSelect(e, 'cover')}
            className="hidden"
          />
        </section>

        {/* Form fields */}
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            void handleSave()
          }}
        >
          <Input label="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input label="State" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
          <Textarea
            label="Certifications"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            rows={2}
          />
          <Input
            label="Monthly fee (₹)"
            type="number"
            value={monthlyFee}
            onChange={(e) => setMonthlyFee(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium mb-1.5">Specializations</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                placeholder="e.g. Hatha, Vinyasa"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpec())}
              />
              <Button type="button" variant="secondary" onClick={addSpec} className="shrink-0">
                Add
              </Button>
            </div>
            {specializations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {specializations.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-soft text-sm rounded-sm"
                  >
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeSpec(spec)}
                      className="text-charcoal/50 hover:text-charcoal cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </SettingsPageLayout>

      {cropImageSrc && cropMode === 'avatar' && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          saving={uploading}
          onConfirm={handleCropConfirm}
          onCancel={closeCropModal}
        />
      )}

      {cropImageSrc && cropMode === 'cover' && (
        <PanZoomCropModal
          imageSrc={cropImageSrc}
          title="Adjust Card Photo"
          hint="Frame yourself for the Find Teachers card · Drag to move · Zoom to adjust"
          viewportWidth={TEACHER_CARD_CROP.viewportWidth}
          viewportHeight={TEACHER_CARD_CROP.viewportHeight}
          outputWidth={TEACHER_CARD_CROP.outputWidth}
          outputHeight={TEACHER_CARD_CROP.outputHeight}
          shape="rectangle"
          saving={uploading}
          confirmLabel="Use This Photo"
          onConfirm={handleCropConfirm}
          onCancel={closeCropModal}
        />
      )}
    </>
  )
}
