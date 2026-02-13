import { FormEvent, useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { Button } from '@repo/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/Card'
import { useSessions } from './useSessions'
import { useServices } from '../../providers/ServiceProvider'

type UserRole = 'trainee' | 'trainer' | 'nutritionist' | 'counsellor'

type AppContext = {
  user: User
  profile: { uid: string; displayName: string; role: UserRole | null }
}

const DEFAULT_SESSION_TEMPLATES: Record<
  'trainer' | 'nutritionist' | 'counsellor',
  Array<{ title: string; description: string; audience: 'trainee' | 'all' }>
> = {
  trainer: [
    {
      title: 'Baseline Training Consult',
      description: '30-minute intro call to review goals, schedule, and equipment.',
      audience: 'trainee',
    },
    {
      title: 'Form Check & Movement Screen',
      description: 'Group session to assess form on core lifts and mobility.',
      audience: 'trainee',
    },
  ],
  nutritionist: [
    {
      title: 'Nutrition Foundations',
      description: 'Macro basics, hydration, and quick wins for the next 7 days.',
      audience: 'trainee',
    },
  ],
  counsellor: [
    {
      title: 'Wellbeing Kickoff',
      description: 'Stress, sleep, and mood baseline with simple daily practices.',
      audience: 'trainee',
    },
  ],
}

export function ProfessionalSessions() {
  const { user, profile } = useOutletContext<AppContext>()
  const { session: sessionService } = useServices()
  const role = profile.role
  const { sessions, loading, error, reload } = useSessions('all')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [audience, setAudience] = useState<
    'trainee' | 'trainer' | 'nutritionist' | 'counsellor' | 'all'
  >('trainee')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [seedingDefaults, setSeedingDefaults] = useState(false)
  const seededDefaultsRef = useRef(false)

  const isAllowedRole = role === 'trainer' || role === 'nutritionist' || role === 'counsellor'
  if (!isAllowedRole) {
    return (
      <Card className="p-5">
        <CardTitle>Sessions</CardTitle>
        <p className="mt-2 text-sm text-slate-600">
          Only trainers, nutritionists, and counsellors can publish sessions.
        </p>
      </Card>
    )
  }
  const professionalRole = role as 'trainer' | 'nutritionist' | 'counsellor'

  useEffect(() => {
    if (!isAllowedRole || loading || seededDefaultsRef.current) return
    const hasDefault = sessions.some(
      session => session.createdByUid === user.uid && session.isDefault === true
    )
    if (hasDefault) {
      seededDefaultsRef.current = true
      return
    }

    async function seedDefaultSessions() {
      setSeedingDefaults(true)
      seededDefaultsRef.current = true
      try {
        const base = new Date()
        base.setHours(12, 0, 0, 0)
        const templates = DEFAULT_SESSION_TEMPLATES[professionalRole]
        for (const [index, template] of templates.entries()) {
          const scheduledAt = new Date(base.getTime() + (index + 1) * 24 * 60 * 60 * 1000)
          await sessionService.create({
            ...template,
            scheduledAt,
            createdByUid: user.uid,
            createdByRole: professionalRole,
            createdByName: profile.displayName ?? user.email ?? 'Coach',
            isDefault: true,
          })
        }
        setMessage('Added default sessions for your role.')
        void reload()
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : 'Could not seed default sessions.')
      } finally {
        setSeedingDefaults(false)
      }
    }

    void seedDefaultSessions()
  }, [
    isAllowedRole,
    loading,
    professionalRole,
    profile.displayName,
    reload,
    sessions,
    sessionService,
    user.email,
    user.uid,
  ])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!scheduledAt) {
      setMessage('Pick a scheduled date/time.')
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await sessionService.create({
        title: title.trim(),
        description: description.trim(),
        audience,
        scheduledAt: new Date(scheduledAt),
        createdByUid: user.uid,
        createdByRole: professionalRole,
        createdByName: profile.displayName ?? user.email ?? 'Coach',
      })
      setTitle('')
      setDescription('')
      setScheduledAt('')
      setAudience('trainee')
      setMessage('Session posted.')
      void reload()
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Could not create session.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <CardHeader>
          <CardTitle>
            Create a session
            {seedingDefaults ? (
              <span className="ml-2 text-xs font-medium text-slate-500">Seeding defaults...</span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <label className="grid gap-1 text-sm">
              Title
              <input
                className="rounded border px-3 py-2"
                onChange={event => setTitle(event.target.value)}
                required
                value={title}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Description
              <textarea
                className="rounded border px-3 py-2"
                onChange={event => setDescription(event.target.value)}
                required
                rows={3}
                value={description}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Scheduled time
              <input
                className="rounded border px-3 py-2"
                onChange={event => setScheduledAt(event.target.value)}
                required
                type="datetime-local"
                value={scheduledAt}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Audience
              <select
                className="rounded border px-3 py-2"
                onChange={event =>
                  setAudience(
                    event.target.value as
                      | 'trainee'
                      | 'trainer'
                      | 'nutritionist'
                      | 'counsellor'
                      | 'all'
                  )
                }
                value={audience}
              >
                <option value="trainee">Trainees</option>
                <option value="trainer">Trainers</option>
                <option value="nutritionist">Nutritionists</option>
                <option value="counsellor">Counsellors</option>
                <option value="all">All roles</option>
              </select>
            </label>

            {message ? (
              <p aria-live="polite" className="text-sm text-emerald-700">
                {message}
              </p>
            ) : null}

            <Button disabled={saving} type="submit">
              {saving ? 'Posting...' : 'Post session'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="p-5">
        <CardHeader>
          <CardTitle>Your sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-slate-500">Loading sessions...</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {sessions.length === 0 && !loading ? (
            <p className="text-sm text-slate-500">No sessions yet.</p>
          ) : (
            sessions
              .filter(session => session.createdByUid === user.uid)
              .map(session => (
                <article className="rounded border bg-slate-50 p-3" key={session.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{session.title}</p>
                    {session.isDefault ? (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-600">{session.description}</p>
                  <p className="text-xs text-slate-500">
                    Scheduled: {session.scheduledAt?.toDate().toLocaleString() ?? 'TBD'}
                  </p>
                  <p className="text-xs text-slate-500">Audience: {session.audience}</p>
                </article>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
