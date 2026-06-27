import { useRef, useState, useEffect, useCallback } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { cropImageToBlob, percentToPixelCrop, POST_IMAGE_ASPECT, POST_IMAGE_EXPORT, POST_MAX_CROP_DIMENSION, prepareImageForCrop } from '../../utils/imageCrop'
import { X, ImagePlus, Film } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onPost: (data: { text: string; file?: File }) => void | Promise<void>
}

type MediaPreview = {
  url: string
  type: 'image' | 'video'
  file: File
}

export function CreatePostModal({ isOpen, onClose, onPost }: CreatePostModalProps) {
  const { user } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState('')
  const [media, setMedia] = useState<MediaPreview | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropImage, setCropImage] = useState<string>('')
  const [crop, setCrop] = useState<Crop>()
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const pixelCropRef = useRef<PixelCrop | null>(null)

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const width = img.clientWidth
    const height = img.clientHeight
    const nextCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, POST_IMAGE_ASPECT, width, height),
      width,
      height,
    )
    setCrop(nextCrop)
    pixelCropRef.current = percentToPixelCrop(nextCrop, width, height)
  }

  const reset = useCallback(() => {
    setCaption('')
    setMedia((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
    setIsDragging(false)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

  useEffect(() => {
    if (!isOpen) reset()
  }, [isOpen, reset])

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return

    if (file.type.startsWith('image/')) {
      setPendingFile(file)
      setCrop(undefined)
      pixelCropRef.current = null
      try {
        const prepared = await prepareImageForCrop(file, { maxDimension: POST_MAX_CROP_DIMENSION })
        setCropImage(prepared.src)
        setShowCropModal(true)
      } catch {
        setPendingFile(null)
      }
    } else {
      if (media) URL.revokeObjectURL(media.url)

      const url = URL.createObjectURL(file)
      setMedia({
        url,
        type: 'video',
        file,
      })
    }
  }

  const handleCropConfirm = async () => {
    const pixelCrop =
      pixelCropRef.current ??
      (crop && imgRef.current?.clientWidth
        ? percentToPixelCrop(crop, imgRef.current.clientWidth, imgRef.current.clientHeight)
        : null)

    if (!imgRef.current || !pendingFile || !pixelCrop?.width || !pixelCrop?.height) return

    try {
      const croppedBlob = await cropImageToBlob(
        imgRef.current,
        pixelCrop,
        POST_IMAGE_EXPORT.width,
        POST_IMAGE_EXPORT.height,
      )
      const croppedFile = new File([croppedBlob], 'post-image.jpg', { type: 'image/jpeg' })

      if (media) URL.revokeObjectURL(media.url)

      const url = URL.createObjectURL(croppedFile)
      setMedia({
        url,
        type: 'image',
        file: croppedFile,
      })

      setShowCropModal(false)
      setPendingFile(null)
    } catch (err) {
      console.error('Crop error:', err)
    }
  }

  const handleCropCancel = () => {
    setShowCropModal(false)
    setCropImage('')
    setCrop(undefined)
    pixelCropRef.current = null
    setPendingFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handlePost = () => {
    if (!caption.trim() && !media) return

    onPost({
      text: caption.trim(),
      file: media?.file,
    })
    reset()
  }

  const canPost = caption.trim().length > 0 || media !== null

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/20" onClick={handleClose} />

      <div
        className="relative bg-cream border border-border rounded-sm w-full max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col"
        style={{ boxShadow: '0 4px 24px rgba(28, 28, 28, 0.08)' }}
      >
        {/* Header — Instagram-style top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="text-sm text-charcoal/60 hover:text-charcoal cursor-pointer"
          >
            Cancel
          </button>
          <h2 className="font-heading text-base font-medium">Create Post</h2>
          <button
            type="button"
            onClick={handlePost}
            disabled={!canPost}
            className="text-sm font-medium text-teal hover:text-teal-dark disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Post
          </button>
        </div>

        {/* Body — split layout like Instagram */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
          {/* Media preview / upload zone */}
          <div
            className={`md:w-[55%] md:border-r border-border flex items-center justify-center min-h-[280px] md:min-h-[400px] relative ${
              isDragging ? 'bg-teal-soft' : 'bg-cream-dark'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {media ? (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                {media.type === 'image' ? (
                  <img
                    src={media.url}
                    alt="Preview"
                    className="max-w-full max-h-[360px] md:max-h-[400px] object-contain rounded-sm"
                  />
                ) : (
                  <video
                    src={media.url}
                    controls
                    className="max-w-full max-h-[360px] md:max-h-[400px] rounded-sm"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(media.url)
                    setMedia(null)
                  }}
                  className="absolute top-3 right-3 p-1.5 bg-cream/90 border border-border rounded-full text-charcoal/60 hover:text-charcoal cursor-pointer"
                  aria-label="Remove media"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="flex gap-3 text-teal">
                  <ImagePlus size={48} strokeWidth={1.25} />
                  <Film size={48} strokeWidth={1.25} />
                </div>
                <p className="font-heading text-lg font-medium">Drag photos and videos here</p>
                <Button type="button" onClick={() => fileInputRef.current?.click()}>
                  Select from computer
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Caption panel */}
          <div className="md:w-[45%] flex flex-col p-4 md:p-5">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-teal-soft flex items-center justify-center text-xs font-medium">
                  {user?.name?.charAt(0) ?? 'S'}
                </div>
              )}
              <span className="text-sm font-medium">{user?.name}</span>
            </div>

            <Textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="flex-1 min-h-[120px] md:min-h-[200px] border-0 px-0 focus:border-0 resize-none"
            />

            {media && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 text-sm text-teal hover:underline cursor-pointer text-left"
              >
                Change photo or video
              </button>
            )}

            <div className="mt-auto pt-4 hidden md:flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handlePost} disabled={!canPost}>
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showCropModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/80 p-4">
          <div className="bg-cream border border-border rounded-sm w-full max-w-md p-5 sm:p-6 shadow-xl">
            <h3 className="font-heading text-lg font-medium mb-1 text-center">Crop Your Photo</h3>
            <p className="text-xs text-charcoal/50 text-center mb-4">
              Portrait format — drag to adjust
            </p>
            <div className="flex justify-center mb-5 max-h-[70vh] overflow-hidden rounded-sm bg-charcoal/5">
              <ReactCrop
                crop={crop}
                onChange={(pixelCrop, percentCrop) => {
                  setCrop(percentCrop)
                  pixelCropRef.current = pixelCrop
                }}
                onComplete={(pixelCrop) => {
                  pixelCropRef.current = pixelCrop
                }}
                aspect={POST_IMAGE_ASPECT}
                className="max-h-[68vh]"
              >
                <img
                  ref={imgRef}
                  src={cropImage}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="block max-h-[68vh] w-auto mx-auto"
                />
              </ReactCrop>
            </div>
            <div className="flex gap-3 justify-center">
              <Button type="button" variant="secondary" onClick={handleCropCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleCropConfirm()}>
                Use This Photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
