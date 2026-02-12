import { useCallback, useEffect, useState } from 'react'
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

const MAX_WEARABLE_RESULTS = 120

export function useWearablesSummary(traineeId: string, enabled = true) {
  const [entries, setEntries] = useState<WearableSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    if (!enabled) {
      setEntries([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const q = query(
        collection(db, 'trainees', traineeId, 'wearablesSummary'),
        orderBy('date', 'desc'),
        limit(MAX_WEARABLE_RESULTS)
      )
      const snapshot = await getDocs(q)
      const results: WearableSummary[] = snapshot.docs.map(snapshotDoc => {
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
      setEntries(results)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load wearable summaries.')
    } finally {
      setLoading(false)
    }
  }, [enabled, traineeId])

  useEffect(() => {
    void fetchEntries()
  }, [fetchEntries])

  async function persistSummary(input: UpsertWearableSummaryInput): Promise<void> {
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

  async function upsertSummary(input: UpsertWearableSummaryInput): Promise<void> {
    await persistSummary(input)
    await fetchEntries()
  }

  async function upsertManySummaries(inputs: UpsertWearableSummaryInput[]): Promise<void> {
    for (const input of inputs) {
      await persistSummary(input)
    }

    await fetchEntries()
  }

  return { entries, loading, error, upsertSummary, upsertManySummaries, refetch: fetchEntries }
}
