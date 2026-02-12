import { useCallback, useEffect, useMemo, useState } from 'react'
import { collectionGroup, getDocs, limit, query, where } from 'firebase/firestore'
import type { ModulePermissions, ProfessionalRole } from '@repo/shared'
import { db } from '../../lib/firebase'

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

export function useProfessionalClients(professionalUid: string, enabled = true) {
  const [clients, setClients] = useState<ClientGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    if (!enabled) {
      setClients([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
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

      setClients(clientsWithGrants.filter(Boolean) as ClientGrant[])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load clients.')
    } finally {
      setLoading(false)
    }
  }, [enabled, professionalUid])

  useEffect(() => {
    void fetchClients()
  }, [fetchClients])

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

  return { clients, loading, error, summary, refetch: fetchClients, emptyModules: EMPTY_MODULES }
}
