import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { MODULE_KEYS, type ModuleKey, type ProfessionalRole } from '@repo/shared'
import type { User } from 'firebase/auth'
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
  const [inviteOutput, setInviteOutput] = useState<{ code: string; link: string } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const { loading, error, invites, members, createInvite, toggleModule, setGrantActive, revokeAccess } =
    useTeamAccess(user.uid, user.uid)

  if (profile.role !== 'trainee') {
    return (
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Team access</h2>
        <p className="mt-2 text-sm text-slate-600">
          Team management is available only for trainee accounts.
        </p>
      </section>
    )
  }

  async function handleCreateInvite() {
    setActionError(null)
    setIsCreatingInvite(true)
    try {
      const invite = await createInvite(inviteRole)
      setInviteOutput(invite)
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
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Team members & permissions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Invite professionals, control module access, and revoke instantly.
        </p>
      </div>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
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
          <button
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isCreatingInvite}
            onClick={handleCreateInvite}
            type="button"
          >
            {isCreatingInvite ? 'Creating...' : 'Generate Invite'}
          </button>
        </div>
        {inviteOutput ? (
          <div className="mt-3 rounded border bg-slate-50 p-3 text-sm">
            <p>
              Invite code: <span className="font-mono font-semibold">{inviteOutput.code}</span>
            </p>
            <p className="mt-1 break-all text-slate-600">Share link: {inviteOutput.link}</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="font-semibold">Pending invites</h3>
        <div className="mt-3 space-y-2">
          {invites.filter(invite => invite.status === 'pending').length === 0 ? (
            <p className="text-sm text-slate-500">No pending invites.</p>
          ) : (
            invites
              .filter(invite => invite.status === 'pending')
              .map(invite => (
                <article className="rounded border p-3 text-sm" key={invite.code}>
                  <p className="font-mono">{invite.code}</p>
                  <p className="text-slate-600">Role: {invite.role}</p>
                </article>
              ))
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
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
                    <button
                      className="rounded border px-3 py-1.5 text-sm"
                      onClick={() => handleToggleGrant(member.uid, !(member.grant?.active ?? false))}
                      type="button"
                    >
                      {member.grant?.active === false ? 'Enable' : 'Disable'}
                    </button>
                    <button
                      className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700"
                      onClick={() => handleRevoke(member.uid)}
                      type="button"
                    >
                      Revoke
                    </button>
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
      </section>
    </section>
  )
}
