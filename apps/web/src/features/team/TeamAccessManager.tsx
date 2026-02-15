import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { MODULE_KEYS, type ModuleKey, type ProfessionalRole } from '@repo/shared'
import type { User } from 'firebase/auth'
import { Button } from '@repo/ui/Button'
import { Card } from '@repo/ui/Card'
import { MODULE_LABELS, useTeamAccess } from './useTeamAccess'

type AppContext = {
  user: User
  profile: { uid: string; role: string | null }
}

const ROLE_OPTIONS: Array<{ value: ProfessionalRole; label: string }> = [
  { value: 'trainer', label: 'Trainer' },
  { value: 'nutritionist', label: 'Nutritionist' },
  { value: 'counsellor', label: 'Counsellor' },
]

export function TeamAccessManager() {
  const { user, profile } = useOutletContext<AppContext>()
  const [inviteRole, setInviteRole] = useState<ProfessionalRole>('trainer')
  const [inviteOutput, setInviteOutput] = useState<{ code: string; link?: string } | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const {
    loading,
    error,
    invites,
    members,
    createInvite,
    toggleModule,
    setGrantActive,
    revokeAccess,
  } = useTeamAccess(user.uid, user.uid)

  if (profile.role !== 'trainee') {
    return (
      <Card className="p-5">
        <h2 className="text-xl font-semibold">Team access</h2>
        <p className="mt-2 text-sm text-slate-600">
          Team management is available only for trainee accounts.
        </p>
      </Card>
    )
  }

  async function handleCreateInvite() {
    setActionError(null)
    setIsCreatingInvite(true)
    try {
      const invite = await createInvite({ role: inviteRole, email: inviteEmail })
      setInviteOutput({ code: invite.code })
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Failed to create invite.')
    } finally {
      setIsCreatingInvite(false)
    }
  }

  async function handleToggle(memberUid: string, module: ModuleKey, enabled: boolean) {
    setActionError(null)
    try {
      await toggleModule(memberUid, module, enabled)
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Failed to update permission.')
    }
  }

  async function handleRevoke(memberUid: string) {
    setActionError(null)
    try {
      await revokeAccess(memberUid)
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Failed to revoke access.')
    }
  }

  async function handleToggleGrant(memberUid: string, active: boolean) {
    setActionError(null)
    try {
      await setGrantActive(memberUid, active)
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Failed to update grant status.')
    }
  }

  return (
    <section className="space-y-4">
      <Card className="p-5">
        <h2 className="text-xl font-semibold">Team members & permissions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Invite professionals, control module access, and revoke instantly.
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold">Create invite code</h3>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-sm">
            Professional role
            <select
              className="rounded border px-3 py-2"
              onChange={event => setInviteRole(event.target.value as ProfessionalRole)}
              value={inviteRole}
            >
              {ROLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Professional email
            <input
              className="rounded border px-3 py-2"
              onChange={event => setInviteEmail(event.target.value)}
              placeholder="coach@example.com"
              required
              type="email"
              value={inviteEmail}
            />
          </label>
          <Button disabled={isCreatingInvite} onClick={handleCreateInvite} type="button">
            {isCreatingInvite ? 'Creating...' : 'Generate Invite'}
          </Button>
        </div>
        {inviteOutput ? (
          <div className="mt-3 rounded border bg-slate-50 p-3 text-sm">
            <p>
              Invite code: <span className="font-mono font-semibold">{inviteOutput.code}</span>
            </p>
            <p className="mt-1 break-all text-slate-600">Share link: {inviteOutput.link}</p>
            <p className="mt-1 text-slate-500">Expires in 7 days.</p>
          </div>
        ) : null}
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold">Pending invites</h3>
        <div className="mt-3 space-y-2">
          {invites.filter(invite => invite.status === 'pending').length === 0 ? (
            <p className="text-sm text-slate-500">No pending invites.</p>
          ) : (
            invites
              .filter(invite => invite.status === 'pending')
              .map(invite => {
                const expiresAt =
                  typeof invite.expiresAt === 'object' && invite.expiresAt
                    ? (invite.expiresAt as { toMillis?: () => number; seconds?: number })
                    : null
                const expires =
                  expiresAt?.toMillis?.() ??
                  (typeof (expiresAt as { seconds?: number })?.seconds === 'number'
                    ? (expiresAt as { seconds: number }).seconds * 1000
                    : null)

                const acceptLink = `/app/invite?traineeId=${encodeURIComponent(invite.traineeId)}&code=${encodeURIComponent(invite.code)}`

                return (
                  <article className="rounded border p-3 text-sm" key={invite.code}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-mono text-base font-semibold">{invite.code}</p>
                        <p className="text-slate-600">Role: {invite.role}</p>
                        {expires ? (
                          <p className="text-xs text-slate-500">
                            Expires: {new Date(expires).toLocaleDateString()}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <a
                          className="pill-button bg-white text-emerald-900"
                          href={acceptLink}
                          aria-label={`Open invite ${invite.code}`}
                        >
                          Accept
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(acceptLink)
                              setInviteOutput({ code: invite.code, link: acceptLink })
                            } catch {
                              setInviteOutput({ code: invite.code, link: acceptLink })
                            }
                          }}
                          type="button"
                        >
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold">Team access</h3>
        {loading ? <p className="mt-3 text-sm text-slate-500">Loading team members...</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {actionError ? <p className="mt-3 text-sm text-red-600">{actionError}</p> : null}

        <div className="mt-3 space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-slate-500">No team members yet.</p>
          ) : (
            members.map(member => (
              <article className="rounded border p-3" key={member.uid}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{member.displayName || member.email}</p>
                    <p className="text-sm text-slate-600">
                      {member.role} · {member.email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleGrant(member.uid, !(member.grant?.active ?? false))
                      }
                      type="button"
                    >
                      {member.grant?.active === false ? 'Enable' : 'Disable'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevoke(member.uid)}
                      type="button"
                    >
                      Revoke
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {MODULE_KEYS.map(module => (
                    <label className="flex items-center gap-2 text-sm" key={module}>
                      <input
                        checked={member.grant?.modules[module] ?? false}
                        onChange={event => handleToggle(member.uid, module, event.target.checked)}
                        type="checkbox"
                      />
                      {MODULE_LABELS[module]}
                    </label>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </Card>
    </section>
  )
}
