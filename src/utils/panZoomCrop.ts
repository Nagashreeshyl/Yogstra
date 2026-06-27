export function clampPanOffset(
  naturalW: number,
  naturalH: number,
  scale: number,
  offsetX: number,
  offsetY: number,
  viewportW: number,
  viewportH: number,
) {
  const displayW = naturalW * scale
  const displayH = naturalH * scale
  const maxX = Math.max(0, displayW / 2 - viewportW / 2)
  const maxY = Math.max(0, displayH / 2 - viewportH / 2)
  return {
    x: Math.max(-maxX, Math.min(maxX, offsetX)),
    y: Math.max(-maxY, Math.min(maxY, offsetY)),
  }
}

export function minCoverScale(
  naturalW: number,
  naturalH: number,
  viewportW: number,
  viewportH: number,
) {
  return Math.max(viewportW / naturalW, viewportH / naturalH)
}

export function exportPanZoomCrop(
  image: HTMLImageElement,
  naturalW: number,
  naturalH: number,
  scale: number,
  offset: { x: number; y: number },
  viewportW: number,
  viewportH: number,
  outputW: number,
  outputH: number,
): Promise<Blob> {
  const displayW = naturalW * scale
  const displayH = naturalH * scale
  const imgLeft = viewportW / 2 - displayW / 2 + offset.x
  const imgTop = viewportH / 2 - displayH / 2 + offset.y
  const srcX = (0 - imgLeft) / scale
  const srcY = (0 - imgTop) / scale
  const srcW = viewportW / scale
  const srcH = viewportH / scale

  const canvas = document.createElement('canvas')
  canvas.width = outputW
  canvas.height = outputH
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas not supported'))

  ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, outputW, outputH)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create image'))),
      'image/jpeg',
      0.9,
    )
  })
}

/** Card on Find Teachers page: 440px tall, ~5:8 width:height */
export const TEACHER_CARD_CROP = {
  viewportWidth: 264,
  viewportHeight: 422,
  outputWidth: 528,
  outputHeight: 844,
} as const

/** Preview in settings — same proportions as the Find Teachers card */
export const TEACHER_CARD_PREVIEW = {
  width: TEACHER_CARD_CROP.viewportWidth,
  height: TEACHER_CARD_CROP.viewportHeight,
  borderRadius: 12,
  pageHeight: 440,
} as const

export const AVATAR_CROP = {
  viewportWidth: 280,
  viewportHeight: 280,
  outputWidth: 300,
  outputHeight: 300,
} as const
