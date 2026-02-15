import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { Button } from '@repo/ui/Button'
import { Card } from '@repo/ui/Card'
import { db } from '../../lib/firebase'
import { acceptInvite } from './useTeamAccess'
import { useIncomingInvites } from './useIncomingInvites'

type AppContext = {
  user: User
  profile: { uid: string; role: string | null; displayName: string; email?: string }
}

const PROFESSIONAL_ROLES = new Set(['trainer', 'nutritionist', 'counsellor'])

export function InviteAcceptance() {
  const { user, profile } = useOutletContext<AppContext>()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ traineeId: string } | null>(null)

  const isProfessional = profile.role ? PROFESSIONAL_ROLES.has(profile.role) : false
  const { data: incomingInvites, isLoading } = useIncomingInvites(user.email)

  async function handleAccept(code: string, traineeId: string) {
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
        traineeId,
        code,
        user: {
          uid: user.uid,
          email: user.email ?? '',
          displayName: profile.displayName ?? user.displayName ?? '',
          role: profile.role as 'trainer' | 'nutritionist' | 'counsellor',
        },
      })
      setSuccess({ traineeId })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to accept invite.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-5">
      <h2 className="text-xl font-semibold">Pending invites</h2>
      <p className="mt-1 text-sm text-slate-600">Tap to accept invites sent to your email.</p>

      {isLoading ? (
        <p className="mt-3 text-sm text-slate-500">Loading invites...</p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {success ? (
        <p className="mt-3 text-sm text-emerald-700">
          Invite accepted. Open client view at{' '}
          <Link className="underline" to={`/app/client/${success.traineeId}`}>
            /app/client/{success.traineeId}
          </Link>
          .
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {incomingInvites && incomingInvites.length === 0 ? (
          <p className="text-sm text-slate-500">No pending invites right now.</p>
        ) : null}
        {incomingInvites?.map(invite => (
          <article className="rounded border p-3" key={invite.code}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">Trainee: {invite.traineeId}</p>
                <p className="text-xs text-slate-600">Role: {invite.role}</p>
              </div>
              <Button
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleAccept(invite.code, invite.traineeId)}
                type="button"
              >
                {isSubmitting ? 'Accepting...' : 'Accept'}
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4">
        <Button variant="outline" onClick={() => navigate('/app')} type="button">
          Back to home
        </Button>
      </div>
    </Card>
  )
}
