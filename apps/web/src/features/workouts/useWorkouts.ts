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
import type { Workout, CreateWorkoutInput } from '@repo/shared'
import { queryKeys } from '../../lib/queryKeys'

const MAX_WORKOUT_RESULTS = 180

async function fetchWorkouts(traineeId: string): Promise<Workout[]> {
  const q = query(
    collection(db, 'trainees', traineeId, 'workouts'),
    orderBy('date', 'desc'),
    limit(MAX_WORKOUT_RESULTS)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => {
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
}

export function useWorkouts(traineeId: string, enabled = true) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.workouts(traineeId)

  const {
    data: workouts = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchWorkouts(traineeId),
    enabled,
  })

  const addWorkoutMutation = useMutation({
    mutationFn: async (input: CreateWorkoutInput) => {
      const docRef = await addDoc(collection(db, 'trainees', traineeId, 'workouts'), {
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

  async function addWorkout(input: CreateWorkoutInput): Promise<string> {
    return addWorkoutMutation.mutateAsync(input)
  }

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to load workouts.'
    : null

  return { workouts, loading, error, addWorkout, refetch }
}
