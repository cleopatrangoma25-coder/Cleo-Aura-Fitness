import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import type { UpsertWearableSummaryInput, WearableSummary } from '@repo/shared'
import { db } from '../../lib/firebase'
import { toDayId } from '../checkin/date'
import { queryKeys } from '../../lib/queryKeys'

const MAX_WEARABLE_RESULTS = 120

async function fetchEntries(traineeId: string): Promise<WearableSummary[]> {
  const q = query(
    collection(db, 'trainees', traineeId, 'wearablesSummary'),
    orderBy('date', 'desc'),
    limit(MAX_WEARABLE_RESULTS)
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
      source: data.source,
      steps: data.steps ?? null,
      activeCaloriesKcal: data.activeCaloriesKcal ?? null,
      workoutMinutes: data.workoutMinutes ?? null,
      avgHeartRateBpm: data.avgHeartRateBpm ?? null,
      restingHeartRateBpm: data.restingHeartRateBpm ?? null,
      sleepHours: data.sleepHours ?? null,
      readinessScore: data.readinessScore ?? null,
      notes: data.notes ?? '',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  })
}

async function persistSummary(traineeId: string, input: UpsertWearableSummaryInput): Promise<void> {
  const dayId = toDayId(input.date)
  const dayRef = doc(db, 'trainees', traineeId, 'wearablesSummary', dayId)
  const existing = await getDoc(dayRef)

  await setDoc(
    dayRef,
    {
      ...input,
      date: Timestamp.fromDate(new Date(input.date + 'T00:00:00')),
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export function useWearablesSummary(traineeId: string, enabled = true) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.wearables(traineeId)

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

  const upsertOneMutation = useMutation({
    mutationFn: (input: UpsertWearableSummaryInput) => persistSummary(traineeId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const upsertManyMutation = useMutation({
    mutationFn: async (inputs: UpsertWearableSummaryInput[]) => {
      for (const input of inputs) {
        await persistSummary(traineeId, input)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  async function upsertSummary(input: UpsertWearableSummaryInput): Promise<void> {
    await upsertOneMutation.mutateAsync(input)
  }

  async function upsertManySummaries(inputs: UpsertWearableSummaryInput[]): Promise<void> {
    await upsertManyMutation.mutateAsync(inputs)
  }

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to load wearable summaries.'
    : null

  return { entries, loading, error, upsertSummary, upsertManySummaries, refetch }
}
