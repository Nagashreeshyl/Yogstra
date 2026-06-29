import { Link } from 'react-router-dom'
import { Check, Circle } from 'lucide-react'
import { TEACHER_PROFILE_CHECKLIST, profileCompletionPercent } from '../../utils/teacherProfileCompletion'
import type { TeacherProfileCompletion } from '../../utils/teacherProfileCompletion'
import { TEACHER_CARD_PREVIEW } from '../../utils/panZoomCrop'

interface SettingsSidebarProps {
  name: string
  avatarPreview?: string | null
  coverPreview?: string | null
  completion: TeacherProfileCompletion
}

export function SettingsSidebar({ name, coverPreview, completion }: SettingsSidebarProps) {
  const percent = profileCompletionPercent(completion)
  const doneCount = TEACHER_PROFILE_CHECKLIST.filter((item) => completion[item.key]).length

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold mb-3">Profile strength</p>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-2xl font-semibold tabular-nums">{percent}%</span>
            <span className="text-xs text-muted-foreground">
              {doneCount}/{TEACHER_PROFILE_CHECKLIST.length} complete
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        {percent < 100 && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-[12px] px-3 py-2 mb-3">
            Your profile must reach 100% before you appear in Find Teachers — even if verified.
          </p>
        )}
        <ul className="space-y-2">
          {TEACHER_PROFILE_CHECKLIST.map((item) => (
            <li key={item.key} className="flex items-center gap-2 text-sm">
              {completion[item.key] ? (
                <Check size={16} className="text-primary shrink-0" strokeWidth={2.5} />
              ) : (
                <Circle size={16} className="text-foreground/25 shrink-0" strokeWidth={1.5} />
              )}
              <span className={completion[item.key] ? 'text-muted-foreground' : 'text-muted-foreground/70'}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="text-sm font-semibold mb-1">Find Teachers preview</p>
        <p className="text-xs text-muted-foreground mb-3">How students see your card</p>
        <Link to="/teachers" className="block group">
          <div
            className="overflow-hidden bg-primary relative mx-auto transition-opacity group-hover:opacity-95"
            style={{
              width: '100%',
              maxWidth: TEACHER_CARD_PREVIEW.width,
              aspectRatio: `${TEACHER_CARD_PREVIEW.width} / ${TEACHER_CARD_PREVIEW.height}`,
              borderRadius: `${TEACHER_CARD_PREVIEW.borderRadius}px`,
            }}
          >
            {coverPreview ? (
              <img src={coverPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-white text-3xl font-medium">
                {name.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-elevated/90 px-3 py-2">
              <p className="text-xs font-semibold truncate">{name || 'Your name'}</p>
            </div>
          </div>
        </Link>
      </section>
    </div>
  )
}
