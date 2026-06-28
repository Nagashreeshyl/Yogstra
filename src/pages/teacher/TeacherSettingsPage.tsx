import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Camera, ImageIcon } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
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
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Toast } from '../../components/ui/Toast'
import { ProfilePageSkeleton } from '../../components/ui/Skeleton'
import { SettingsPageLayout } from '../../components/layout/FeedPageLayout'
import { TeacherPayoutSettings } from '../../components/profile/TeacherPayoutSettings'
import { formatIndianNumber, parseIndianNumber } from '../../utils/format'
import {
  getTeacherProfileCompletion,
  missingProfileFields,
  profileCompletionPercent,
} from '../../utils/teacherProfileCompletion'

const MAX_FILE_SIZE = 2 * 1024 * 1024

type SettingsTab = 'profile' | 'pricing' | 'payouts'
type CropMode = 'avatar' | 'cover' | null

export function TeacherSettingsPage() {
  const { user, refreshUser } = useApp()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile')
  const { data: teacher, loading, refetch } = useAsyncData(
    () => (user ? fetchTeacherById(user.id) : Promise.resolve(null)),
    [user?.id],
  )

  useLiveDataRefresh(refetch, ['teachers'], Boolean(user?.id))

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [bio, setBio] = useState('')
  const [certifications, setCertifications] = useState('')
  const [fee1v1Week, setFee1v1Week] = useState('')
  const [fee1v1Month, setFee1v1Month] = useState('')
  const [feeGroupWeek, setFeeGroupWeek] = useState('')
  const [feeGroupMonth, setFeeGroupMonth] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
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
    setFee1v1Week(formatIndianNumber(teacher.pricing.oneOnOneWeek || ''))
    setFee1v1Month(formatIndianNumber(teacher.pricing.oneOnOneMonth || ''))
    setFeeGroupWeek(formatIndianNumber(teacher.pricing.groupWeek || ''))
    setFeeGroupMonth(formatIndianNumber(teacher.pricing.groupMonth || ''))
    setGender(teacher.gender ?? '')
    setSpecializations(teacher.specializations)
    setAvatarPreview(teacher.photo || null)
    setCoverPreview(teacher.coverPhoto || null)
  }, [teacher])

  const completion = useMemo(
    () =>
      getTeacherProfileCompletion({
        name: fullName,
        phone,
        city,
        state,
        bio,
        certifications,
        gender,
        specializations,
        photo: avatarPreview,
        coverPhoto: coverPreview,
        pricing: {
          oneOnOneWeek: parseIndianNumber(fee1v1Week),
          oneOnOneMonth: parseIndianNumber(fee1v1Month),
          groupWeek: parseIndianNumber(feeGroupWeek),
          groupMonth: parseIndianNumber(feeGroupMonth),
        },
      }),
    [
      avatarPreview,
      coverPreview,
      bio,
      certifications,
      city,
      state,
      fullName,
      phone,
      gender,
      specializations,
      fee1v1Week,
      fee1v1Month,
      feeGroupWeek,
      feeGroupMonth,
    ],
  )

  const profilePercent = profileCompletionPercent(completion)

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

  const validateProfileFields = () => {
    const profileOnly = getTeacherProfileCompletion({
      name: fullName,
      phone,
      city,
      state,
      bio,
      certifications,
      gender,
      specializations,
      photo: avatarPreview,
      coverPhoto: coverPreview,
      pricing: {
        oneOnOneWeek: parseIndianNumber(fee1v1Week),
        oneOnOneMonth: parseIndianNumber(fee1v1Month),
        groupWeek: parseIndianNumber(feeGroupWeek),
        groupMonth: parseIndianNumber(feeGroupMonth),
      },
    })
    return missingProfileFields(profileOnly)
  }

  const handleSavePricing = async () => {
    if (!user) return
    const missing = validateProfileFields().filter((field) => field.startsWith('Class pricing'))
    if (missing.length > 0) {
      setToast({
        message: `Set all four class fees: 1-on-1 week/month and group week/month.`,
        type: 'error',
      })
      return
    }
    setSaving(true)
    try {
      const oneOnOneMonth = parseIndianNumber(fee1v1Month)
      await updateTeacherSettings(user.id, {
        fullName: teacher?.name ?? user.name,
        phone: teacher?.phone ?? '',
        city: teacher?.city ?? '',
        state: teacher?.state ?? '',
        bio: teacher?.bio ?? '',
        certifications: teacher?.certifications ?? '',
        monthlyFee: oneOnOneMonth || teacher?.monthlyFee || 0,
        specializations: teacher?.specializations ?? [],
        gender: teacher?.gender ?? null,
        pricing: {
          oneOnOneWeek: parseIndianNumber(fee1v1Week),
          oneOnOneMonth,
          groupWeek: parseIndianNumber(feeGroupWeek),
          groupMonth: parseIndianNumber(feeGroupMonth),
        },
      })
      await refetch()
      setToast({ message: 'Pricing saved', type: 'success' })
    } catch {
      setToast({ message: 'Failed to save pricing. Please try again.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    const missing = validateProfileFields().filter(
      (field) => !field.startsWith('Class pricing'),
    )
    if (missing.length > 0) {
      setToast({
        message: `Complete required fields: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''}`,
        type: 'error',
      })
      return
    }
    setSaving(true)
    try {
      await updateTeacherSettings(user.id, {
        fullName,
        phone,
        city,
        state,
        bio,
        certifications,
        monthlyFee: teacher?.monthlyFee ?? parseIndianNumber(fee1v1Month) ?? 0,
        specializations,
        gender: gender || null,
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
    return <ProfilePageSkeleton />
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
        <div className="md:hidden mb-6">
          <SettingsSidebar
            name={fullName || user?.name || ''}
            avatarPreview={avatarPreview}
            coverPreview={coverPreview}
            completion={completion}
          />
        </div>
        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
          {(['profile', 'pricing', 'payouts'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSettingsTab(tab)}
              className={`px-4 py-2.5 text-sm capitalize cursor-pointer border-b-2 -mb-px transition-colors ${
                settingsTab === tab
                  ? 'border-teal text-charcoal font-medium'
                  : 'border-transparent text-charcoal/50 hover:text-charcoal'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {settingsTab === 'profile' && (
          <>
        <h1 className="text-xl font-semibold mb-2">Edit profile</h1>
        {profilePercent < 100 && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2 mb-6">
            Complete every field below and set class pricing to reach 100%. Until then, you
            won&apos;t appear in Find Teachers.
          </p>
        )}

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
          <Input label="Name *" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label="Phone *" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City *" value={city} onChange={(e) => setCity(e.target.value)} required />
            <Input label="State *" value={state} onChange={(e) => setState(e.target.value)} required />
          </div>
          <Select
            label="Title for student messages *"
            value={gender}
            onChange={(e) => setGender(e.target.value as 'male' | 'female' | '')}
            required
          >
            <option value="">Select…</option>
            <option value="male">Sir</option>
            <option value="female">Ma&apos;am</option>
          </Select>
          <Textarea
            label="Bio * (min 20 characters)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            required
          />
          <Textarea
            label="Certifications *"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            rows={2}
            required
          />

          <div>
            <label className="block text-sm font-medium mb-1.5">Specializations *</label>
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
          </>
        )}

        {settingsTab === 'pricing' && (
          <>
            <h1 className="text-xl font-semibold mb-2">Class pricing</h1>
            <p className="text-sm text-charcoal/55 mb-2">
              Set fees for online classes. Students see these when booking from chat.
            </p>
            <p className="text-sm text-charcoal/45 mb-6">All four fees are required for a complete profile.</p>
            <form
              className="space-y-6 max-w-lg"
              onSubmit={(e) => {
                e.preventDefault()
                void handleSavePricing()
              }}
            >
              <div>
                <h2 className="text-sm font-semibold mb-3">1-on-1 classes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="1 week (₹) *"
                    type="text"
                    inputMode="numeric"
                    value={fee1v1Week}
                    onChange={(e) => setFee1v1Week(formatIndianNumber(e.target.value))}
                    placeholder="5,000"
                    required
                  />
                  <Input
                    label="1 month (₹) *"
                    type="text"
                    inputMode="numeric"
                    value={fee1v1Month}
                    onChange={(e) => setFee1v1Month(formatIndianNumber(e.target.value))}
                    placeholder="15,000"
                    required
                  />
                </div>
              </div>
              <div>
                <h2 className="text-sm font-semibold mb-3">Group classes (1-to-many)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="1 week (₹) *"
                    type="text"
                    inputMode="numeric"
                    value={feeGroupWeek}
                    onChange={(e) => setFeeGroupWeek(formatIndianNumber(e.target.value))}
                    placeholder="2,000"
                    required
                  />
                  <Input
                    label="1 month (₹) *"
                    type="text"
                    inputMode="numeric"
                    value={feeGroupMonth}
                    onChange={(e) => setFeeGroupMonth(formatIndianNumber(e.target.value))}
                    placeholder="10,000"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? 'Saving...' : 'Save pricing'}
              </Button>
            </form>
          </>
        )}

        {settingsTab === 'payouts' && (
          <>
            <h1 className="text-xl font-semibold mb-2">Payouts</h1>
            <p className="text-sm text-charcoal/55 mb-6">
              Connect your bank account to receive your share when students book classes.
            </p>
            <TeacherPayoutSettings />
          </>
        )}
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
