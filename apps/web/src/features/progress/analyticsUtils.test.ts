import { describe, expect, it } from 'vitest'
import type { ProgressMeasurement, Recovery, Workout } from '@repo/shared'
import {
  buildMuscleBalanceSeries,
  buildWeeklyRollups,
  formatWeekKey,
  pearsonCorrelation,
} from './analyticsUtils'

const workouts: Workout[] = [
  {
    id: 'w1',
    title: 'Push',
    type: 'strength',
    primaryMuscleGroups: ['chest'],
    secondaryMuscleGroups: ['triceps'],
    durationMinutes: 45,
    intensity: 'intense',
    notes: '',
    date: '2026-02-10',
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 'w2',
    title: 'Legs',
    type: 'strength',
    primaryMuscleGroups: ['quadriceps'],
    secondaryMuscleGroups: ['glutes'],
    durationMinutes: 55,
    intensity: 'moderate',
    notes: '',
    date: '2026-02-12',
    createdAt: null,
    updatedAt: null,
  },
]

const recovery: Recovery[] = [
  {
    id: 'r1',
    type: 'rest_day',
    notes: '',
    date: '2026-02-13',
    createdAt: null,
    updatedAt: null,
  },
]

const progress: ProgressMeasurement[] = [
  {
    id: 'p1',
    date: '2026-02-11',
    bodyWeightKg: 68,
    bodyFatPct: 24,
    waistCm: 73,
    hipsCm: null,
    chestCm: null,
    thighsCm: null,
    armsCm: null,
    squat1RmKg: 80,
    bench1RmKg: 45,
    deadlift1RmKg: 100,
    notes: '',
    createdAt: null,
    updatedAt: null,
  },
]

describe('analyticsUtils', () => {
  it('formats ISO week keys', () => {
    const week = formatWeekKey(new Date('2026-02-12T00:00:00'))
    expect(week).toMatch(/^2026-W\d{2}$/)
  })

  it('computes pearson correlation', () => {
    const value = pearsonCorrelation([
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
    ])
    expect(value).not.toBeNull()
    expect(value! > 0.9).toBe(true)
  })

  it('builds weekly rollups', () => {
    const rollups = buildWeeklyRollups(workouts, recovery, progress)
    expect(rollups.length).toBeGreaterThan(0)
    expect(rollups[0]?.workouts).toBeGreaterThan(0)
  })

  it('builds muscle balance series', () => {
    const series = buildMuscleBalanceSeries(workouts)
    expect(series.length).toBeGreaterThan(0)
    expect(series[0]?.groups.chest).toBeGreaterThan(0)
  })
})
