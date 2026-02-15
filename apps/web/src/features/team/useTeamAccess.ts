import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
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
import { queryKeys } from '../../lib/queryKeys'

export const MODULE_LABELS: Record<ModuleKey, string> = {
  workouts: 'Workouts',
  recovery: 'Recovery',
  nutrition: 'Nutrition',
  wellbeing: 'Wellbeing',
  progress: 'Progress',
  wearables: 'Wearable Summary',
}

type TeamView = TeamMember & { grant: Grant | null }

function randomInviteCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

const INVITE_TTL_DAYS = 7

async function fetchTeamData(traineeId: string) {
  const [teamSnapshot, grantSnapshot, inviteSnapshot] = await Promise.all([
    getDocs(collection(db, 'trainees', traineeId, 'teamMembers')),
    getDocs(collection(db, 'trainees', traineeId, 'grants')),
    getDocs(collection(db, 'trainees', traineeId, 'invites')),
  ])

  const team: TeamMember[] = teamSnapshot.docs.map(snapshotDoc => {
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

  const grants: Grant[] = grantSnapshot.docs.map(snapshotDoc => {
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
        wearables: Boolean(data.modules?.wearables),
      },
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      inviteCode: data.inviteCode,
    } as Grant
  })

  const invites: Invite[] = inviteSnapshot.docs
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
        expiresAt: data.expiresAt,
      } as Invite
    })
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))

  return { team, grants, invites }
}

export function useTeamAccess(traineeId: string, currentUserId: string) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.teamAccess(traineeId)

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchTeamData(traineeId),
  })

  const team = data?.team ?? []
  const grants = data?.grants ?? []
  const invites = data?.invites ?? []

  const members = useMemo<TeamView[]>(() => {
    const grantMap = new Map(grants.map(grant => [grant.memberUid, grant]))
    return team.map(member => ({ ...member, grant: grantMap.get(member.uid) ?? null }))
  }, [grants, team])

  const createInviteMutation = useMutation({
    mutationFn: async (role: ProfessionalRole) => {
      const code = randomInviteCode()
      await setDoc(doc(db, 'trainees', traineeId, 'invites', code), {
        code,
        traineeId,
        role,
        createdBy: currentUserId,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
        acceptedAt: null,
        acceptedByUid: null,
        acceptedByEmail: null,
        updatedAt: serverTimestamp(),
      })
      const link = `${window.location.origin}/app/invite?traineeId=${encodeURIComponent(traineeId)}&code=${encodeURIComponent(code)}`
      return { code, link }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const toggleModuleMutation = useMutation({
    mutationFn: async ({
      memberUid,
      module,
      enabled,
    }: {
      memberUid: string
      module: ModuleKey
      enabled: boolean
    }) => {
      await updateDoc(doc(db, 'trainees', traineeId, 'grants', memberUid), {
        [`modules.${module}`]: enabled,
        active: true,
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const setGrantActiveMutation = useMutation({
    mutationFn: async ({ memberUid, active }: { memberUid: string; active: boolean }) => {
      await updateDoc(doc(db, 'trainees', traineeId, 'grants', memberUid), {
        active,
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const revokeAccessMutation = useMutation({
    mutationFn: async (memberUid: string) => {
      await Promise.all([
        deleteDoc(doc(db, 'trainees', traineeId, 'teamMembers', memberUid)),
        deleteDoc(doc(db, 'trainees', traineeId, 'grants', memberUid)),
      ])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  async function createInvite(role: ProfessionalRole): Promise<{ code: string; link: string }> {
    return createInviteMutation.mutateAsync(role)
  }

  async function toggleModule(
    memberUid: string,
    module: ModuleKey,
    enabled: boolean
  ): Promise<void> {
    await toggleModuleMutation.mutateAsync({ memberUid, module, enabled })
  }

  async function setGrantActive(memberUid: string, active: boolean): Promise<void> {
    await setGrantActiveMutation.mutateAsync({ memberUid, active })
  }

  async function revokeAccess(memberUid: string): Promise<void> {
    await revokeAccessMutation.mutateAsync(memberUid)
  }

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to load team access data.'
    : null

  return {
    loading,
    error,
    members,
    invites,
    createInvite,
    toggleModule,
    setGrantActive,
    revokeAccess,
    refetch,
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
    expiresAt?: Timestamp
    traineeId?: string
  }

  if (invite.status !== 'pending') {
    throw new Error('Invite is no longer active.')
  }

  if (!invite.role || invite.role !== user.role) {
    throw new Error('Invite role does not match your account role.')
  }

  const expiresAt = invite.expiresAt?.toMillis?.()
  if (expiresAt && expiresAt <= Date.now()) {
    throw new Error('Invite has expired.')
  }

  const noModules: ModulePermissions = {
    workouts: false,
    recovery: false,
    nutrition: false,
    wellbeing: false,
    progress: false,
    wearables: false,
  }

  await updateDoc(inviteRef, {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
    acceptedByUid: user.uid,
    acceptedByEmail: user.email,
    traineeId,
    role: invite.role ?? user.role,
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
