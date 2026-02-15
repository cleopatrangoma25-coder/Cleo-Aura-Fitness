import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import type { CreateProgressMeasurementInput, ProgressMeasurement } from '@repo/shared'
import { db } from '../../lib/firebase'
import { queryKeys } from '../../lib/queryKeys'

const MAX_PROGRESS_RESULTS = 120

async function fetchEntries(traineeId: string): Promise<ProgressMeasurement[]> {
  const q = query(
    collection(db, 'trainees', traineeId, 'progressMeasurements'),
    orderBy('date', 'desc'),
    limit(MAX_PROGRESS_RESULTS)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(snapshotDoc => {
    const data = snapshotDoc.data()
    return {
      id: snapshotDoc.id,
      date:
        data.date instanceof Timestamp
          ? data.date.toDate().toISOString().split('T')[0]!
          : String(data.date),
      bodyWeightKg: data.bodyWeightKg ?? null,
      bodyFatPct: data.bodyFatPct ?? null,
      waistCm: data.waistCm ?? null,
      hipsCm: data.hipsCm ?? null,
      chestCm: data.chestCm ?? null,
      thighsCm: data.thighsCm ?? null,
      armsCm: data.armsCm ?? null,
      squat1RmKg: data.squat1RmKg ?? null,
      bench1RmKg: data.bench1RmKg ?? null,
      deadlift1RmKg: data.deadlift1RmKg ?? null,
      notes: data.notes ?? '',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  })
}

export function useProgressMeasurements(traineeId: string, enabled = true) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.progress(traineeId)

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

  const addEntryMutation = useMutation({
    mutationFn: async (input: CreateProgressMeasurementInput) => {
      const docRef = await addDoc(collection(db, 'trainees', traineeId, 'progressMeasurements'), {
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

  async function addEntry(input: CreateProgressMeasurementInput): Promise<string> {
    return addEntryMutation.mutateAsync(input)
  }

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to load progress entries.'
    : null

  return { entries, loading, error, addEntry, refetch }
}
