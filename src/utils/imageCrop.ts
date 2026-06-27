import {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop'

export interface PreparedCropImage {
  src: string
  width: number
  height: number
}

/** Instagram-style portrait posts (4:5) */
export const POST_IMAGE_ASPECT = 4 / 5
export const POST_IMAGE_EXPORT = { width: 1080, height: 1350 }

const DEFAULT_MAX_CROP_DIMENSION = 480
const POST_MAX_CROP_DIMENSION = 720

/** Normalize EXIF rotation and resize so displayed pixels match natural pixels 1:1. */
export async function prepareImageForCrop(
  file: File,
  options?: { maxDimension?: number },
): Promise<PreparedCropImage> {
  const maxDimension = options?.maxDimension ?? DEFAULT_MAX_CROP_DIMENSION
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

  let width = bitmap.width
  let height = bitmap.height

  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas not supported')
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return {
    src: canvas.toDataURL('image/jpeg', 0.92),
    width,
    height,
  }
}

export function cropImageToBlob(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  outputWidth: number,
  outputHeight: number,
  quality = 0.9,
): Promise<Blob> {
  // Use rendered size — ReactCrop measures against what's on screen, not width attributes
  const displayWidth = image.clientWidth || image.width
  const displayHeight = image.clientHeight || image.height
  const scaleX = image.naturalWidth / displayWidth
  const scaleY = image.naturalHeight / displayHeight

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas not supported'))

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    outputWidth,
    outputHeight,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create image'))),
      'image/jpeg',
      quality,
    )
  })
}

export function percentToPixelCrop(
  crop: Crop,
  width: number,
  height: number,
): PixelCrop {
  return convertToPixelCrop(crop, width, height)
}

/** Build a centered aspect crop from the image's laid-out display size. */
export function buildCenteredAspectCrop(
  displayWidth: number,
  displayHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, displayWidth, displayHeight),
    displayWidth,
    displayHeight,
  )
}

export { centerCrop, makeAspectCrop, POST_MAX_CROP_DIMENSION }
