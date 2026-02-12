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
import type { Workout, CreateWorkoutInput } from '@repo/shared'

export function useWorkouts(traineeId: string, enabled = true) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkouts = useCallback(async () => {
    if (!enabled) {
      setWorkouts([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const q = query(collection(db, 'trainees', traineeId, 'workouts'), orderBy('date', 'desc'))
      const snapshot = await getDocs(q)
      const results: Workout[] = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title,
          type: data.type,
          primaryMuscleGroups: data.primaryMuscleGroups ?? [],
          secondaryMuscleGroups: data.secondaryMuscleGroups ?? [],
          durationMinutes: data.durationMinutes ?? null,
          intensity: data.intensity ?? null,
          notes: data.notes ?? '',
          date:
            data.date instanceof Timestamp
              ? data.date.toDate().toISOString().split('T')[0]!
              : String(data.date),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }
      })
      setWorkouts(results)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load workouts.')
    } finally {
      setLoading(false)
    }
  }, [enabled, traineeId])

  useEffect(() => {
    void fetchWorkouts()
  }, [fetchWorkouts])

  async function addWorkout(input: CreateWorkoutInput): Promise<string> {
    const docRef = await addDoc(collection(db, 'trainees', traineeId, 'workouts'), {
      ...input,
      date: Timestamp.fromDate(new Date(input.date + 'T00:00:00')),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await fetchWorkouts()
    return docRef.id
  }

  return { workouts, loading, error, addWorkout, refetch: fetchWorkouts }
}
