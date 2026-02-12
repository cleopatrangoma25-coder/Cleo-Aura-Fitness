import { MUSCLE_GROUP_LABELS, type MuscleGroup, type NutritionDay, type Workout } from '@repo/shared'

export function isWithinLastDays(isoDate: string, days: number, now = new Date()): boolean {
  const target = new Date(isoDate + 'T00:00:00')
  const diffMs = now.getTime() - target.getTime()
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000
}

export function buildTrainerMuscleInsights(workouts: Workout[], days: number, now = new Date()) {
  const recentWorkouts = workouts.filter(workout => isWithinLastDays(workout.date, days, now))
  const muscleCounts = new Map<MuscleGroup, number>()

  for (const workout of recentWorkouts) {
    for (const muscle of [...workout.primaryMuscleGroups, ...workout.secondaryMuscleGroups]) {
      muscleCounts.set(muscle, (muscleCounts.get(muscle) ?? 0) + 1)
    }
  }

  const topMuscles = Array.from(muscleCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const maxCount = Math.max(...Array.from(muscleCounts.values()), 0)
  const heatmap = (Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).map(group => {
    const count = muscleCounts.get(group) ?? 0
    return {
      key: group,
      label: MUSCLE_GROUP_LABELS[group],
      count,
      ratio: maxCount > 0 ? count / maxCount : 0,
    }
  })

  return { recentWorkouts, topMuscles, heatmap }
}

export function countDigestionNotes(entries: NutritionDay[]): number {
  const digestionKeywords = ['digestion', 'digest', 'bloat', 'bloating', 'stomach', 'gut']
  return entries.filter(entry =>
    digestionKeywords.some(keyword => entry.notes.toLowerCase().includes(keyword))
  ).length
}
