import { describe, it, expect } from 'vitest'
import { WorkoutSchema, CreateWorkoutSchema, MuscleGroupEnum } from './workout'

describe('WorkoutSchema', () => {
  it('validates a complete workout', () => {
    const result = WorkoutSchema.safeParse({
      id: 'w1',
      title: 'Upper Body Push',
      type: 'strength',
      primaryMuscleGroups: ['chest', 'shoulders'],
      secondaryMuscleGroups: ['triceps'],
      durationMinutes: 45,
      intensity: 'moderate',
      notes: 'Felt strong today',
      date: '2026-02-11',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const result = WorkoutSchema.safeParse({
      id: 'w1',
      type: 'strength',
      primaryMuscleGroups: ['chest'],
      date: '2026-02-11',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty primaryMuscleGroups', () => {
    const result = WorkoutSchema.safeParse({
      id: 'w1',
      title: 'Leg Day',
      type: 'strength',
      primaryMuscleGroups: [],
      date: '2026-02-11',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid muscle group', () => {
    const result = WorkoutSchema.safeParse({
      id: 'w1',
      title: 'Leg Day',
      type: 'strength',
      primaryMuscleGroups: ['invalid_muscle'],
      date: '2026-02-11',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid workout type', () => {
    const result = WorkoutSchema.safeParse({
      id: 'w1',
      title: 'Leg Day',
      type: 'swimming',
      primaryMuscleGroups: ['quadriceps'],
      date: '2026-02-11',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(false)
  })

  it('allows nullable optional fields', () => {
    const result = WorkoutSchema.safeParse({
      id: 'w1',
      title: 'Quick Run',
      type: 'cardio',
      primaryMuscleGroups: ['full_body'],
      durationMinutes: null,
      intensity: null,
      date: '2026-02-11',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(true)
  })
})

describe('CreateWorkoutSchema', () => {
  it('validates workout creation input without id or timestamps', () => {
    const result = CreateWorkoutSchema.safeParse({
      title: 'Leg Day',
      type: 'strength',
      primaryMuscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
      date: '2026-02-11',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const result = CreateWorkoutSchema.safeParse({
      title: '',
      type: 'strength',
      primaryMuscleGroups: ['chest'],
      date: '2026-02-11',
    })
    expect(result.success).toBe(false)
  })
})

describe('MuscleGroupEnum', () => {
  it('accepts all valid muscle groups', () => {
    const groups = [
      'chest',
      'back',
      'shoulders',
      'biceps',
      'triceps',
      'forearms',
      'core',
      'glutes',
      'quadriceps',
      'hamstrings',
      'calves',
      'hip_flexors',
      'full_body',
    ]
    for (const group of groups) {
      expect(MuscleGroupEnum.safeParse(group).success).toBe(true)
    }
  })

  it('rejects invalid muscle group', () => {
    expect(MuscleGroupEnum.safeParse('abs').success).toBe(false)
  })
})
