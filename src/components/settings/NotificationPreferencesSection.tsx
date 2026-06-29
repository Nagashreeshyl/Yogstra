import { useState } from 'react'
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from '../../services/notificationCenter'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export function NotificationPreferencesSection() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => loadNotificationPreferences())
  const [saved, setSaved] = useState(false)

  const toggle = (key: keyof NotificationPreferences) => {
    if (key === 'categories') return
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
    setSaved(false)
  }

  const toggleCategory = (key: keyof NotificationPreferences['categories']) => {
    setPrefs((p) => ({
      ...p,
      categories: { ...p.categories, [key]: !p.categories[key] },
    }))
    setSaved(false)
  }

  const save = () => {
    saveNotificationPreferences(prefs)
    setSaved(true)
  }

  const reset = () => {
    setPrefs(DEFAULT_NOTIFICATION_PREFERENCES)
    saveNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES)
    setSaved(true)
  }

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">Notification preferences</h2>
        <p className="text-sm text-muted-foreground mt-1">
          In-app alerts are live today. Email and push delivery are architected for a future release — your choices are saved locally and will sync when those channels launch.
        </p>
      </div>

      <div className="space-y-3">
        {(
          [
            ['inApp', 'In-app notifications'],
            ['email', 'Email notifications (when enabled)'],
            ['push', 'Push notifications (when enabled)'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between gap-4 text-sm cursor-pointer">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={prefs[key]}
              onChange={() => toggle(key)}
              className="h-4 w-4 accent-primary"
            />
          </label>
        ))}
      </div>

      <div className="border-t border-border pt-4 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categories</p>
        {(
          Object.keys(prefs.categories) as (keyof NotificationPreferences['categories'])[]
        ).map((key) => (
          <label key={key} className="flex items-center justify-between gap-4 text-sm cursor-pointer capitalize">
            <span>{key}</span>
            <input
              type="checkbox"
              checked={prefs.categories[key]}
              onChange={() => toggleCategory(key)}
              className="h-4 w-4 accent-primary"
            />
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={save}>
          Save preferences
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={reset}>
          Reset defaults
        </Button>
      </div>

      {saved && (
        <p role="status" className="text-sm text-primary">
          Preferences saved.
        </p>
      )}
    </Card>
  )
}
