import type { MuscleGroup, ProgressMeasurement, Recovery, Workout } from '@repo/shared'

export type WeeklyRollup = {
  weekKey: string
  workouts: number
  intenseWorkouts: number
  recovery: number
  progressEntries: number
  avgWorkoutDuration: number | null
}

export function formatWeekKey(date: Date): string {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() + 4 - (copy.getDay() || 7))
  const yearStart = new Date(copy.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((copy.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7)
  return `${copy.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function pearsonCorrelation(pairs: Array<{ x: number; y: number }>): number | null {
  if (pairs.length < 3) return null
  const xs = pairs.map(pair => pair.x)
  const ys = pairs.map(pair => pair.y)
  const xMean = xs.reduce((sum, value) => sum + value, 0) / xs.length
  const yMean = ys.reduce((sum, value) => sum + value, 0) / ys.length

  let numerator = 0
  let xDen = 0
  let yDen = 0
  for (let index = 0; index < pairs.length; index += 1) {
    const xDiff = xs[index]! - xMean
    const yDiff = ys[index]! - yMean
    numerator += xDiff * yDiff
    xDen += xDiff * xDiff
    yDen += yDiff * yDiff
  }
  if (xDen === 0 || yDen === 0) return null
  return Number((numerator / Math.sqrt(xDen * yDen)).toFixed(2))
}

export function buildWeeklyRollups(
  workouts: Workout[],
  recovery: Recovery[],
  progress: ProgressMeasurement[]
): WeeklyRollup[] {
  const map = new Map<string, WeeklyRollup>()
  const durations = new Map<string, { sum: number; count: number }>()

  function ensure(date: string): WeeklyRollup {
    const key = formatWeekKey(new Date(date + 'T00:00:00'))
    if (!map.has(key)) {
      map.set(key, {
        weekKey: key,
        workouts: 0,
        intenseWorkouts: 0,
        recovery: 0,
        progressEntries: 0,
        avgWorkoutDuration: null,
      })
    }
    return map.get(key)!
  }

  for (const workout of workouts) {
    const rollup = ensure(workout.date)
    rollup.workouts += 1
    if (workout.intensity === 'intense') rollup.intenseWorkouts += 1
    if (typeof workout.durationMinutes === 'number') {
      const key = rollup.weekKey
      const next = durations.get(key) ?? { sum: 0, count: 0 }
      next.sum += workout.durationMinutes
      next.count += 1
      durations.set(key, next)
    }
  }
  for (const item of recovery) ensure(item.date).recovery += 1
  for (const item of progress) ensure(item.date).progressEntries += 1

  return Array.from(map.values())
    .map(rollup => {
      const duration = durations.get(rollup.weekKey)
      return {
        ...rollup,
        avgWorkoutDuration:
          duration && duration.count > 0 ? Number((duration.sum / duration.count).toFixed(1)) : null,
      }
    })
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey))
}

export function buildMuscleBalanceSeries(workouts: Workout[]) {
  const weekly = new Map<string, Record<MuscleGroup, number>>()
  for (const workout of workouts) {
    const key = formatWeekKey(new Date(workout.date + 'T00:00:00'))
    const row =
      weekly.get(key) ??
      {
        chest: 0,
        back: 0,
        shoulders: 0,
        biceps: 0,
        triceps: 0,
        forearms: 0,
        core: 0,
        glutes: 0,
        quadriceps: 0,
        hamstrings: 0,
        calves: 0,
        hip_flexors: 0,
        full_body: 0,
      }
    for (const group of workout.primaryMuscleGroups) row[group] += 2
    for (const group of workout.secondaryMuscleGroups) row[group] += 1
    weekly.set(key, row)
  }

  const keys = Array.from(weekly.keys()).sort((a, b) => a.localeCompare(b))
  return keys.map(weekKey => ({ weekKey, groups: weekly.get(weekKey)! }))
}
