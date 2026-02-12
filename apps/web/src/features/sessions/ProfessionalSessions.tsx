import { FormEvent, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { Button } from '@repo/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/Card'
import { createSessionOffer, useSessions } from './useSessions'

type UserRole = 'trainee' | 'trainer' | 'nutritionist' | 'counsellor'

type AppContext = {
  user: User
  profile: { uid: string; displayName: string; role: UserRole | null }
}

export function ProfessionalSessions() {
  const { user, profile } = useOutletContext<AppContext>()
  const role = profile.role
  const { sessions, loading, error, reload } = useSessions('all')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [audience, setAudience] = useState<'trainee' | 'trainer' | 'nutritionist' | 'all'>(
    'trainee'
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!role || (role !== 'trainer' && role !== 'nutritionist')) {
    return (
      <Card className="p-5">
        <CardTitle>Sessions</CardTitle>
        <p className="mt-2 text-sm text-slate-600">
          Only trainers and nutritionists can publish sessions.
        </p>
      </Card>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!scheduledAt) {
      setMessage('Pick a scheduled date/time.')
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await createSessionOffer({
        title: title.trim(),
        description: description.trim(),
        audience,
        scheduledAt: new Date(scheduledAt),
        createdByUid: user.uid,
        createdByRole: role,
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
          <CardTitle>Create a session</CardTitle>
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
                  setAudience(event.target.value as 'trainee' | 'trainer' | 'nutritionist' | 'all')
                }
                value={audience}
              >
                <option value="trainee">Trainees</option>
                <option value="trainer">Trainers</option>
                <option value="nutritionist">Nutritionists</option>
                <option value="all">All roles</option>
              </select>
            </label>

            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

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
                  <p className="font-semibold">{session.title}</p>
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
