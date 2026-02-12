import { FormEvent, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { db } from '../../lib/firebase'
import { acceptInvite } from './useTeamAccess'

type AppContext = {
  user: User
  profile: { uid: string; role: string | null; displayName: string; email?: string }
}

const PROFESSIONAL_ROLES = new Set(['trainer', 'nutritionist', 'counsellor'])

export function InviteAcceptance() {
  const { user, profile } = useOutletContext<AppContext>()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ traineeId: string } | null>(null)

  const query = useMemo(() => new URLSearchParams(location.search), [location.search])
  const [traineeId, setTraineeId] = useState(query.get('traineeId') ?? '')
  const [code, setCode] = useState(query.get('code') ?? '')

  const isProfessional = profile.role ? PROFESSIONAL_ROLES.has(profile.role) : false

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!isProfessional) {
      setError('Only trainer, nutritionist, or counsellor accounts can accept invites.')
      return
    }

    setIsSubmitting(true)
    try {
      await acceptInvite({
        firestore: db,
        traineeId: traineeId.trim(),
        code: code.trim(),
        user: {
          uid: user.uid,
          email: user.email ?? '',
          displayName: profile.displayName ?? user.displayName ?? '',
          role: profile.role as 'trainer' | 'nutritionist' | 'counsellor',
        },
      })
      setSuccess({ traineeId: traineeId.trim() })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to accept invite.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Accept team invite</h2>
      <p className="mt-1 text-sm text-slate-600">
        Join a trainee&apos;s care team using their invite code.
      </p>

      <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
        <label className="grid gap-1 text-sm">
          Trainee ID
          <input
            className="rounded border px-3 py-2"
            onChange={event => setTraineeId(event.target.value)}
            required
            value={traineeId}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Invite code
          <input
            className="rounded border px-3 py-2 font-mono uppercase"
            onChange={event => setCode(event.target.value.toUpperCase())}
            required
            value={code}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? (
          <p className="text-sm text-emerald-700">
            Invite accepted. Open client view at{' '}
            <Link className="underline" to={`/app/client/${success.traineeId}`}>
              /app/client/{success.traineeId}
            </Link>
            .
          </p>
        ) : null}

        <div className="flex gap-2">
          <button
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Accepting...' : 'Accept Invite'}
          </button>
          {success ? (
            <button
              className="rounded border px-4 py-2 text-sm"
              onClick={() => navigate(`/app/client/${success.traineeId}`)}
              type="button"
            >
              Open client
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
