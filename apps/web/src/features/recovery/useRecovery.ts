import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Recovery, CreateRecoveryInput } from '@repo/shared'

export function useRecovery(traineeId: string, enabled = true) {
  const [entries, setEntries] = useState<Recovery[]>([])
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
      const q = query(collection(db, 'trainees', traineeId, 'recovery'), orderBy('date', 'desc'))
      const snapshot = await getDocs(q)
      const results: Recovery[] = snapshot.docs.map(doc => {
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
      setEntries(results)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load recovery entries.')
    } finally {
      setLoading(false)
    }
  }, [enabled, traineeId])

  useEffect(() => {
    void fetchEntries()
  }, [fetchEntries])

  async function addRecovery(input: CreateRecoveryInput): Promise<string> {
    const docRef = await addDoc(collection(db, 'trainees', traineeId, 'recovery'), {
      ...input,
      date: Timestamp.fromDate(new Date(input.date + 'T00:00:00')),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await fetchEntries()
    return docRef.id
  }

  return { entries, loading, error, addRecovery, refetch: fetchEntries }
}
