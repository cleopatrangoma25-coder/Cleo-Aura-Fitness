import { useCallback, useEffect, useState } from 'react'
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

const MAX_PROGRESS_RESULTS = 120

export function useProgressMeasurements(traineeId: string, enabled = true) {
  const [entries, setEntries] = useState<ProgressMeasurement[]>([])
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
        collection(db, 'trainees', traineeId, 'progressMeasurements'),
        orderBy('date', 'desc'),
        limit(MAX_PROGRESS_RESULTS)
      )
      const snapshot = await getDocs(q)
      const results: ProgressMeasurement[] = snapshot.docs.map(snapshotDoc => {
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
      setEntries(results)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load progress entries.')
    } finally {
      setLoading(false)
    }
  }, [enabled, traineeId])

  useEffect(() => {
    void fetchEntries()
  }, [fetchEntries])

  async function addEntry(input: CreateProgressMeasurementInput): Promise<string> {
    const docRef = await addDoc(collection(db, 'trainees', traineeId, 'progressMeasurements'), {
      ...input,
      date: Timestamp.fromDate(new Date(input.date + 'T00:00:00')),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await fetchEntries()
    return docRef.id
  }

  return { entries, loading, error, addEntry, refetch: fetchEntries }
}
