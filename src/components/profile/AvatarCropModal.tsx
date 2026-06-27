import { AVATAR_CROP } from '../../utils/panZoomCrop'
import { PanZoomCropModal } from './PanZoomCropModal'

interface AvatarCropModalProps {
  imageSrc: string
  saving?: boolean
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

export function AvatarCropModal({ imageSrc, saving, onConfirm, onCancel }: AvatarCropModalProps) {
  return (
    <PanZoomCropModal
      imageSrc={imageSrc}
      title="Adjust Profile Photo"
      viewportWidth={AVATAR_CROP.viewportWidth}
      viewportHeight={AVATAR_CROP.viewportHeight}
      outputWidth={AVATAR_CROP.outputWidth}
      outputHeight={AVATAR_CROP.outputHeight}
      shape="circle"
      saving={saving}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
