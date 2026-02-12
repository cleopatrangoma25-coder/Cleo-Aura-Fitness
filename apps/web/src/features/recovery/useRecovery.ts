import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Recovery, CreateRecoveryInput } from '@repo/shared'
import { queryKeys } from '../../lib/queryKeys'

const MAX_RECOVERY_RESULTS = 180

async function fetchEntries(traineeId: string): Promise<Recovery[]> {
  const q = query(
    collection(db, 'trainees', traineeId, 'recovery'),
    orderBy('date', 'desc'),
    limit(MAX_RECOVERY_RESULTS)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      type: data.type,
      notes: data.notes ?? '',
      date:
        data.date instanceof Timestamp
          ? data.date.toDate().toISOString().split('T')[0]!
          : String(data.date),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  })
}

export function useRecovery(traineeId: string, enabled = true) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.recovery(traineeId)

  const {
    data: entries = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchEntries(traineeId),
    enabled,
  })

  const addRecoveryMutation = useMutation({
    mutationFn: async (input: CreateRecoveryInput) => {
      const docRef = await addDoc(collection(db, 'trainees', traineeId, 'recovery'), {
        ...input,
        date: Timestamp.fromDate(new Date(input.date + 'T00:00:00')),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  async function addRecovery(input: CreateRecoveryInput): Promise<string> {
    return addRecoveryMutation.mutateAsync(input)
  }

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to load recovery entries.'
    : null

  return { entries, loading, error, addRecovery, refetch }
}
