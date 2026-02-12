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
import { db } from '../../lib/firebase'
import type { UpsertWellbeingDayInput, WellbeingDay } from '@repo/shared'
import { toDayId } from '../checkin/date'
import { queryKeys } from '../../lib/queryKeys'

const MAX_WELLBEING_RESULTS = 120

async function fetchEntries(traineeId: string): Promise<WellbeingDay[]> {
  const q = query(
    collection(db, 'trainees', traineeId, 'wellbeingDays'),
    orderBy('date', 'desc'),
    limit(MAX_WELLBEING_RESULTS)
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
      mood: Number(data.mood),
      stress: Number(data.stress),
      energy: Number(data.energy),
      sleepQuality: Number(data.sleepQuality),
      notes: data.notes ?? '',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  })
}

export function useWellbeingDays(traineeId: string, enabled = true) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.wellbeing(traineeId)

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

  const upsertMutation = useMutation({
    mutationFn: async (input: UpsertWellbeingDayInput) => {
      const dayId = toDayId(input.date)
      const dayRef = doc(db, 'trainees', traineeId, 'wellbeingDays', dayId)
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  async function upsertWellbeingDay(input: UpsertWellbeingDayInput): Promise<void> {
    await upsertMutation.mutateAsync(input)
  }

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to load wellbeing days.'
    : null

  return { entries, loading, error, upsertWellbeingDay, refetch }
}
