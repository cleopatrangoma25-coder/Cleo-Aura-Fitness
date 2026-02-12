import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { NutritionDay, UpsertNutritionDayInput } from '@repo/shared'
import { toDayId } from '../checkin/date'

export function useNutritionDays(traineeId: string, enabled = true) {
  const [entries, setEntries] = useState<NutritionDay[]>([])
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
      const q = query(collection(db, 'trainees', traineeId, 'nutritionDays'), orderBy('date', 'desc'))
      const snapshot = await getDocs(q)
      const results: NutritionDay[] = snapshot.docs.map(snapshotDoc => {
        const data = snapshotDoc.data()
        return {
          id: snapshotDoc.id,
          date:
            data.date instanceof Timestamp
              ? data.date.toDate().toISOString().split('T')[0]!
              : String(data.date),
          mealsOnTrack: Boolean(data.mealsOnTrack),
          mealQuality: data.mealQuality,
          hydration: data.hydration,
          notes: data.notes ?? '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }
      })
      setEntries(results)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load nutrition days.')
    } finally {
      setLoading(false)
    }
  }, [enabled, traineeId])

  useEffect(() => {
    void fetchEntries()
  }, [fetchEntries])

  async function upsertNutritionDay(input: UpsertNutritionDayInput): Promise<void> {
    const dayId = toDayId(input.date)
    const dayRef = doc(db, 'trainees', traineeId, 'nutritionDays', dayId)
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

    await fetchEntries()
  }

  return { entries, loading, error, upsertNutritionDay, refetch: fetchEntries }
}
