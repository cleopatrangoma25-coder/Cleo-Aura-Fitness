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
import { db } from '../../lib/firebase'
import type { UpsertWellbeingDayInput, WellbeingDay } from '@repo/shared'
import { toDayId } from '../checkin/date'

const MAX_WELLBEING_RESULTS = 120

export function useWellbeingDays(traineeId: string, enabled = true) {
  const [entries, setEntries] = useState<WellbeingDay[]>([])
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
        collection(db, 'trainees', traineeId, 'wellbeingDays'),
        orderBy('date', 'desc'),
        limit(MAX_WELLBEING_RESULTS)
      )
      const snapshot = await getDocs(q)
      const results: WellbeingDay[] = snapshot.docs.map(snapshotDoc => {
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
      setEntries(results)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load wellbeing days.')
    } finally {
      setLoading(false)
    }
  }, [enabled, traineeId])

  useEffect(() => {
    void fetchEntries()
  }, [fetchEntries])

  async function upsertWellbeingDay(input: UpsertWellbeingDayInput): Promise<void> {
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

    await fetchEntries()
  }

  return { entries, loading, error, upsertWellbeingDay, refetch: fetchEntries }
}
