import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clampPanOffset,
  exportPanZoomCrop,
  minCoverScale,
} from '../../utils/panZoomCrop'
import { Button } from '../ui/Button'

interface PanZoomCropModalProps {
  imageSrc: string
  title: string
  hint?: string
  viewportWidth: number
  viewportHeight: number
  outputWidth: number
  outputHeight: number
  shape?: 'circle' | 'rectangle'
  saving?: boolean
  confirmLabel?: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

export function PanZoomCropModal({
  imageSrc,
  title,
  hint = 'Drag to move · Use slider to zoom',
  viewportWidth,
  viewportHeight,
  outputWidth,
  outputHeight,
  shape = 'rectangle',
  saving,
  confirmLabel = 'Use This Photo',
  onConfirm,
  onCancel,
}: PanZoomCropModalProps) {
  const imageRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef({ active: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 })

  const [ready, setReady] = useState(false)
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const minScale =
    naturalSize.w && naturalSize.h
      ? minCoverScale(naturalSize.w, naturalSize.h, viewportWidth, viewportHeight)
      : 1

  useEffect(() => {
    setReady(false)
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      const w = img.naturalWidth
      const h = img.naturalHeight
      const coverScale = minCoverScale(w, h, viewportWidth, viewportHeight)
      setNaturalSize({ w, h })
      setScale(coverScale)
      setOffset({ x: 0, y: 0 })
      setReady(true)
    }
    img.onerror = () => setReady(false)
    img.src = imageSrc
  }, [imageSrc, viewportWidth, viewportHeight])

  const applyOffset = useCallback(
    (nextX: number, nextY: number, nextScale = scale) => {
      setOffset(
        clampPanOffset(
          naturalSize.w,
          naturalSize.h,
          nextScale,
          nextX,
          nextY,
          viewportWidth,
          viewportHeight,
        ),
      )
    },
    [naturalSize, scale, viewportWidth, viewportHeight],
  )

  const handleScaleChange = (value: number) => {
    const nextScale = Math.max(minScale, value)
    setScale(nextScale)
    applyOffset(offset.x, offset.y, nextScale)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    applyOffset(dragRef.current.offsetX + dx, dragRef.current.offsetY + dy)
  }

  const handlePointerUp = () => {
    dragRef.current.active = false
  }

  const handleConfirm = async () => {
    const img = imageRef.current
    if (!img) return
    const blob = await exportPanZoomCrop(
      img,
      naturalSize.w,
      naturalSize.h,
      scale,
      offset,
      viewportWidth,
      viewportHeight,
      outputWidth,
      outputHeight,
    )
    onConfirm(blob)
  }

  const displayW = naturalSize.w * scale
  const displayH = naturalSize.h * scale
  const imgLeft = viewportWidth / 2 - displayW / 2 + offset.x
  const imgTop = viewportHeight / 2 - displayH / 2 + offset.y

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-cream rounded-lg p-6 max-w-md w-full">
        <h3 className="font-heading text-lg font-medium mb-2 text-center">{title}</h3>
        <p className="text-xs text-charcoal/60 text-center mb-4">{hint}</p>

        <div className="flex justify-center mb-4">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              width: viewportWidth,
              height: viewportHeight,
              borderRadius: shape === 'circle' ? '50%' : '12px',
              overflow: 'hidden',
              position: 'relative',
              cursor: ready ? 'grab' : 'default',
              border: '3px solid #5BB8C4',
              backgroundColor: '#E8DCC8',
              touchAction: 'none',
            }}
          >
            {ready && (
              <img
                src={imageSrc}
                alt="Adjust crop"
                draggable={false}
                style={{
                  position: 'absolute',
                  width: displayW,
                  height: displayH,
                  left: imgLeft,
                  top: imgTop,
                  maxWidth: 'none',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        </div>

        <label className="block text-sm text-charcoal/70 mb-1">Zoom</label>
        <input
          type="range"
          min={minScale}
          max={minScale * 3}
          step={0.01}
          value={scale}
          disabled={!ready}
          onChange={(e) => handleScaleChange(Number(e.target.value))}
          className="w-full mb-6 accent-[#5BB8C4]"
        />

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={!ready || saving}>
            {saving ? 'Saving...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
