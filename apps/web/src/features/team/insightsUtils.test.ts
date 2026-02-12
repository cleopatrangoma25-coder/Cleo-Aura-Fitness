import { describe, expect, it } from 'vitest'
import { countDigestionNotes, buildTrainerMuscleInsights, isWithinLastDays } from './insightsUtils'
import type { Workout, NutritionDay } from '@repo/shared'

describe('insightsUtils', () => {
  it('checks date windows correctly', () => {
    const now = new Date('2026-02-12T00:00:00')
    expect(isWithinLastDays('2026-02-11', 14, now)).toBe(true)
    expect(isWithinLastDays('2026-01-01', 14, now)).toBe(false)
  })

  it('builds trainer muscle insights and heatmap', () => {
    const workouts: Workout[] = [
      {
        id: 'w1',
        title: 'Upper',
        type: 'strength',
        primaryMuscleGroups: ['chest'],
        secondaryMuscleGroups: ['triceps'],
        durationMinutes: 45,
        intensity: 'moderate',
        notes: '',
        date: '2026-02-10',
        createdAt: null,
        updatedAt: null,
      },
      {
        id: 'w2',
        title: 'Lower',
        type: 'strength',
        primaryMuscleGroups: ['quadriceps'],
        secondaryMuscleGroups: ['glutes'],
        durationMinutes: 50,
        intensity: 'intense',
        notes: '',
        date: '2026-02-09',
        createdAt: null,
        updatedAt: null,
      },
    ]

    const result = buildTrainerMuscleInsights(workouts, 14, new Date('2026-02-12T00:00:00'))
    expect(result.recentWorkouts).toHaveLength(2)
    expect(result.topMuscles.length).toBeGreaterThan(0)
    expect(result.heatmap.find(item => item.key === 'chest')?.count).toBe(1)
  })

  it('counts digestion-related notes', () => {
    const entries: NutritionDay[] = [
      {
        id: '20260211',
        date: '2026-02-11',
        mealsOnTrack: true,
        mealQuality: 'good',
        hydration: 'moderate',
        notes: 'Some bloating today',
        createdAt: null,
        updatedAt: null,
      },
      {
        id: '20260212',
        date: '2026-02-12',
        mealsOnTrack: true,
        mealQuality: 'great',
        hydration: 'high',
        notes: 'Energy was good',
        createdAt: null,
        updatedAt: null,
      },
    ]

    expect(countDigestionNotes(entries)).toBe(1)
  })
})
