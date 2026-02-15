import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collectionGroup, getDocs, limit, query, where } from 'firebase/firestore'
import type { ModulePermissions, ProfessionalRole } from '@repo/shared'
import { db } from '../../lib/firebase'
import { queryKeys } from '../../lib/queryKeys'

type ClientGrant = {
  traineeId: string
  active: boolean
  modules: ModulePermissions
  role: ProfessionalRole
}

const EMPTY_MODULES: ModulePermissions = {
  workouts: false,
  recovery: false,
  nutrition: false,
  wellbeing: false,
  progress: false,
  wearables: false,
}

async function fetchClients(professionalUid: string): Promise<ClientGrant[]> {
  const q = query(
    collectionGroup(db, 'grants'),
    where('memberUid', '==', professionalUid),
    limit(200)
  )
  const snapshot = await getDocs(q)

  const clientsWithGrants = snapshot.docs.map(grantDoc => {
    const traineeId = grantDoc.ref.parent.parent?.id
    if (!traineeId) return null
    const grantData = grantDoc.data() as {
      active?: boolean
      role?: ProfessionalRole
      modules?: Partial<ModulePermissions>
    }
    return {
      traineeId,
      active: Boolean(grantData.active),
      role: grantData.role ?? 'trainer',
      modules: {
        workouts: Boolean(grantData.modules?.workouts),
        recovery: Boolean(grantData.modules?.recovery),
        nutrition: Boolean(grantData.modules?.nutrition),
        wellbeing: Boolean(grantData.modules?.wellbeing),
        progress: Boolean(grantData.modules?.progress),
        wearables: Boolean(grantData.modules?.wearables),
      },
    } as ClientGrant
  })

  return clientsWithGrants.filter(Boolean) as ClientGrant[]
}

export function useProfessionalClients(professionalUid: string, enabled = true) {
  const queryKey = queryKeys.proClients(professionalUid)

  const {
    data: clients = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchClients(professionalUid),
    enabled,
  })

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to load clients.'
    : null

  const summary = useMemo(() => {
    const active = clients.filter(client => client.active)
    return {
      activeClients: active.length,
      workoutClients: active.filter(client => client.modules.workouts).length,
      recoveryClients: active.filter(client => client.modules.recovery).length,
      nutritionClients: active.filter(client => client.modules.nutrition).length,
      wellbeingClients: active.filter(client => client.modules.wellbeing).length,
      progressClients: active.filter(client => client.modules.progress).length,
      wearablesClients: active.filter(client => client.modules.wearables).length,
    }
  }, [clients])

  return { clients, loading, error, summary, refetch, emptyModules: EMPTY_MODULES }
}
