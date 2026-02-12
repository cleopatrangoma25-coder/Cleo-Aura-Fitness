import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'
import type {
  Grant,
  Invite,
  ModuleKey,
  ModulePermissions,
  ProfessionalRole,
  TeamMember,
} from '@repo/shared'
import { defaultModulesForRole } from '@repo/shared'
import { db } from '../../lib/firebase'

export const MODULE_LABELS: Record<ModuleKey, string> = {
  workouts: 'Workouts',
  recovery: 'Recovery',
  nutrition: 'Nutrition',
  wellbeing: 'Wellbeing',
  progress: 'Progress',
}

type TeamView = TeamMember & { grant: Grant | null }

function randomInviteCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

export function useTeamAccess(traineeId: string, currentUserId: string) {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [grants, setGrants] = useState<Grant[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [teamSnapshot, grantSnapshot, inviteSnapshot] = await Promise.all([
        getDocs(collection(db, 'trainees', traineeId, 'teamMembers')),
        getDocs(collection(db, 'trainees', traineeId, 'grants')),
        getDocs(collection(db, 'trainees', traineeId, 'invites')),
      ])

      const nextTeam: TeamMember[] = teamSnapshot.docs.map(snapshotDoc => {
        const data = snapshotDoc.data()
        return {
          uid: snapshotDoc.id,
          role: data.role,
          displayName: data.displayName ?? '',
          email: data.email ?? '',
          status: data.status ?? 'active',
          invitedAt: data.invitedAt,
          acceptedAt: data.acceptedAt ?? null,
          updatedAt: data.updatedAt,
        }
      })

      const nextGrants: Grant[] = grantSnapshot.docs.map(snapshotDoc => {
        const data = snapshotDoc.data()
        return {
          memberUid: snapshotDoc.id,
          role: data.role,
          active: Boolean(data.active),
          modules: {
            workouts: Boolean(data.modules?.workouts),
            recovery: Boolean(data.modules?.recovery),
            nutrition: Boolean(data.modules?.nutrition),
            wellbeing: Boolean(data.modules?.wellbeing),
            progress: Boolean(data.modules?.progress),
          },
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          inviteCode: data.inviteCode,
        } as Grant
      })

      const nextInvites: Invite[] = inviteSnapshot.docs
        .map(snapshotDoc => {
          const data = snapshotDoc.data()
          return {
            code: snapshotDoc.id,
            traineeId: data.traineeId,
            role: data.role,
            createdBy: data.createdBy,
            status: data.status,
            createdAt: data.createdAt,
            acceptedAt: data.acceptedAt ?? null,
            acceptedByUid: data.acceptedByUid ?? null,
            acceptedByEmail: data.acceptedByEmail ?? null,
            updatedAt: data.updatedAt,
          } as Invite
        })
        .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))

      setTeam(nextTeam)
      setGrants(nextGrants)
      setInvites(nextInvites)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load team access data.')
    } finally {
      setLoading(false)
    }
  }, [traineeId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const members = useMemo<TeamView[]>(() => {
    const grantMap = new Map(grants.map(grant => [grant.memberUid, grant]))
    return team.map(member => ({ ...member, grant: grantMap.get(member.uid) ?? null }))
  }, [grants, team])

  async function createInvite(role: ProfessionalRole): Promise<{ code: string; link: string }> {
    const code = randomInviteCode()
    await setDoc(doc(db, 'trainees', traineeId, 'invites', code), {
      code,
      traineeId,
      role,
      createdBy: currentUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
      acceptedAt: null,
      acceptedByUid: null,
      acceptedByEmail: null,
      updatedAt: serverTimestamp(),
    })
    await fetchData()

    const link = `${window.location.origin}/app/invite?traineeId=${encodeURIComponent(traineeId)}&code=${encodeURIComponent(code)}`
    return { code, link }
  }

  async function toggleModule(memberUid: string, module: ModuleKey, enabled: boolean): Promise<void> {
    await updateDoc(doc(db, 'trainees', traineeId, 'grants', memberUid), {
      [`modules.${module}`]: enabled,
      active: true,
      updatedAt: serverTimestamp(),
    })
    await fetchData()
  }

  async function setGrantActive(memberUid: string, active: boolean): Promise<void> {
    await updateDoc(doc(db, 'trainees', traineeId, 'grants', memberUid), {
      active,
      updatedAt: serverTimestamp(),
    })
    await fetchData()
  }

  async function revokeAccess(memberUid: string): Promise<void> {
    await Promise.all([
      deleteDoc(doc(db, 'trainees', traineeId, 'teamMembers', memberUid)),
      deleteDoc(doc(db, 'trainees', traineeId, 'grants', memberUid)),
    ])
    await fetchData()
  }

  return {
    loading,
    error,
    members,
    invites,
    createInvite,
    toggleModule,
    setGrantActive,
    revokeAccess,
    refetch: fetchData,
  }
}

export async function acceptInvite(params: {
  firestore: Firestore
  traineeId: string
  code: string
  user: { uid: string; email: string; displayName: string; role: ProfessionalRole }
}): Promise<void> {
  const { firestore, traineeId, code, user } = params
  const inviteRef = doc(firestore, 'trainees', traineeId, 'invites', code)
  const inviteSnapshot = await getDoc(inviteRef)

  if (!inviteSnapshot.exists()) {
    throw new Error('Invite not found.')
  }

  const invite = inviteSnapshot.data() as {
    status?: string
    role?: ProfessionalRole
  }

  if (invite.status !== 'pending') {
    throw new Error('Invite is no longer active.')
  }

  if (!invite.role || invite.role !== user.role) {
    throw new Error('Invite role does not match your account role.')
  }

  const noModules: ModulePermissions = {
    workouts: false,
    recovery: false,
    nutrition: false,
    wellbeing: false,
    progress: false,
  }

  await updateDoc(inviteRef, {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
    acceptedByUid: user.uid,
    acceptedByEmail: user.email,
    updatedAt: serverTimestamp(),
  })

  await setDoc(doc(firestore, 'trainees', traineeId, 'teamMembers', user.uid), {
    uid: user.uid,
    role: user.role,
    displayName: user.displayName,
    email: user.email,
    status: 'active',
    invitedAt: inviteSnapshot.data().createdAt ?? serverTimestamp(),
    acceptedAt: serverTimestamp(),
    inviteCode: code,
    updatedAt: serverTimestamp(),
  })

  await setDoc(doc(firestore, 'trainees', traineeId, 'grants', user.uid), {
    memberUid: user.uid,
    role: user.role,
    active: true,
    modules: noModules,
    inviteCode: code,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function createDefaultGrantForMember(params: {
  traineeId: string
  memberUid: string
  role: ProfessionalRole
}): Promise<void> {
  await setDoc(
    doc(db, 'trainees', params.traineeId, 'grants', params.memberUid),
    {
      memberUid: params.memberUid,
      role: params.role,
      active: true,
      modules: defaultModulesForRole(params.role),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}
