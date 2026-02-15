import { FormEvent, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { Button } from '@repo/ui/Button'
import { Card } from '@repo/ui/Card'
import { db } from '../../lib/firebase'
import { acceptInvite } from './useTeamAccess'
import { z } from 'zod'

type AppContext = {
  user: User
  profile: { uid: string; role: string | null; displayName: string; email?: string }
}

const PROFESSIONAL_ROLES = new Set(['trainer', 'nutritionist', 'counsellor'])

const AcceptInviteInputSchema = z.object({
  traineeId: z.string().min(3, 'Enter the trainee ID').max(120),
  code: z
    .string()
    .trim()
    .min(6, 'Invite code should be at least 6 characters')
    .max(12, 'Invite code is too long')
    .regex(/^[A-Z0-9]+$/, 'Use letters and numbers only'),
})

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

    const parsed = AcceptInviteInputSchema.safeParse({
      traineeId: traineeId.trim(),
      code: code.trim().toUpperCase(),
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid invite details.')
      return
    }

    setIsSubmitting(true)
    try {
      await acceptInvite({
        firestore: db,
        traineeId: parsed.data.traineeId,
        code: parsed.data.code,
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
    <Card className="p-5">
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
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Accepting...' : 'Accept Invite'}
          </Button>
          {success ? (
            <Button
              variant="outline"
              onClick={() => navigate(`/app/client/${success.traineeId}`)}
              type="button"
            >
              Open client
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  )
}
